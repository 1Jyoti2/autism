import os
import sys
import json
import time
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.prediction import Prediction
from app.models.uploaded_file import UploadedFile

client = TestClient(app)
workspace_dir = backend_dir.parent

def run_tests():
    print("================================================================================")
    print("        COMPREHENSIVE REAL-DATA LIVE BACKEND API TEST SUITE                      ")
    print("================================================================================\n")

    # ---------------------------------------------------------
    # 1. API: User Registration (POST /api/auth/register)
    # ---------------------------------------------------------
    print("[1/9] Testing User Registration API (POST /api/auth/register)...")
    unique_suffix = os.urandom(3).hex()
    user_email = f"parent.sarah.{unique_suffix}@autism-platform.org"
    user_password = "SecurePassword2026!"
    user_name = "Sarah Jenkins"

    reg_payload = {
        "email": user_email,
        "password": user_password,
        "fullName": user_name,
        "role": "parent"
    }
    reg_response = client.post("/api/auth/register", json=reg_payload)
    assert reg_response.status_code == 201, f"Expected 201, got {reg_response.status_code}: {reg_response.text}"
    reg_json = reg_response.json()
    assert "token" in reg_json, "Response missing 'token'"
    assert reg_json["user"]["email"] == user_email, "Returned email does not match"
    assert reg_json["user"]["role"] == "parent", "Returned role does not match"
    token = reg_json["token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"  [SUCCESS] User registered: {user_email} (ID: {reg_json['user']['id']})")
    print(f"  [SUCCESS] JWT Token issued: {token[:24]}...")

    # ---------------------------------------------------------
    # 2. API: User Login (POST /api/auth/login)
    # ---------------------------------------------------------
    print("\n[2/9] Testing User Login API (POST /api/auth/login)...")
    login_payload = {
        "email": user_email,
        "password": user_password
    }
    login_response = client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200, f"Expected 200, got {login_response.status_code}: {login_response.text}"
    login_json = login_response.json()
    assert "token" in login_json or "access_token" in login_json
    login_token = login_json.get("token") or login_json.get("access_token")
    assert login_json["user"]["name"] == user_name
    print(f"  [SUCCESS] Login successful for {user_email}, role: {login_json['user']['role']}")

    # ---------------------------------------------------------
    # 3. API: Current User Profile (GET /api/auth/me)
    # ---------------------------------------------------------
    print("\n[3/9] Testing Current User API (GET /api/auth/me)...")
    me_response = client.get("/api/auth/me", headers=auth_headers)
    assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}: {me_response.text}"
    me_json = me_response.json()
    assert me_json["email"] == user_email
    assert me_json["fullName"] == user_name
    assert me_json["isActive"] is True
    print(f"  [SUCCESS] Current user profile fetched: {me_json['fullName']} ({me_json['role']})")

    # ---------------------------------------------------------
    # 4. API: Image Upload & Real Facial Emotion PyTorch Inference (POST /api/analyze-image)
    # ---------------------------------------------------------
    print("\n[4/9] Testing Image Upload & Facial Emotion Prediction API (POST /api/analyze-image)...")
    emotion_test_dir = workspace_dir / "datasets" / "archive (1)" / "Autism Facial Recognition Dataset_Augmented" / "test"
    
    # Test with real images from available emotion classes
    sample_images = []
    for emotion_cls in ["Natural", "joy", "anger", "fear", "sadness", "surprise"]:
        cls_dir = emotion_test_dir / emotion_cls
        if cls_dir.exists():
            imgs = list(cls_dir.glob("*.jpg")) + list(cls_dir.glob("*.png"))
            if imgs:
                sample_images.append((emotion_cls, imgs[0]))

    if not sample_images:
        # Fallback to any dataset image
        imgs = list((workspace_dir / "datasets").rglob("*.jpg"))
        assert imgs, "No sample images found in datasets"
        sample_images.append(("Sample", imgs[0]))

    created_image_pred_ids = []
    for expected_cat, img_path in sample_images[:2]:
        safe_img_name = img_path.name.encode('ascii', 'replace').decode('ascii')
        print(f"  -> Uploading real image ({expected_cat}): {safe_img_name} ({img_path.stat().st_size} bytes)")
        with open(img_path, "rb") as f:
            img_res = client.post(
                "/api/analyze-image",
                files={"file": (img_path.name, f, "image/jpeg")},
                data={"child_name": "Maya Patel", "child_id": "ch_maya"},
                headers=auth_headers
            )
        assert img_res.status_code == 200, f"Image upload failed ({img_res.status_code}): {img_res.text}"
        img_data = img_res.json()
        assert "predictedEmotion" in img_data, "Missing predictedEmotion"
        assert "confidenceScore" in img_data, "Missing confidenceScore"
        assert "probabilities" in img_data, "Missing probabilities"
        assert "predictionId" in img_data, "Missing predictionId"
        assert len(img_data["probabilities"]) > 0, "Empty probabilities list"
        created_image_pred_ids.append(img_data["predictionId"])
        print(f"     [RESULT] Predicted Emotion: {img_data['predictedEmotion']} | Confidence: {img_data['confidencePercentage']} | Status: {img_data['status']}")
        print(f"     [RESULT] Stored Prediction ID: {img_data['predictionId']}")

    # ---------------------------------------------------------
    # 5. API: Video Upload & Real Stimming Action Recognition (POST /api/analyze-video)
    # ---------------------------------------------------------
    print("\n[5/9] Testing Video Upload & Stimming Prediction API (POST /api/analyze-video)...")
    video_test_dir = workspace_dir / "datasets" / "vedio"
    
    sample_videos = []
    for behavior in ["arm_flapping", "head_banging", "spinning"]:
        b_dir = video_test_dir / behavior
        if b_dir.exists():
            vids = list(b_dir.glob("*.mp4"))
            if vids:
                sample_videos.append((behavior, vids[0]))

    assert sample_videos, "No sample videos found in datasets/vedio"
    created_video_pred_ids = []
    
    # Test with real dataset video
    expected_beh, vid_path = sample_videos[0]
    safe_name = vid_path.name.encode('ascii', 'replace').decode('ascii')
    print(f"  -> Uploading real video ({expected_beh}): {safe_name} ({round(vid_path.stat().st_size / (1024*1024), 2)} MB)")
    t0 = time.time()
    with open(vid_path, "rb") as f:
        vid_res = client.post(
            "/api/analyze-video",
            files={"file": (vid_path.name, f, "video/mp4")},
            data={"child_name": "Ayaan Patel", "child_id": "ch_ayaan"},
            headers=auth_headers
        )
    dur = round(time.time() - t0, 2)
    assert vid_res.status_code == 200, f"Video upload failed ({vid_res.status_code}): {vid_res.text}"
    vid_data = vid_res.json()
    assert "predictedBehavior" in vid_data, "Missing predictedBehavior"
    assert "confidenceScore" in vid_data, "Missing confidenceScore"
    assert "probabilities" in vid_data, "Missing probabilities"
    assert "videoMetadata" in vid_data, "Missing videoMetadata"
    assert "predictionId" in vid_data, "Missing predictionId"
    created_video_pred_ids.append(vid_data["predictionId"])
    print(f"     [RESULT] Predicted Behavior: {vid_data['predictedBehavior']} | Confidence: {vid_data['confidencePercentage']} | Status: {vid_data['status']}")
    print(f"     [RESULT] Latency: {dur}s | Video Duration: {vid_data['videoMetadata'].get('durationSeconds')}s | Frames: {vid_data['videoMetadata'].get('totalFrames')}")
    print(f"     [RESULT] Stored Prediction ID: {vid_data['predictionId']}")

    # ---------------------------------------------------------
    # 6. API: Prediction History & Pagination (GET /api/predictions)
    # ---------------------------------------------------------
    print("\n[6/9] Testing Prediction History & Filtering APIs (GET /api/predictions)...")
    # All predictions for current user
    hist_all = client.get("/api/predictions", headers=auth_headers)
    assert hist_all.status_code == 200
    all_data = hist_all.json()
    assert all_data["total"] >= len(created_image_pred_ids) + len(created_video_pred_ids)
    print(f"  [SUCCESS] All predictions query returned {all_data['total']} items (Page {all_data['page']}/{all_data['totalPages']})")

    # Filter by type=image
    hist_img = client.get("/api/predictions/images", headers=auth_headers)
    assert hist_img.status_code == 200
    img_hist_data = hist_img.json()
    assert img_hist_data["total"] >= len(created_image_pred_ids)
    assert all(item["type"] == "image" for item in img_hist_data["items"])
    print(f"  [SUCCESS] Filtered image predictions query returned {img_hist_data['total']} items")

    # Filter by type=video
    hist_vid = client.get("/api/predictions/videos", headers=auth_headers)
    assert hist_vid.status_code == 200
    vid_hist_data = hist_vid.json()
    assert vid_hist_data["total"] >= len(created_video_pred_ids)
    assert all(item["type"] == "video" for item in vid_hist_data["items"])
    print(f"  [SUCCESS] Filtered video predictions query returned {vid_hist_data['total']} items")

    # Single Prediction Detail
    target_pred_id = created_image_pred_ids[0]
    detail_res = client.get(f"/api/predictions/{target_pred_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == target_pred_id
    assert "fileDetails" in detail_data
    assert "history" in detail_data
    print(f"  [SUCCESS] Prediction detail view verified for ID: {target_pred_id}")

    # ---------------------------------------------------------
    # 7. API: Dashboard Statistics & Aggregations (GET /api/dashboard/metrics)
    # ---------------------------------------------------------
    print("\n[7/9] Testing Dynamic Dashboard Statistics API (GET /api/dashboard/metrics)...")
    metrics_res = client.get("/api/dashboard/metrics", headers=auth_headers)
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert "totalPredictions" in m_data
    assert "imagePredictionCount" in m_data
    assert "videoPredictionCount" in m_data
    assert "mostFrequentEmotions" in m_data
    assert "mostFrequentBehaviors" in m_data
    assert "predictionActivityByDate" in m_data
    assert m_data["totalPredictions"] > 0
    print(f"  [SUCCESS] Total Predictions: {m_data['totalPredictions']}")
    print(f"  [SUCCESS] Image Predictions: {m_data['imagePredictionCount']} | Video Predictions: {m_data['videoPredictionCount']}")
    print(f"  [SUCCESS] Top Emotions: {[e['emotion'] + ' (' + str(e['percentage']) + '%)' for e in m_data['mostFrequentEmotions'][:3]]}")
    print(f"  [SUCCESS] Top Behaviors: {[b['behavior'] + ' (' + str(b['percentage']) + '%)' for b in m_data['mostFrequentBehaviors'][:3]]}")
    print(f"  [SUCCESS] Daily Activity Buckets: {len(m_data['predictionActivityByDate'])} records")

    # ---------------------------------------------------------
    # 8. API: Role-Specific Dashboards (GET /api/dashboard/{role})
    # ---------------------------------------------------------
    print("\n[8/9] Testing Role-Specific Dashboards (GET /api/dashboard/{role})...")
    for role in ["parent", "doctor", "admin", "caretaker"]:
        role_res = client.get(f"/api/dashboard/{role}", headers=auth_headers)
        assert role_res.status_code == 200, f"Failed for role {role}"
        r_json = role_res.json()
        assert "role" in r_json
        assert "metrics" in r_json
        print(f"  [SUCCESS] Role '{role}' dashboard returned valid payload with {len(r_json)} top-level keys")

    # ---------------------------------------------------------
    # 9. API: System Health & ML Pre-warming Status (GET /api/health)
    # ---------------------------------------------------------
    print("\n[9/9] Testing Health & ML Status API (GET /api/health)...")
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    h_json = health_res.json()
    assert h_json["status"] == "healthy"
    assert h_json["database"] == "connected"
    assert h_json["ml_inference"]["emotion_model"]["loaded"] is True
    assert h_json["ml_inference"]["video_model"]["loaded"] is True
    print(f"  [SUCCESS] Health status: {h_json['status']} | DB: {h_json['database']}")
    print(f"  [SUCCESS] Emotion Model: {h_json['ml_inference']['emotion_model']['architecture']} (Loaded: True, Device: {h_json['ml_inference']['emotion_model']['device']})")
    print(f"  [SUCCESS] Video Model: {h_json['ml_inference']['video_model']['architecture']} (Loaded: True, Device: {h_json['ml_inference']['video_model']['device']})")

    print("\n================================================================================")
    print("        ALL BACKEND APIS TESTED WITH REAL DATA & PASSED SUCCESSFULLY!          ")
    print("================================================================================\n")

if __name__ == "__main__":
    run_tests()
