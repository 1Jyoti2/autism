import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np

from config import (
    DATASET_DIR,
    MODEL_PATH,
    CONFIG_PATH,
    CLASS_LABELS_PATH,
    REPORT_PATH,
    CLASSES,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    CLASS_NAMES,
    CLIP_LENGTH,
    FRAME_SIZE,
    SEED,
    EPOCHS,
    BATCH_SIZE,
    LEARNING_RATE,
    WEIGHT_DECAY,
)
from dataset import get_video_splits, VideoClipDataset
from model import LightweightVideoClassifier

def set_seed(seed=SEED):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)

def evaluate_cached(model, loader, device, video_names):
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for feats, labels, idxs in loader:
            feats = feats.to(device)
            outputs = model.classifier(feats)
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            
            all_preds.extend(preds)
            all_targets.extend(labels.numpy())

    # Map back to video names
    video_to_preds = {}
    video_to_target = {}
    for pred, target, idx in zip(all_preds, all_targets, [idx.item() for idx in idxs]):
        vname = video_names[idx]
        if vname not in video_to_preds:
            video_to_preds[vname] = []
            video_to_target[vname] = target
        video_to_preds[vname].append(pred)

    video_final_targets = []
    video_final_preds = []
    for vname, preds in video_to_preds.items():
        counts = np.bincount(preds)
        maj_pred = np.argmax(counts)
        video_final_preds.append(maj_pred)
        video_final_targets.append(video_to_target[vname])

    acc = accuracy_score(video_final_targets, video_final_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        video_final_targets, video_final_preds, average='macro', zero_division=0
    )
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(
        video_final_targets, video_final_preds, average='weighted', zero_division=0
    )

    return {
        "accuracy": float(acc),
        "macro_precision": float(precision),
        "macro_recall": float(recall),
        "macro_f1": float(f1),
        "weighted_precision": float(weighted_p),
        "weighted_recall": float(weighted_r),
        "weighted_f1": float(weighted_f1),
        "video_targets": [int(t) for t in video_final_targets],
        "video_predictions": [int(p) for p in video_final_preds],
        "video_names": list(video_to_preds.keys())
    }

def train():
    set_seed(SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training using device: {device}", flush=True)

    # 1. Prepare video splits (STRICT VIDEO-LEVEL SPLIT)
    train_paths, val_paths = get_video_splits(DATASET_DIR)
    clean_tr = [os.path.basename(p[0]).encode('ascii', 'ignore').decode('ascii')[:30] for p in train_paths]
    clean_va = [os.path.basename(p[0]).encode('ascii', 'ignore').decode('ascii')[:30] for p in val_paths]
    print(f"\n[Dataset Split] Train Videos ({len(train_paths)}): {clean_tr}", flush=True)
    print(f"[Dataset Split] Val Videos   ({len(val_paths)}): {clean_va}", flush=True)

    # 2. Extract Dataset Clips
    print("\nLoading video frames into clip datasets...", flush=True)
    train_dataset = VideoClipDataset(train_paths, is_train=True)
    val_dataset = VideoClipDataset(val_paths, is_train=False)

    print(f"[OK] Extracted Clips -> Train: {len(train_dataset)} clips | Val: {len(val_dataset)} clips", flush=True)

    # 3. Model Initialization
    model = LightweightVideoClassifier(num_classes=len(CLASSES), freeze_backbone=True).to(device)

    # 4. Precompute Temporal Feature Tensors
    print("Precomputing spatial & temporal embeddings with MobileNetV3...", flush=True)
    model.eval()

    def extract_dataset_features(ds):
        loader = DataLoader(ds, batch_size=4, shuffle=False)
        all_feats = []
        all_labels = []
        all_vnames = []
        with torch.no_grad():
            for clips, labels, vnames in loader:
                clips = clips.to(device)
                B, T, C, H, W = clips.shape
                reshaped = clips.view(B * T, C, H, W)
                frame_feats = model.extract_frame_features(reshaped).view(B, T, -1)
                mean_feat = torch.mean(frame_feats, dim=1)
                max_feat, _ = torch.max(frame_feats, dim=1)
                temp_feat = torch.cat([mean_feat, max_feat], dim=1).cpu()
                all_feats.append(temp_feat)
                all_labels.extend(labels)
                all_vnames.extend(vnames)
        return torch.cat(all_feats, dim=0), torch.tensor(all_labels, dtype=torch.long), all_vnames

    train_feats, train_labels, train_vnames = extract_dataset_features(train_dataset)
    val_feats, val_labels, val_vnames = extract_dataset_features(val_dataset)

    train_idx = torch.arange(len(train_labels))
    val_idx = torch.arange(len(val_labels))

    train_loader = DataLoader(TensorDataset(train_feats, train_labels, train_idx), batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(TensorDataset(val_feats, val_labels, val_idx), batch_size=BATCH_SIZE, shuffle=False)

    print("[OK] Features precomputed. Training classification head...", flush=True)

    # 5. Classifier Training Loop
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.classifier.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    best_val_f1 = -1.0
    best_metrics = None

    for epoch in range(1, EPOCHS + 1):
        model.classifier.train()
        total_loss = 0.0

        for feats, labels, _ in train_loader:
            feats = feats.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model.classifier(feats)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * feats.size(0)

        epoch_loss = total_loss / len(train_dataset)
        val_metrics = evaluate_cached(model, val_loader, device, val_vnames)

        print(f"Epoch [{epoch:02d}/{EPOCHS}] | Train Loss: {epoch_loss:.4f} | Val Video Acc: {val_metrics['accuracy']*100:.1f}% | Val Macro F1: {val_metrics['macro_f1']:.4f}", flush=True)

        if val_metrics['macro_f1'] >= best_val_f1:
            best_val_f1 = val_metrics['macro_f1']
            best_metrics = val_metrics
            torch.save(model.state_dict(), MODEL_PATH)

    print("\n" + "=" * 60, flush=True)
    print("                EVALUATION REPORT RESULTS                ", flush=True)
    print("=" * 60, flush=True)
    print(f"Accuracy           : {best_metrics['accuracy'] * 100:.2f}%", flush=True)
    print(f"Precision (Macro)  : {best_metrics['macro_precision'] * 100:.2f}%", flush=True)
    print(f"Recall (Macro)     : {best_metrics['macro_recall'] * 100:.2f}%", flush=True)
    print(f"F1-Score (Macro)   : {best_metrics['macro_f1'] * 100:.2f}%", flush=True)
    print(f"Weighted F1-Score  : {best_metrics['weighted_f1'] * 100:.2f}%", flush=True)
    print("=" * 60, flush=True)

    # Save Class Labels
    with open(CLASS_LABELS_PATH, "w") as f:
        json.dump({
            "classes": CLASSES,
            "class_to_idx": CLASS_TO_IDX,
            "idx_to_class": {str(k): v for k, v in IDX_TO_CLASS.items()},
            "class_names": CLASS_NAMES,
        }, f, indent=2)

    # Save Preprocessing Config
    with open(CONFIG_PATH, "w") as f:
        json.dump({
            "model_architecture": "MobileNetV3-Small + Temporal Pooling MLP",
            "frame_size": FRAME_SIZE,
            "clip_length": CLIP_LENGTH,
            "sample_stride": 4,
            "num_classes": len(CLASSES),
            "classes": CLASSES,
            "disclaimer": "PROTOTYPE MODEL: Trained on a small dataset (6 videos). Intended for prototype demonstration only, not clinical diagnosis."
        }, f, indent=2)

    # Save Full Report
    report_data = {
        "metrics": best_metrics,
        "dataset_summary": {
            "total_videos": len(train_paths) + len(val_paths),
            "train_videos": len(train_paths),
            "val_videos": len(val_paths),
            "classes": CLASSES
        },
        "model_saved": MODEL_PATH,
    }
    with open(REPORT_PATH, "w") as f:
        json.dump(report_data, f, indent=2)

    print(f"\n[OK] Saved best model checkpoint: {MODEL_PATH}", flush=True)
    print(f"[OK] Saved class labels: {CLASS_LABELS_PATH}", flush=True)
    print(f"[OK] Saved config: {CONFIG_PATH}", flush=True)
    print(f"[OK] Saved evaluation report: {REPORT_PATH}", flush=True)

if __name__ == "__main__":
    train()
