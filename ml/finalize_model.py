import json
import shutil
from pathlib import Path

import torch

from config import CLASSES, MODEL_DIR, PLOT_DIR, REPORT_DIR
from models import MODEL_FACTORY

BEST_NAME = "resnet18_pretrained"
BEST_FINAL = MODEL_DIR / "best_model.pt"


def export():
    ckpt = torch.load(MODEL_DIR / f"best_{BEST_NAME}.pt", map_location="cpu", weights_only=False)
    shutil.copyfile(MODEL_DIR / f"best_{BEST_NAME}.pt", BEST_FINAL)

    model = MODEL_FACTORY[BEST_NAME]()
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    dummy = torch.randn(1, 3, 128, 128)
    onnx_path = MODEL_DIR / "best_model.onnx"
    torch.onnx.export(
        model,
        dummy,
        onnx_path,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )
    print("Exported:", onnx_path)
    print("Copy saved:", BEST_FINAL)


def consolidate():
    validation = json.loads((REPORT_DIR / "dataset_validation.json").read_text(encoding="utf-8"))
    test_plain = json.loads((REPORT_DIR / f"test_metrics_{BEST_NAME}.json").read_text(encoding="utf-8"))
    test_tta = json.loads((REPORT_DIR / f"test_metrics_{BEST_NAME}_tta.json").read_text(encoding="utf-8"))

    summary = {
        "final_model": str(BEST_FINAL),
        "onnx_model": str(MODEL_DIR / "best_model.onnx"),
        "input_preprocessing": {
            "resize": [128, 128],
            "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
            "channel_order": "RGB",
        },
        "classes": CLASSES,
        "dataset_validation": {
            "total_images": validation["total_images"],
            "per_split_class_counts": validation["per_split_class_counts"],
            "class_ratio_largest_to_smallest": validation["class_ratios_min_max"]["ratio"],
            "corrupt_count": validation["corrupt_count"],
            "unreadable_count": validation["unreadable_files"],
            "image_size": validation["size_px"],
        },
        "training": {
            "model_architecture": "ResNet18 (ImageNet-pretrained), fine-tuned, batch 96, AdamW",
            "resolution": 128,
            "epochs_total": 12,
            "validation_split_fraction": 0.12,
            "class_balanced_sampling": True,
            "class_weighted_loss": True,
            "best_val_macro_f1": test_plain["best_val_macro_f1"],
            "note": "Internal validation is inflated by augmented-copy identity leakage between train/val (same donor face). The official test split is the reliable generalization estimate.",
        },
        "test_evaluation": {
            "split": "official test folder",
            "requirement_metrics": {
                "accuracy": test_plain["accuracy"],
                "precision_macro": test_plain["precision_macro"],
                "recall_macro": test_plain["recall_macro"],
                "f1_macro": test_plain["f1_macro"],
                "f1_weighted": test_plain["f1_weighted"],
            },
            "per_class": test_plain["per_class"],
            "confusion_matrix": test_plain["confusion_matrix"],
        },
        "test_evaluation_tta": {
            "mode": "6-fold (flip x rotations 0/+8/-8) softmax averaging",
            "accuracy": test_tta["accuracy"],
            "precision_macro": test_tta["precision_macro"],
            "recall_macro": test_tta["recall_macro"],
            "f1_macro": test_tta["f1_macro"],
            "f1_weighted": test_tta["f1_weighted"],
            "per_class": test_tta["per_class"],
        },
        "artifacts": {
            "pytorch_checkpoint": str(BEST_FINAL),
            "onnx_export": str(MODEL_DIR / "best_model.onnx"),
            "history_curve": str(PLOT_DIR / f"history_{BEST_NAME}.png"),
            "confusion_matrix": str(PLOT_DIR / f"confusion_matrix_{BEST_NAME}.png"),
            "test_metrics_json": str(REPORT_DIR / f"test_metrics_{BEST_NAME}.json"),
        },
    }
    out = REPORT_DIR / "FINAL_REPORT.json"
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("Report saved:", out)


if __name__ == "__main__":
    export()
    consolidate()