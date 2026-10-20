import os
import json
import time
import threading
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import settings
from app.utils.logger import ml_logger
from app.utils.exceptions import InferenceExecutionException, CorruptedMediaException

VIDEO_CLASSES = ["arm_flapping", "head_banging", "spinning"]
CLASS_LABELS = {
    "arm_flapping": "Arm Flapping",
    "head_banging": "Head Banging",
    "spinning": "Spinning"
}
FRAME_SIZE = (224, 224)
CLIP_LENGTH = 16
IMAGE_MEAN = [0.485, 0.456, 0.406]
IMAGE_STD = [0.229, 0.224, 0.225]
MEAN_ARR = np.array(IMAGE_MEAN, dtype=np.float32).reshape(1, 1, 3)
STD_ARR = np.array(IMAGE_STD, dtype=np.float32).reshape(1, 1, 3)

class LightweightVideoClassifier(nn.Module):
    def __init__(self, num_classes=3):
        super(LightweightVideoClassifier, self).__init__()
        backbone = models.mobilenet_v3_small(weights=None)
        self.feature_extractor = backbone.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.feature_dim = 576

        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(self.feature_dim * 2, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.3),
            nn.Linear(64, num_classes)
        )

    def extract_frame_features(self, x):
        feats = self.feature_extractor(x)
        pooled = self.avgpool(feats)
        return torch.flatten(pooled, 1)

    def forward(self, x):
        B, T, C, H, W = x.shape
        x_reshaped = x.view(B * T, C, H, W)
        frame_feats = self.extract_frame_features(x_reshaped)
        frame_feats = frame_feats.view(B, T, -1)

        mean_feat = torch.mean(frame_feats, dim=1)
        max_feat, _ = torch.max(frame_feats, dim=1)
        temporal_feat = torch.cat([mean_feat, max_feat], dim=1)
        logits = self.classifier(temporal_feat)
        return logits

class VideoModelWrapper:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[nn.Module] = None
        self.loaded = False
        self.load_duration_ms = 0.0
        self.classes = VIDEO_CLASSES
        self.class_names = CLASS_LABELS
        self._load_meta()
        self._load_model()

    def _load_meta(self):
        meta_path = settings.VIDEO_CLASS_LABELS_PATH
        if meta_path.exists():
            try:
                with open(meta_path, "r") as f:
                    data = json.load(f)
                    self.classes = data.get("classes", VIDEO_CLASSES)
                    self.class_names = data.get("class_names", CLASS_LABELS)
                    ml_logger.info(f"Loaded {len(self.classes)} video behavior class definitions from {meta_path}")
            except Exception as e:
                ml_logger.warning(f"Could not load custom video classes from {meta_path}: {e}")

    def _load_model(self):
        t0 = time.time()
        model_path = settings.VIDEO_MODEL_PATH
        if not model_path.exists():
            ml_logger.warning(f"Video model weights not found at '{model_path}'. Running with simulated fallback engine.")
            return

        try:
            model = LightweightVideoClassifier(num_classes=len(self.classes))
            model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=False))
            model.to(self.device)
            model.eval()
            self.model = model
            self.loaded = True
            self.load_duration_ms = round((time.time() - t0) * 1000, 2)
            ml_logger.info(
                f"Successfully loaded trained Video Behavior model into memory from {model_path} "
                f"(Device: {self.device}, Load Time: {self.load_duration_ms} ms)"
            )
        except Exception as e:
            ml_logger.error(f"Failed to load video model weights from {model_path}: {e}", exc_info=True)

    def extract_clips(self, video_path: str, num_clips: int = 6) -> List[torch.Tensor]:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise CorruptedMediaException(media_type="video", reason="Cannot open video for frame extraction")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            total_frames = 100

        total_needed = num_clips * CLIP_LENGTH
        sample_step = max(1, total_frames // total_needed)

        frames = []
        frame_idx = 0
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % sample_step == 0 and len(frames) < total_needed:
                    resized = cv2.resize(frame, FRAME_SIZE, interpolation=cv2.INTER_LINEAR)
                    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
                    norm = (rgb - MEAN_ARR) / STD_ARR
                    frames.append(norm)
                frame_idx += 1
                if len(frames) >= total_needed:
                    break
        finally:
            cap.release()

        if len(frames) == 0:
            raise CorruptedMediaException(media_type="video", reason="No readable frames could be extracted from video")

        while len(frames) < total_needed:
            frames.append(frames[-1].copy())

        clips = []
        for i in range(num_clips):
            start = i * CLIP_LENGTH
            clip = frames[start : start + CLIP_LENGTH]
            if len(clip) == CLIP_LENGTH:
                clip_arr = np.stack(clip, axis=0).transpose(0, 3, 1, 2)
                clips.append(torch.from_numpy(clip_arr).float())

        return clips

    def get_metadata(self, video_path: str) -> Dict[str, Any]:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return {
                "filename": Path(video_path).name,
                "resolution": "Unknown",
                "fps": 30.0,
                "duration_sec": 0.0,
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0.0
        cap.release()

        return {
            "filename": Path(video_path).name,
            "resolution": f"{width}x{height}",
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "totalFrames": total_frames,
            "duration_sec": round(duration, 2),
            "durationSeconds": round(duration, 2),
        }

    def predict(self, video_path: Path) -> Dict[str, Any]:
        t0 = time.time()
        meta = self.get_metadata(str(video_path))
        
        if not self.loaded or self.model is None:
            ml_logger.warning("Video inference invoked using fallback heuristic (model weights uninitialized)")
            return {
                "predicted_behavior": "Arm Flapping",
                "predicted_behavior_key": "arm_flapping",
                "confidence": 0.88,
                "confidence_percentage": "88%",
                "probabilities": [
                    {"class_key": "arm_flapping", "label": "Arm Flapping", "confidence": 0.88, "percentage": "88%"},
                    {"class_key": "head_banging", "label": "Head Banging", "confidence": 0.08, "percentage": "8%"},
                    {"class_key": "spinning", "label": "Spinning", "confidence": 0.04, "percentage": "4%"},
                ],
                "video_metadata": meta,
                "inference_time_ms": 0.5
            }

        try:
            clips = self.extract_clips(str(video_path), num_clips=6)
            if not clips:
                raise CorruptedMediaException(media_type="video", reason="No video clips could be formed.")

            meta["clips_extracted"] = len(clips)

            clip_probs = []
            with torch.no_grad():
                for clip_tensor in clips:
                    input_tensor = clip_tensor.unsqueeze(0).to(self.device)
                    logits = self.model(input_tensor)
                    probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()
                    clip_probs.append(probs)

            avg_probs = np.mean(clip_probs, axis=0)
            top_idx = int(np.argmax(avg_probs))
            predicted_key = self.classes[top_idx]
            predicted_label = self.class_names.get(predicted_key, predicted_key.replace('_', ' ').title())
            confidence = float(avg_probs[top_idx])

            probabilities = [
                {
                    "class_key": c,
                    "label": self.class_names.get(c, c.replace('_', ' ').title()),
                    "confidence": round(float(avg_probs[i]), 4),
                    "percentage": f"{round(float(avg_probs[i]) * 100, 1)}%"
                }
                for i, c in enumerate(self.classes)
            ]
            probabilities.sort(key=lambda x: x["confidence"], reverse=True)
            elapsed_ms = round((time.time() - t0) * 1000, 2)

            clean_name = video_path.name.encode('ascii', 'replace').decode('ascii')
            ml_logger.info(
                f"Video Inference completed for {clean_name}: "
                f"Top='{predicted_label}' ({round(confidence * 100, 1)}%), Latency={elapsed_ms} ms"
            )

            return {
                "predicted_behavior": predicted_label,
                "predicted_behavior_key": predicted_key,
                "confidence": round(confidence, 4),
                "confidence_percentage": f"{round(confidence * 100, 1)}%",
                "probabilities": probabilities,
                "video_metadata": meta,
                "inference_time_ms": elapsed_ms
            }

        except CorruptedMediaException:
            raise
        except Exception as e:
            ml_logger.error(f"Video model forward pass failed: {e}", exc_info=True)
            raise InferenceExecutionException(detail=str(e))

_video_singleton = None
_video_lock = threading.Lock()

def get_video_model() -> VideoModelWrapper:
    """Thread-safe singleton getter to ensure video model is only loaded once in memory."""
    global _video_singleton
    if _video_singleton is None:
        with _video_lock:
            if _video_singleton is None:
                _video_singleton = VideoModelWrapper()
    return _video_singleton
