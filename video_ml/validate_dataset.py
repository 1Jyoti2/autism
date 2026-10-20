import os
import cv2
import json
from config import DATASET_DIR, CLASSES

def inspect_dataset(dataset_dir=DATASET_DIR):
    print("=" * 60)
    print("      VIDEO DATASET INSPECTION & VALIDATION REPORT      ")
    print("=" * 60)
    
    if not os.path.exists(dataset_dir):
        raise FileNotFoundError(f"Dataset directory not found at: {dataset_dir}")
        
    summary = {}
    total_videos = 0
    valid_videos = 0

    for cls in CLASSES:
        cls_path = os.path.join(dataset_dir, cls)
        if not os.path.exists(cls_path):
            print(f"[WARNING] Class directory missing: {cls_path}")
            continue

        video_files = [f for f in os.listdir(cls_path) if f.lower().endswith(('.mp4', '.avi', '.mov', '.mkv'))]
        summary[cls] = []
        print(f"\nClass '{cls}' ({len(video_files)} video(s) found):")

        for fname in video_files:
            total_videos += 1
            vpath = os.path.join(cls_path, fname)
            cap = cv2.VideoCapture(vpath)

            if not cap.isOpened():
                print(f"  [ERROR] Failed to open video file: {fname}")
                continue

            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration_sec = frame_count / fps if fps > 0 else 0.0
            size_mb = os.path.getsize(vpath) / (1024 * 1024)

            cap.release()
            valid_videos += 1

            info = {
                "filename": fname,
                "path": vpath,
                "resolution": f"{width}x{height}",
                "width": width,
                "height": height,
                "fps": round(fps, 2),
                "frame_count": frame_count,
                "duration_sec": round(duration_sec, 2),
                "size_mb": round(size_mb, 2),
                "valid": True
            }
            summary[cls].append(info)

            print(f"  * {fname[:45]}...")
            print(f"    - Resolution: {width}x{height} | FPS: {fps:.2f} | Frames: {frame_count} | Duration: {duration_sec:.2f}s | Size: {size_mb:.2f}MB")

    print("\n" + "=" * 60)
    print(f"TOTAL VIDEOS INSPECTED: {total_videos} | VALID: {valid_videos}")
    print("=" * 60)
    return summary

if __name__ == "__main__":
    inspect_dataset()
