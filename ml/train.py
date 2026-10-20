import argparse
import csv
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score
from torch.optim.lr_scheduler import ReduceLROnPlateau

from config import (
    BATCH_SCRATCH,
    BATCH_TRANSFER,
    CLASSES,
    EPOCHS_SCRATCH,
    EPOCHS_TRANSFER,
    IMAGENET_MEAN,
    IMAGENET_STD,
    MODEL_DIR,
    N_CLASSES,
    PATIENCE,
    PLOT_DIR,
    TEMP_DIR,
    TEST_CACHE,
    TRAIN_CACHE,
    VAL_FRACTION,
)
from dataset import balanced_sampler, class_weights_from, loader_for, make_datasets, set_seed
from models import MODEL_FACTORY

LR = {"scratch_cnn": 2e-3, "resnet18_pretrained": 2.5e-4}


def compute_metrics(preds, labels):
    n = N_CLASSES
    per_class = {}
    for cls in range(n):
        tp = sum(1 for p, l in zip(preds, labels) if p == cls and l == cls)
        fp = sum(1 for p, l in zip(preds, labels) if p == cls and l != cls)
        fn = sum(1 for p, l in zip(preds, labels) if p != cls and l == cls)
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
        per_class[cls] = {"precision": prec, "recall": rec, "f1": f1, "support": tp + fn}
    total = sum(v["support"] for v in per_class.values()) or 1
    macro = sum(v["f1"] for v in per_class.values()) / n
    weighted = sum(v["f1"] * v["support"] for v in per_class.values()) / total
    return {
        "accuracy": accuracy_score(labels, preds),
        "macro_f1": macro,
        "weighted_f1": weighted,
        "per_class": per_class,
    }


def run_epoch(model, loader, criterion, optimizer, device, train=True):
    if train:
        model.train()
    else:
        model.eval()
    total, correct = 0, 0
    running_loss = 0.0
    preds_all, labels_all = [], []
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        if train:
            optimizer.zero_grad(set_to_none=True)
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
        else:
            with torch.no_grad():
                logits = model(images)
                loss = criterion(logits, labels)
        running_loss += loss.item() * images.size(0)
        pred = logits.argmax(dim=1)
        total += labels.size(0)
        correct += (pred == labels).sum().item()
        preds_all.extend(pred.cpu().tolist())
        labels_all.extend(labels.cpu().tolist())
    accuracy = correct / total
    macro_f1 = compute_metrics(preds_all, labels_all)["macro_f1"]
    return running_loss / total, accuracy, macro_f1


def plot_curves(history, tag):
    epochs = [h["epoch"] for h in history]
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    axes[0].plot(epochs, [h["train_loss"] for h in history], label="train loss")
    axes[0].plot(epochs, [h["val_loss"] for h in history], label="val loss")
    axes[0].set_title("Loss")
    axes[0].legend()
    axes[1].plot(epochs, [h["train_acc"] for h in history], label="train acc")
    axes[1].plot(epochs, [h["val_acc"] for h in history], label="val acc")
    axes[1].plot(epochs, [h["train_f1"] for h in history], label="train macro-F1")
    axes[1].plot(epochs, [h["val_f1"] for h in history], label="val macro-F1")
    axes[1].set_title("Accuracy & macro-F1")
    axes[1].legend()
    fig.tight_layout()
    out = PLOT_DIR / f"history_{tag}.png"
    fig.savefig(out, dpi=140)
    plt.close(fig)
    return out


def save_best(model_name, state, best_f1, history):
    save_path = MODEL_DIR / f"best_{model_name}.pt"
    torch.save(
        {
            "model_name": model_name,
            "state_dict": state,
            "classes": CLASSES,
            "num_classes": N_CLASSES,
            "mean": IMAGENET_MEAN,
            "std": IMAGENET_STD,
            "val_macro_f1": best_f1,
            "history": history,
        },
        save_path,
    )
    return save_path


def save_resume(model_name, payload):
    torch.save(payload, TEMP_DIR / f"resume_{model_name}.pt")


def load_resume(model_name):
    path = TEMP_DIR / f"resume_{model_name}.pt"
    if path.exists():
        return torch.load(path, map_location="cpu", weights_only=False)
    return None


def train(model_name, resume=False, balanced=False, lr_override=None, epochs_override=None):
    set_seed()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    batch = BATCH_TRANSFER if model_name == "resnet18_pretrained" else BATCH_SCRATCH
    epochs = epochs_override or (EPOCHS_TRANSFER if model_name == "resnet18_pretrained" else EPOCHS_SCRATCH)

    train_ds, val_ds, test_ds = make_datasets(TRAIN_CACHE, TEST_CACHE, VAL_FRACTION)
    if balanced:
        train_loader = loader_for(train_ds, batch, shuffle=False)
        train_loader = torch.utils.data.DataLoader(
            train_ds,
            batch_size=batch,
            sampler=balanced_sampler(train_ds.targets),
            num_workers=0,
        )
    else:
        train_loader = loader_for(train_ds, batch, True)
    val_loader = loader_for(val_ds, batch, False)

    model = MODEL_FACTORY[model_name]()
    model.to(device)
    counts = class_weights_from(train_ds.targets)
    criterion = nn.CrossEntropyLoss(weight=counts.to(device))
    lr = lr_override or LR[model_name]
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)

    start_epoch = 1
    history = []
    best_f1 = -1.0
    best_state = None
    epochs_since_best = 0

    if resume:
        ckpt = load_resume(model_name)
        if ckpt is not None:
            model.load_state_dict(ckpt["model_state"])
            optimizer.load_state_dict(ckpt["optimizer_state"])
            if lr_override is not None:
                for group in optimizer.param_groups:
                    group["lr"] = lr_override
            scheduler.load_state_dict(ckpt["scheduler_state"])
            start_epoch = ckpt["epoch"] + 1
            history = ckpt["history"]
            best_f1 = ckpt["best_f1"]
            best_state = ckpt["best_state"]
            epochs_since_best = ckpt["epochs_since_best"]
            print(f"Resumed {model_name} from epoch {ckpt['epoch']} (best val F1 {best_f1:.4f})")

    if start_epoch > 1:
        epochs = start_epoch + epochs - 1

    log_file = TEMP_DIR / f"run_{model_name}.log"
    with open(log_file, "a", encoding="utf-8") as logf:
        logf.write(f"=== {model_name} train start (resume={resume}, device={device}) ===\n")
        for epoch in range(start_epoch, epochs + 1):
            tr_loss, tr_acc, tr_f1 = run_epoch(
                model, train_loader, criterion, optimizer, device, train=True
            )
            va_loss, va_acc, va_f1 = run_epoch(
                model, val_loader, criterion, optimizer, device, train=False
            )
            scheduler.step(va_f1)
            history.append(
                {
                    "epoch": epoch,
                    "train_loss": round(tr_loss, 4),
                    "train_acc": round(tr_acc, 4),
                    "train_f1": round(tr_f1, 4),
                    "val_loss": round(va_loss, 4),
                    "val_acc": round(va_acc, 4),
                    "val_f1": round(va_f1, 4),
                    "lr": optimizer.param_groups[0]["lr"],
                }
            )
            improved = va_f1 > best_f1
            if improved:
                best_f1 = va_f1
                best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
                epochs_since_best = 0
                save_best(model_name, best_state, best_f1, history)
            else:
                epochs_since_best += 1
            save_resume(
                model_name,
                {
                    "model_state": {k: v.cpu() for k, v in model.state_dict().items()},
                    "optimizer_state": optimizer.state_dict(),
                    "scheduler_state": scheduler.state_dict(),
                    "epoch": epoch,
                    "history": history,
                    "best_f1": best_f1,
                    "best_state": best_state,
                    "epochs_since_best": epochs_since_best,
                },
            )
            line = (
                f"[{model_name}] epoch {epoch:>2}/{epochs}  tr_loss={tr_loss:.4f} "
                f"tr_acc={tr_acc:.4f} tr_f1={tr_f1:.4f} | va_loss={va_loss:.4f} "
                f"va_acc={va_acc:.4f} va_f1={va_f1:.4f}" + ("  <- best" if improved else "")
            )
            print(line)
            logf.write(line + "\n")
            logf.flush()
            if epochs_since_best >= PATIENCE:
                print(f"Early stopping at epoch {epoch} (no improvement for {PATIENCE} epochs).")
                logf.write(f"Early stopping at epoch {epoch}\n")
                break

    hist_file = TEMP_DIR / f"history_{model_name}.csv"
    with open(hist_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(history[0].keys()))
        writer.writeheader()
        writer.writerows(history)

    curve = plot_curves(history, model_name)
    best_path = save_best(model_name, best_state, best_f1, history)
    return {
        "model_name": model_name,
        "best_val_macro_f1": best_f1,
        "history_file": str(hist_file),
        "curve_plot": str(curve),
        "model_path": str(best_path),
        "test_size": len(test_ds),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("model", choices=list(MODEL_FACTORY.keys()))
    parser.add_argument("--threads", type=int, default=None)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--balanced", action="store_true")
    parser.add_argument("--lr", type=float, default=None)
    parser.add_argument("--epochs", type=int, default=None)
    args = parser.parse_args()
    if args.threads:
        torch.set_num_threads(args.threads)
    result = train(args.model, resume=args.resume, balanced=args.balanced, lr_override=args.lr, epochs_override=args.epochs)
    print(json.dumps(result, default=str))