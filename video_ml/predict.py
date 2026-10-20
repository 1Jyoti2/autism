import os
import sys
import json
import argparse
import cv2
import torch
import torch.nn.functional as F
import numpy as np

# Add current directory to path if needed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    MODEL_PATH,
    CONFIG_PATH,
    CLASS_LABELS_PATH,
    CLASSES,
    CLASS_NAMES,
)
from dataset import extract_clips_from_video
from model import LightweightVideoClassifier

DISCLAIMER_TEXT = (
    "NOTICE: This model is a lightweight ML prototype trained on a small demonstration dataset.\n"
    "It is intended for educational/technical demonstration only and DOES NOT provide medical diagnosis."
)

def inspect_video_metadata(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file (invalid or corrupted format): {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_sec = total_frames / fps if fps > 0 else 0.0
    cap.release()

    return {
        "filename": os.path.basename(video_path),
        "resolution": f"{width}x{height}",
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "duration_sec": round(duration_sec, 2),
    }

def predict_video(video_path, model_path=MODEL_PATH, labels_path=CLASS_LABELS_PATH):
    """
    Performs behavior classification on an MP4 video file.
    Returns prediction dictionary.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained model not found at {model_path}. Please run train.py first.")

    # Load class metadata
    if os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            class_meta = json.load(f)
            class_list = class_meta.get("classes", CLASSES)
            name_map = class_meta.get("class_names", CLASS_NAMES)
    else:
        class_list = CLASSES
        name_map = CLASS_NAMES

    # Load video clips & metadata
    video_meta = inspect_video_metadata(video_path)
    clip_tensors = extract_clips_from_video(video_path, num_clips=8)

    if len(clip_tensors) == 0:
        raise ValueError("Could not extract readable frames from video.")

    video_meta["clips_extracted"] = len(clip_tensors)

    # Load model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = LightweightVideoClassifier(num_classes=len(class_list), freeze_backbone=False).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    clip_probs = []
    with torch.no_grad():
        for clip_tensor in clip_tensors:
            input_tensor = clip_tensor.unsqueeze(0).to(device)  # (1, T, C, H, W)
            logits = model(input_tensor)
            probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()
            clip_probs.append(probs)

    # Average probabilities across clips
    avg_probs = np.mean(clip_probs, axis=0)
    top_idx = int(np.argmax(avg_probs))
    predicted_key = class_list[top_idx]
    predicted_label = name_map.get(predicted_key, predicted_key.replace('_', ' ').title())
    confidence = float(avg_probs[top_idx])

    probabilities = [
        {
            "class_key": c,
            "label": name_map.get(c, c.replace('_', ' ').title()),
            "confidence": float(avg_probs[i])
        }
        for i, c in enumerate(class_list)
    ]
    probabilities.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "video_metadata": video_meta,
        "predicted_behavior": predicted_label,
        "predicted_behavior_key": predicted_key,
        "confidence": round(confidence, 4),
        "confidence_percentage": f"{round(confidence * 100, 2)}%",
        "probabilities": probabilities,
        "disclaimer": DISCLAIMER_TEXT
    }

def main():
    parser = argparse.ArgumentParser(description="Predict motor behavior from an MP4 video file.")
    parser.add_argument("--video", type=str, required=True, help="Path to input MP4 video file.")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format.")
    args = parser.parse_args()

    try:
        results = predict_video(args.video)

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print("\n" + "=" * 60)
            print("         VIDEO BEHAVIOR CLASSIFICATION RESULT         ")
            print("=" * 60)
            meta = results["video_metadata"]
            clean_filename = meta['filename'].encode('ascii', 'ignore').decode('ascii')
            print(f"File       : {clean_filename}")
            print(f"Resolution : {meta['resolution']} | FPS: {meta['fps']} | Duration: {meta['duration_sec']}s")
            print("-" * 60)
            print(f"Predicted Behavior : {results['predicted_behavior']}")
            print(f"Confidence Score   : {results['confidence_percentage']}")
            print("-" * 60)
            print("Behavior Breakdown:")
            for item in results["probabilities"]:
                print(f"  - {item['label']:<16}: {round(item['confidence'] * 100, 2):>6.2f}%")
            print("=" * 60)
            print(f"\n[NOTE]\n{results['disclaimer']}\n")

    except Exception as e:
        print(f"\n[ERROR] Error predicting video: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
