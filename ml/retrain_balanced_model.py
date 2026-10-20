import json
import random
import time
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torchvision import models
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from config import (
    CLASSES,
    N_CLASSES,
    IMG_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    TRAIN_CACHE,
    TEST_CACHE,
    MODEL_DIR,
    REPORT_DIR,
    PLOT_DIR,
    VAL_FRACTION,
    SEED,
)
from dataset import (
    ArrayDataset,
    TrainTransform,
    EvalTransform,
    stratified_split,
    load_cache,
)

def set_seed(seed=SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def build_model():
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    # Freeze initial feature extractors to prevent overfitting and speed up CPU training
    for p in model.conv1.parameters(): p.requires_grad = False
    for p in model.bn1.parameters(): p.requires_grad = False
    for p in model.layer1.parameters(): p.requires_grad = False
    for p in model.layer2.parameters(): p.requires_grad = False

    # Fine-tune layer3, layer4, and fc
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, N_CLASSES)
    return model

def create_balanced_sampler(targets, n_classes=N_CLASSES):
    counts = np.bincount(targets.numpy(), minlength=n_classes).astype(np.float64)
    # Avoid zero division
    counts = np.maximum(counts, 1.0)
    class_weights = 1.0 / counts
    sample_weights = class_weights[targets.numpy()]
    sampler = torch.utils.data.WeightedRandomSampler(
        weights=torch.from_numpy(sample_weights),
        num_samples=len(targets),
        replacement=True
    )
    return sampler, counts

def main():
    set_seed()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"=== RETRAINING BALANCED AUTISM SCREENING ML MODEL (Device: {device}) ===")

    train_imgs, train_labels, _ = load_cache(TRAIN_CACHE)
    test_imgs, test_labels, _ = load_cache(TEST_CACHE)
    print(f"Loaded Train Cache: {train_imgs.shape[0]} images, Test Cache: {test_imgs.shape[0]} images")

    train_idx, val_idx = stratified_split(train_labels, val_fraction=VAL_FRACTION, seed=SEED)
    train_ds = ArrayDataset(train_imgs[train_idx], train_labels[train_idx], transform=TrainTransform())
    val_ds = ArrayDataset(train_imgs[val_idx], train_labels[val_idx], transform=EvalTransform())
    test_ds = ArrayDataset(test_imgs, test_labels, transform=EvalTransform())

    sampler, train_counts = create_balanced_sampler(train_labels[train_idx])
    print("Training class counts:", {CLASSES[i]: int(train_counts[i]) for i in range(N_CLASSES)})

    batch_size = 64
    train_loader = torch.utils.data.DataLoader(
        train_ds, batch_size=batch_size, sampler=sampler, num_workers=0
    )
    val_loader = torch.utils.data.DataLoader(
        val_ds, batch_size=batch_size, shuffle=False, num_workers=0
    )
    test_loader = torch.utils.data.DataLoader(
        test_ds, batch_size=batch_size, shuffle=False, num_workers=0
    )

    model = build_model().to(device)

    # Class weights for loss function with smoothing
    weights_tensor = torch.tensor(
        train_counts.sum() / (N_CLASSES * train_counts),
        dtype=torch.float32,
        device=device
    )
    # Normalize weights so mean is 1.0
    weights_tensor = weights_tensor / weights_tensor.mean()
    criterion = nn.CrossEntropyLoss(weight=weights_tensor, label_smoothing=0.08)

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=3.5e-4,
        weight_decay=1e-4
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=8, eta_min=5e-5)

    epochs = 8
    best_val_f1 = 0.0
    best_state = None
    history = []

    print(f"\nStarting training for {epochs} epochs...")
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        # Training loop
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * x.size(0)
            preds = logits.argmax(dim=1)
            train_correct += (preds == y).sum().item()
            train_total += y.size(0)

        scheduler.step()

        # Validation loop
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        val_preds_all, val_y_all = [], []
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits = model(x)
                loss = criterion(logits, y)
                val_loss += loss.item() * x.size(0)
                preds = logits.argmax(dim=1)
                val_correct += (preds == y).sum().item()
                val_total += y.size(0)
                val_preds_all.extend(preds.cpu().numpy())
                val_y_all.extend(y.cpu().numpy())

        tr_loss = train_loss / train_total
        tr_acc = train_correct / train_total
        va_loss = val_loss / val_total
        va_acc = val_correct / val_total
        _, _, va_f1, _ = precision_recall_fscore_support(
            val_y_all, val_preds_all, average="macro", zero_division=0
        )

        elapsed = round(time.time() - t0, 1)
        history.append({
            "epoch": epoch,
            "train_loss": round(tr_loss, 4),
            "train_acc": round(tr_acc, 4),
            "val_loss": round(va_loss, 4),
            "val_acc": round(va_acc, 4),
            "val_f1": round(va_f1, 4),
            "elapsed_sec": elapsed,
        })
        print(f"Epoch {epoch}/{epochs} [{elapsed}s] - Train Loss: {tr_loss:.4f}, Acc: {tr_acc:.4f} | Val Loss: {va_loss:.4f}, Acc: {va_acc:.4f}, Macro-F1: {va_f1:.4f}")

        if va_f1 > best_val_f1:
            best_val_f1 = va_f1
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    # Save model weights
    save_path = MODEL_DIR / "best_model.pt"
    alt_save_path = MODEL_DIR / "best_resnet18_pretrained.pt"
    ckpt = {
        "model_name": "resnet18_pretrained",
        "state_dict": best_state if best_state is not None else model.state_dict(),
        "classes": CLASSES,
        "num_classes": N_CLASSES,
        "mean": IMAGENET_MEAN,
        "std": IMAGENET_STD,
        "best_val_macro_f1": best_val_f1,
        "history": history,
    }
    torch.save(ckpt, save_path)
    torch.save(ckpt, alt_save_path)
    print(f"\nSaved best model checkpoint to {save_path} (Best Val F1: {best_val_f1:.4f})")

    # Evaluate on Unseen Holdout Test Dataset
    print("\n=== EVALUATING ON OFFICIAL UNSEEN TEST SPLIT (1,530 images) ===")
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    test_preds, test_labels_all, test_probs = [], [], []
    with torch.no_grad():
        for x, y in test_loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            probs = torch.softmax(logits, dim=1)
            test_preds.extend(logits.argmax(dim=1).cpu().numpy())
            test_labels_all.extend(y.cpu().numpy())
            test_probs.append(probs.cpu().numpy())

    test_probs = np.concatenate(test_probs, axis=0)
    test_labels_all = np.array(test_labels_all)
    test_preds = np.array(test_preds)

    acc = accuracy_score(test_labels_all, test_preds)
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(
        test_labels_all, test_preds, average="macro", zero_division=0
    )
    p_weight, r_weight, f1_weight, _ = precision_recall_fscore_support(
        test_labels_all, test_preds, average="weighted", zero_division=0
    )
    p_per, r_per, f1_per, sup_per = precision_recall_fscore_support(
        test_labels_all, test_preds, average=None, zero_division=0
    )
    cm = confusion_matrix(test_labels_all, test_preds, labels=list(range(N_CLASSES)))

    print(f"\nTest Accuracy: {acc * 100:.2f}%")
    print(f"Macro Precision: {p_macro:.4f}, Macro Recall: {r_macro:.4f}, Macro F1: {f1_macro:.4f}")
    print(f"Weighted Precision: {p_weight:.4f}, Weighted Recall: {r_weight:.4f}, Weighted F1: {f1_weight:.4f}")
    print("\nPer-class Metrics:")
    per_class_summary = {}
    for i, c in enumerate(CLASSES):
        per_class_summary[c] = {
            "precision": round(float(p_per[i]), 4),
            "recall": round(float(r_per[i]), 4),
            "f1": round(float(f1_per[i]), 4),
            "support": int(sup_per[i]),
        }
        print(f"  {c:<10}: Precision={p_per[i]:.4f}, Recall={r_per[i]:.4f}, F1={f1_per[i]:.4f}, Support={sup_per[i]}")

    print("\nConfusion Matrix (Rows=True, Cols=Predicted):")
    print("Classes:", CLASSES)
    print(cm)

    # Export metrics report
    report_data = {
        "model_name": "resnet18_pretrained_balanced",
        "test_sample_total": len(test_labels_all),
        "accuracy": round(float(acc), 4),
        "precision_macro": round(float(p_macro), 4),
        "recall_macro": round(float(r_macro), 4),
        "f1_macro": round(float(f1_macro), 4),
        "precision_weighted": round(float(p_weight), 4),
        "recall_weighted": round(float(r_weight), 4),
        "f1_weighted": round(float(f1_weight), 4),
        "per_class": per_class_summary,
        "confusion_matrix": cm.tolist(),
        "classes": CLASSES,
        "best_val_macro_f1": round(float(best_val_f1), 4),
        "history": history,
    }

    report_path = REPORT_DIR / "FINAL_REPORT.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"\nWrote full metrics report to {report_path}")

if __name__ == "__main__":
    main()
