import os
import sys
import torch
import numpy as np
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.ml.emotion_model import EmotionModelWrapper, get_emotion_model, EMOTION_CLASSES
from app.ml.video_model import VideoModelWrapper, get_video_model, VIDEO_CLASSES, CLASS_LABELS
from app.services.inference_service import InferenceService
from app.utils.exceptions import UnsupportedMediaFormatException, CorruptedMediaException, EmptyMediaFileException

workspace_dir = backend_dir.parent

def run_ml_audit():
    print("================================================================================")
    print("      LIVE VALIDATION OF TRAINED PYTORCH ML MODELS & INFERENCE PIPELINE         ")
    print("================================================================================\n")

    # ---------------------------------------------------------------------------------
    # SECTION 1: FACIAL EMOTION MODEL (ml/models/best_model.pt)
    # ---------------------------------------------------------------------------------
    print("--- [SECTION 1] Facial Emotion Recognition Model (best_model.pt) ---")
    
    emotion_model_path = settings.EMOTION_MODEL_PATH
    print(f"1.1 Target Model Path: {emotion_model_path}")
    assert emotion_model_path.exists(), f"Emotion model file missing at {emotion_model_path}"
    print(f"    [OK] File exists. Size: {emotion_model_path.stat().st_size} bytes ({round(emotion_model_path.stat().st_size / (1024*1024), 2)} MB)")

    # Test Model Loading
    wrapper = EmotionModelWrapper()
    assert wrapper.loaded is True, "Failed to load emotion model"
    assert wrapper.model is not None, "Model object is None"
    assert next(wrapper.model.parameters()).device.type in ["cuda", "cpu"], "Invalid device"
    print(f"1.2 Model Loading: Successfully loaded ResNet18 ({wrapper.load_duration_ms} ms) on {wrapper.device}")

    # Verify Output Architecture & Parameters
    fc_out_features = wrapper.model.fc.out_features
    assert fc_out_features == len(EMOTION_CLASSES), f"Expected {len(EMOTION_CLASSES)} output features, got {fc_out_features}"
    print(f"1.3 Output Layer: Verified fc.out_features = {fc_out_features} matching classes: {EMOTION_CLASSES}")

    # Test Inference Across ALL Available Emotion Classes from Test Dataset
    dataset_test_dir = workspace_dir / "datasets" / "archive (1)" / "Autism Facial Recognition Dataset_Augmented" / "test"
    print(f"1.4 Testing Inference with Real Test Dataset ({dataset_test_dir})...")
    
    tested_emotions = 0
    for cls_name in EMOTION_CLASSES:
        cls_dir = dataset_test_dir / cls_name
        if not cls_dir.exists():
            continue
        sample_imgs = list(cls_dir.glob("*.jpg")) + list(cls_dir.glob("*.png"))
        if not sample_imgs:
            continue

        sample_img = sample_imgs[0]
        pred_res = wrapper.predict(sample_img)
        tested_emotions += 1

        top_class = pred_res["top_class"]
        confidence = pred_res["top_confidence"]
        probs = pred_res["probabilities"]
        inference_time = pred_res["inference_time_ms"]

        # Math and Probability Invariants
        total_prob = sum(p["confidence"] for p in probs)
        assert abs(total_prob - 1.0) < 0.01, f"Probabilities do not sum to 1.0 (sum={total_prob})"
        assert 0.0 <= confidence <= 1.0, f"Confidence out of range: {confidence}"
        assert len(probs) == len(EMOTION_CLASSES), f"Probabilities count mismatch: {len(probs)}"
        assert probs[0]["class_key"] == pred_res["top_class_key"], "Top probability class mismatch"

        clean_name = sample_img.name.encode('ascii', 'ignore').decode('ascii')
        print(f"    [Class: {cls_name:10}] Sample: {clean_name:20} -> Predicted: {top_class:10} (Conf: {confidence*100:.1f}%, Time: {inference_time:.1f}ms)")

    assert tested_emotions >= 4, f"Expected at least 4 emotion classes tested, got {tested_emotions}"
    print(f"    [OK] Successfully tested {tested_emotions} real emotion classes. All probability distributions valid.")

    # ---------------------------------------------------------------------------------
    # SECTION 2: VIDEO STIMMING BEHAVIOR MODEL (video_ml/video_model.pth)
    # ---------------------------------------------------------------------------------
    print("\n--- [SECTION 2] Video Stimming Action Recognition Model (video_model.pth) ---")
    
    video_model_path = settings.VIDEO_MODEL_PATH
    class_labels_path = settings.VIDEO_CLASS_LABELS_PATH
    print(f"2.1 Target Model Path: {video_model_path}")
    print(f"    Class Labels Path: {class_labels_path}")
    assert video_model_path.exists(), f"Video model file missing at {video_model_path}"
    assert class_labels_path.exists(), f"Class labels file missing at {class_labels_path}"
    print(f"    [OK] Files exist. Model Size: {video_model_path.stat().st_size} bytes ({round(video_model_path.stat().st_size / (1024*1024), 2)} MB)")

    # Test Model Loading
    vid_wrapper = VideoModelWrapper()
    assert vid_wrapper.loaded is True, "Failed to load video model"
    assert vid_wrapper.model is not None, "Video model object is None"
    print(f"2.2 Model Loading: Successfully loaded MobileNetV3 Temporal Classifier ({vid_wrapper.load_duration_ms} ms) on {vid_wrapper.device}")
    print(f"2.3 Class Map: Verified classes: {vid_wrapper.classes} -> Labels: {vid_wrapper.class_names}")

    # Test Inference with Real Dataset Videos Across Behaviors
    video_dataset_dir = workspace_dir / "datasets" / "vedio"
    print(f"2.4 Testing Inference with Real Dataset Videos ({video_dataset_dir})...")

    tested_behaviors = 0
    for beh in vid_wrapper.classes:
        b_dir = video_dataset_dir / beh
        if not b_dir.exists():
            continue
        vids = list(b_dir.glob("*.mp4"))
        if not vids:
            continue

        sample_vid = vids[0]
        vid_pred = vid_wrapper.predict(sample_vid)
        tested_behaviors += 1

        pred_beh = vid_pred["predicted_behavior"]
        pred_key = vid_pred["predicted_behavior_key"]
        confidence = vid_pred["confidence"]
        probs = vid_pred["probabilities"]
        meta = vid_pred["video_metadata"]
        inference_time = vid_pred["inference_time_ms"]

        # Math and Probability Invariants
        total_prob = sum(p["confidence"] for p in probs)
        assert abs(total_prob - 1.0) < 0.01, f"Video probabilities do not sum to 1.0 (sum={total_prob})"
        assert 0.0 <= confidence <= 1.0, f"Confidence out of range: {confidence}"
        assert len(probs) == len(vid_wrapper.classes), f"Probabilities count mismatch: {len(probs)}"
        assert probs[0]["class_key"] == pred_key, "Top probability class mismatch"

        clean_vname = sample_vid.name.encode('ascii', 'ignore').decode('ascii')[:35]
        print(f"    [Behavior: {beh:15}] Video: {clean_vname:35} -> Predicted: {pred_beh:15} (Conf: {confidence*100:.1f}%, Duration: {meta.get('durationSeconds')}s, Time: {inference_time/1000:.2f}s)")

    assert tested_behaviors >= 1, "At least 1 video behavior must be tested"
    print(f"    [OK] Tested {tested_behaviors} video behavior categories. Temporal inference and metadata extraction verified.")

    # ---------------------------------------------------------------------------------
    # SECTION 3: INFERENCE ERROR HANDLING & CORRUPTION SAFEGUARDS
    # ---------------------------------------------------------------------------------
    print("\n--- [SECTION 3] Inference Error Handling & Safety Verification ---")

    # 3.1 Non-existent file
    print("3.1 Testing Missing File Handling...")
    try:
        InferenceService.analyze_image(Path("C:/non_existent_image_12345.jpg"))
        assert False, "Should raise CorruptedMediaException"
    except CorruptedMediaException as e:
        print(f"    [PASS] Safely caught missing file: {e.detail}")

    # 3.2 Corrupted Image Header / Bytes
    print("3.2 Testing Corrupted Image Decoding...")
    scratch_dir = backend_dir / "uploads" / "temp"
    scratch_dir.mkdir(parents=True, exist_ok=True)
    corrupt_img = scratch_dir / "corrupt_test.jpg"
    with open(corrupt_img, "wb") as f:
        f.write(b"NOT_A_REAL_IMAGE_BYTES_1234567890")
    try:
        wrapper.preprocess_image(corrupt_img)
        assert False, "Should raise CorruptedMediaException on corrupted image"
    except CorruptedMediaException as e:
        print(f"    [PASS] Safely caught corrupted image bytes: {e.detail}")
    finally:
        if corrupt_img.exists():
            corrupt_img.unlink()

    # 3.3 Corrupted Video Stream
    print("3.3 Testing Corrupted Video Stream Decoding...")
    corrupt_vid = scratch_dir / "corrupt_test.mp4"
    with open(corrupt_vid, "wb") as f:
        f.write(b"NOT_A_REAL_MP4_BYTES_1234567890")
    try:
        vid_wrapper.extract_clips(str(corrupt_vid), num_clips=2)
        assert False, "Should raise CorruptedMediaException on corrupted video"
    except CorruptedMediaException as e:
        print(f"    [PASS] Safely caught corrupted video stream: {e.detail}")
    finally:
        if corrupt_vid.exists():
            corrupt_vid.unlink()

    print("\n================================================================================")
    print("      ALL TRAINED ML MODELS & INFERENCE PIPELINES VERIFIED SUCCESSFULLY!        ")
    print("================================================================================\n")

if __name__ == "__main__":
    run_ml_audit()
