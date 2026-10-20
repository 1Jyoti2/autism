import argparse
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.metrics import confusion_matrix
from torch.utils.data import DataLoader, Dataset
from torchvision.transforms import functional as F

from config import CLASSES, MODEL_DIR, PLOT_DIR, REPORT_DIR, TEST_CACHE
from dataset import load_cache
from models import MODEL_FACTORY
from train import compute_metrics

TTA_ANGLES = (0, 8, -8)


class RawTestDS(Dataset):
    def __init__(self, cache_file):
        imgs, labels, _ = load_cache(cache_file)
        self.imgs = imgs
        self.labels = labels

    def __len__(self):
        return len(self.imgs)

    def __getitem__(self, idx):
        return self.imgs[idx], self.labels[idx]


def load_model(model_name):
    ckpt = torch.load(MODEL_DIR / f"best_{model_name}.pt", map_location="cpu", weights_only=False)
    model = MODEL_FACTORY[model_name]()
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    return model, ckpt


def main(model_name):
    model, ckpt = load_model(model_name)
    labels = load_cache(TEST_CACHE)[1]
    loader = DataLoader(RawTestDS(TEST_CACHE), batch_size=1, shuffle=False, num_workers=0)

    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    preds, probs = [], []
    with torch.no_grad():
        for x, y in loader:
            x = (x.float() / 255.0 - mean) / std
            xf = torch.flip(x, dims=[2])
            votes = []
            for angle in TTA_ANGLES:
                votes.append(torch.softmax(model(F.rotate(x, angle, interpolation=F.InterpolationMode.BILINEAR)), dim=1))
                votes.append(torch.softmax(model(F.rotate(xf, angle, interpolation=F.InterpolationMode.BILINEAR)), dim=1))
            p = torch.cat(votes).mean(dim=0)
            probs.append(p.cpu().numpy())
            preds.append(p.argmax().item())
    probs = np.array(probs)

    metrics = compute_metrics(preds, labels.tolist())
    cm = confusion_matrix(labels.tolist(), preds, labels=list(range(len(CLASSES))))
    per_class = {
        CLASSES[i]: {
            "precision": round(metrics["per_class"][i]["precision"], 4),
            "recall": round(metrics["per_class"][i]["recall"], 4),
            "f1": round(metrics["per_class"][i]["f1"], 4),
            "support": int(metrics["per_class"][i]["support"]),
        }
        for i in range(len(CLASSES))
    }
    result = {
        "model_name": model_name,
        "mode": "test-time-augmentation",
        "test_sample_total": len(labels),
        "accuracy": round(metrics["accuracy"], 4),
        "precision_macro": round(float(np.mean([p["precision"] for p in per_class.values()])), 4),
        "recall_macro": round(float(np.mean([p["recall"] for p in per_class.values()])), 4),
        "f1_macro": round(metrics["macro_f1"], 4),
        "f1_weighted": round(metrics["weighted_f1"], 4),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "best_val_macro_f1": ckpt.get("val_macro_f1"),
    }
    out_json = REPORT_DIR / f"test_metrics_{model_name}_tta.json"
    out_json.write_text(json.dumps(result, indent=2), encoding="utf-8")

    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    ax.figure.colorbar(im, ax=ax)
    ax.set(
        xticks=np.arange(len(CLASSES)),
        yticks=np.arange(len(CLASSES)),
        xticklabels=CLASSES,
        yticklabels=CLASSES,
        xlabel="Predicted",
        ylabel="True",
        title=f"Confusion matrix (TTA) — {model_name}",
    )
    thresh = cm.max() / 2.0
    for i in range(len(CLASSES)):
        for j in range(len(CLASSES)):
            ax.text(
                j,
                i,
                format(cm[i, j], "d"),
                ha="center",
                va="center",
                color="white" if cm[i, j] > thresh else "black",
                fontsize=9,
            )
    fig.tight_layout()
    out_png = PLOT_DIR / f"confusion_matrix_{model_name}_tta.png"
    fig.savefig(out_png, dpi=150)
    plt.close(fig)

    print("=" * 72)
    print(f"EVALUATION WITH TEST-TIME AUGMENTATION — {model_name}")
    print("=" * 72)
    print(f"Test samples : {result['test_sample_total']}")
    print(f"Accuracy     : {result['accuracy']:.4f}")
    print(f"Precision    : {result['precision_macro']:.4f} (macro)")
    print(f"Recall       : {result['recall_macro']:.4f} (macro)")
    print(f"F1           : {result['f1_macro']:.4f} (macro)   {result['f1_weighted']:.4f} (weighted)")
    print()
    print(f"{'class':<10}{'precision':>12}{'recall':>10}{'f1':>10}{'support':>10}")
    for cls in CLASSES:
        row = per_class[cls]
        print(f"{cls:<10}{row['precision']:>12.4f}{row['recall']:>10.4f}{row['f1']:>10.4f}{row['support']:>10d}")
    print(f"\nSaved: {out_json}")
    print(f"Saved: {out_png}")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("model", choices=list(MODEL_FACTORY.keys()))
    args = parser.parse_args()
    main(args.model)