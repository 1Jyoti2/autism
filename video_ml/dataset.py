import os
import cv2
import torch
from torch.utils.data import Dataset
import numpy as np
import torchvision.transforms as T
from config import DATASET_DIR, CLASSES, CLASS_TO_IDX, FRAME_SIZE, CLIP_LENGTH, IMAGE_MEAN, IMAGE_STD

# Fast numpy-based ImageNet normalization
MEAN_ARR = np.array(IMAGE_MEAN, dtype=np.float32).reshape(1, 1, 3)
STD_ARR = np.array(IMAGE_STD, dtype=np.float32).reshape(1, 1, 3)

def extract_clips_from_video(video_path, clip_len=CLIP_LENGTH, frame_size=FRAME_SIZE, num_clips=6):
    """
    Fast uniform video frame sampling:
    - Reads video frames.
    - Resizes to (224, 224) directly in OpenCV.
    - Subsamples `clip_len` frames evenly across the video.
    - Returns clips as float32 tensors (T, C, H, W).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    frames = []
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Subsample step to read at most ~200 frames total per video
    sample_step = max(1, total_frames // (num_clips * clip_len * 2))

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_step == 0:
            resized = cv2.resize(frame, frame_size, interpolation=cv2.INTER_LINEAR)
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
            norm = (rgb - MEAN_ARR) / STD_ARR
            frames.append(norm)
        frame_idx += 1
    cap.release()

    if len(frames) == 0:
        return []

    # Pad if needed
    while len(frames) < clip_len:
        frames.append(frames[-1].copy())

    # Sample uniform clips
    total_samples = len(frames)
    clip_step = max(1, (total_samples - clip_len) // max(1, num_clips - 1))
    
    clips = []
    for start in range(0, total_samples - clip_len + 1, clip_step):
        clip = frames[start : start + clip_len]
        # Convert clip (T, H, W, C) -> torch tensor (T, C, H, W)
        clip_arr = np.stack(clip, axis=0).transpose(0, 3, 1, 2)  # (T, C, H, W)
        clips.append(torch.from_numpy(clip_arr).float())
        if len(clips) >= num_clips:
            break

    return clips

class VideoClipDataset(Dataset):
    def __init__(self, video_paths, is_train=True):
        self.samples = []
        for vpath, label in video_paths:
            clean_name = os.path.basename(vpath).encode('ascii', 'ignore').decode('ascii')
            print(f"   Extracting clips from {clean_name[:40]}...", flush=True)
            clips = extract_clips_from_video(vpath, num_clips=8 if is_train else 8)
            for clip_tensor in clips:
                self.samples.append((clip_tensor, label, os.path.basename(vpath)))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        clip_tensor, label, video_name = self.samples[idx]
        return clip_tensor, torch.tensor(label, dtype=torch.long), video_name

def get_video_splits(dataset_dir=DATASET_DIR):
    """
    Splits dataset BY VIDEO (not by frame) into train and test sets.
    Returns: train_paths [(path, label)], val_paths [(path, label)]
    """
    train_paths = []
    val_paths = []

    for cls_name in CLASSES:
        cls_dir = os.path.join(dataset_dir, cls_name)
        if not os.path.isdir(cls_dir):
            continue
        vfiles = sorted([os.path.join(cls_dir, f) for f in os.listdir(cls_dir) if f.lower().endswith('.mp4')])
        label = CLASS_TO_IDX[cls_name]

        # 1st video to Train, 2nd video to Val/Test for strict video-level evaluation
        if len(vfiles) >= 2:
            train_paths.append((vfiles[0], label))
            val_paths.append((vfiles[1], label))
        elif len(vfiles) == 1:
            train_paths.append((vfiles[0], label))
            val_paths.append((vfiles[0], label))

    return train_paths, val_paths
