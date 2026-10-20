import json
from collections import Counter

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix

from config import CLASSES, MODEL_DIR, PLOT_DIR, REPORT_DIR, TEST_CACHE, TRAIN_CACHE
from dataset import loader_for, make_datasets
from models import MODEL_FACTORY
from train import compute_metrics


def load_model(model_name):
    ckpt = torch.load(MODEL_DIR / f"best_{model_name}.pt", map_location="cpu", weights_only=False)
    model = MODEL_FACTORY[model_name]()
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    return model, ckpt


def evaluate_model(model_name, device=None):
    device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, ckpt = load_model(model_name)
    model.to(device)
    _, _, test_ds = make_datasets(TRAIN_CACHE, TEST_CACHE, 0.12)
    test_loader = loader_for(test_ds, 64, False)

    preds_all, labels_all, probs_all = [], [], []
    with torch.no_grad():
        for images, labels in test_loader:
            logits = model(images.to(device))
            probs = torch.softmax(logits, dim=1)
            preds_all.extend(logits.argmax(dim=1).cpu().tolist())
            labels_all.extend(labels.tolist())
            probs_all.append(probs.cpu().numpy())
    probs_all = np.concatenate(probs_all, axis=0)

    metrics = compute_metrics(preds_all, labels_all)
    cm = confusion_matrix(labels_all, preds_all, labels=list(range(len(CLASSES))))
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
        "test_sample_total": len(labels_all),
        "accuracy": round(metrics["accuracy"], 4),
        "precision_macro": round(float(np.mean([metrics["per_class"][i]["precision"] for i in range(len(CLASSES))])), 4),
        "recall_macro": round(float(np.mean([metrics["per_class"][i]["recall"] for i in range(len(CLASSES))])), 4),
        "f1_macro": round(metrics["macro_f1"], 4),
        "f1_weighted": round(metrics["weighted_f1"], 4),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "best_val_macro_f1": ckpt.get("val_macro_f1"),
    }

    report_path = REPORT_DIR / f"test_metrics_{model_name}.json"
    report_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

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
        title=f"Confusion matrix — {model_name}",
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
    cm_path = PLOT_DIR / f"confusion_matrix_{model_name}.png"
    fig.savefig(cm_path, dpi=150)
    plt.close(fig)

    print("=" * 72)
    print(f"EVALUATION ON HOLDOUT TEST SPLIT — {model_name}")
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
    print(f"\nConfusion matrix:\n{np.array2string(cm, max_line_width=160)}")
    print(f"\nSaved: {report_path}")
    print(f"Saved: {cm_path}")
    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("model", choices=list(MODEL_FACTORY.keys()))
    args = parser.parse_args()
    evaluate_model(args.model)