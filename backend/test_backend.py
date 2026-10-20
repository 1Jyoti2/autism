import sys
import os
import io
import time
from pathlib import Path
from datetime import datetime
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from main import app
from app.database import SessionLocal, engine
from app.models import (
    User,
    Child,
    ScreeningRecord,
    UploadedFile,
    Prediction,
    PredictionHistory,
    Note,
    Notification,
)
from app.services.inference_service import InferenceService
from app.ml.emotion_model import get_emotion_model
from app.ml.video_model import get_video_model
from init_db import init_database

client = TestClient(app)

def test_1_backend_startup():
    print("[TEST 1/14] Backend Startup & Model Pre-warming...")
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    print("  [PASS] Backend app online and root endpoint accessible.")

def test_2_database_connection():
    print("[TEST 2/14] Database Connection & Schema Tables...")
    init_database()
    db = SessionLocal()
    try:
        child_count = db.query(Child).count()
        assert child_count >= 3
        print(f"  [PASS] Database connected. Initial seed verified ({child_count} children on record).")
    finally:
        db.close()

def test_3_user_registration():
    print("[TEST 3/14] User Registration & Duplicate Email Validation...")
    unique_id = os.urandom(3).hex()
    email = f"parent_{unique_id}@example.com"

    # Successful registration
    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "fullName": "Integration Test Parent",
        "role": "parent"
    })
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "token" in reg_data
    assert reg_data["user"]["email"] == email
    print("  [PASS] User registration successful (201 Created).")

    # Duplicate registration should be rejected
    dup_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "fullName": "Duplicate Parent",
        "role": "parent"
    })
    assert dup_resp.status_code in [400, 409]
    assert "already exists" in dup_resp.json()["detail"].lower() or "already registered" in dup_resp.json()["detail"].lower()
    print("  [PASS] Duplicate email rejected with 409 Conflict / 400 Bad Request.")


def test_4_login_and_jwt_auth():
    print("[TEST 4/14] Login & JWT Authentication...")
    unique_id = os.urandom(3).hex()
    email = f"doctor_{unique_id}@example.com"
    password = "DoctorPassword123!"

    # Register
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "fullName": "Dr. Alex Taylor",
        "role": "doctor"
    })

    # Login
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    token = login_data.get("token") or login_data.get("access_token")
    assert token is not None
    assert login_data["user"]["role"] == "doctor"
    print("  [PASS] Login authenticated, JWT token issued.")

    # Authenticate with protected endpoint /api/auth/me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email
    print("  [PASS] Protected route access verified via Bearer token.")

    # Invalid password check
    bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401
    print("  [PASS] Invalid password rejected with 401 Unauthorized.")

def test_5_and_6_image_upload_and_emotion_prediction():
    print("[TEST 5 & 6/14] Image Upload & Facial Emotion PyTorch Inference...")
    workspace_dir = backend_dir.parent
    sample_imgs = list((workspace_dir / "datasets").rglob("*.jpg")) + list((workspace_dir / "datasets").rglob("*.png"))
    assert len(sample_imgs) > 0, "Sample dataset image required"
    sample_img = sample_imgs[0]

    with open(sample_img, "rb") as f:
        resp = client.post(
            "/api/analyze-image",
            files={"file": (sample_img.name, f, "image/jpeg")},
            data={"child_name": "Maya Patel", "child_id": "ch_maya"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "predictedEmotion" in data
    assert "confidenceScore" in data
    assert "probabilities" in data
    assert "status" in data
    assert "predictionId" in data
    assert data["assessmentType"] == "Image Analysis"
    print(f"  [PASS] Image uploaded & analyzed: Emotion='{data['predictedEmotion']}', Confidence={data['confidencePercentage']}, ID={data['predictionId']}")

def test_7_and_8_video_upload_and_stimming_prediction():
    print("[TEST 7 & 8/14] Video Upload & Stimming Behavior Action Recognition...")
    workspace_dir = backend_dir.parent
    sample_videos = list((workspace_dir / "datasets" / "vedio").rglob("*.mp4"))
    assert len(sample_videos) > 0, "Sample dataset video required"
    sample_video = sample_videos[0]

    with open(sample_video, "rb") as f:
        resp = client.post(
            "/api/analyze-video",
            files={"file": (sample_video.name, f, "video/mp4")},
            data={"child_name": "Ayaan Patel", "child_id": "ch_ayaan"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "predictedBehavior" in data
    assert "confidenceScore" in data
    assert "probabilities" in data
    assert "status" in data
    assert "predictionId" in data
    assert "videoMetadata" in data
    assert data["assessmentType"] == "Video Analysis"
    print(f"  [PASS] Video uploaded & analyzed: Action='{data['predictedBehavior']}', Confidence={data['confidencePercentage']}, ID={data['predictionId']}")

def test_9_prediction_history():
    print("[TEST 9/14] Prediction History, Filtering & Deletion...")
    # Register user
    email = f"hist_user_{os.urandom(3).hex()}@example.com"
    reg = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "fullName": "History Tester",
        "role": "parent"
    })
    token = reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    workspace_dir = backend_dir.parent
    sample_img = list((workspace_dir / "datasets").rglob("*.jpg"))[0]
    sample_vid = list((workspace_dir / "datasets" / "vedio").rglob("*.mp4"))[0]

    # Upload 1 image and 1 video under this user
    with open(sample_img, "rb") as f:
        img_res = client.post("/api/analyze-image", files={"file": (sample_img.name, f, "image/jpeg")}, headers=headers).json()
    with open(sample_vid, "rb") as f:
        vid_res = client.post("/api/analyze-video", files={"file": (sample_vid.name, f, "video/mp4")}, headers=headers).json()

    # Query history
    hist = client.get("/api/predictions", headers=headers).json()
    assert hist["total"] == 2
    print(f"  [PASS] User prediction history query returned {hist['total']} items.")

    # Filter by type=image
    img_hist = client.get("/api/predictions/images", headers=headers).json()
    assert img_hist["total"] == 1
    assert img_hist["items"][0]["type"] == "image"
    print("  [PASS] Type filter 'image' returned 1 image record.")

    # Single item detail
    detail = client.get(f"/api/predictions/{img_res['predictionId']}", headers=headers).json()
    assert detail["id"] == img_res["predictionId"]
    assert "fileDetails" in detail
    assert "history" in detail
    print("  [PASS] Single prediction detail view verified with file & audit entries.")

    # Delete prediction
    del_res = client.delete(f"/api/predictions/{img_res['predictionId']}", headers=headers)
    assert del_res.status_code == 200
    print("  [PASS] Prediction record successfully deleted from database.")

def test_10_dashboard_statistics():
    print("[TEST 10/14] Dynamic Dashboard Statistics from Database...")
    metrics_resp = client.get("/api/dashboard/metrics")
    assert metrics_resp.status_code == 200
    m = metrics_resp.json()
    assert m["totalPredictions"] >= 1
    assert m["imagePredictionCount"] >= 1
    assert m["videoPredictionCount"] >= 1
    assert len(m["mostFrequentEmotions"]) >= 1
    assert len(m["mostFrequentBehaviors"]) >= 1
    assert len(m["predictionActivityByDate"]) >= 1
    print(f"  [PASS] Dynamic dashboard metrics calculated: Total={m['totalPredictions']}, Images={m['imagePredictionCount']}, Videos={m['videoPredictionCount']}")

    # Role dashboards
    for role in ["parent", "doctor", "admin", "caretaker"]:
        dash = client.get(f"/api/dashboard/{role}")
        assert dash.status_code == 200
        assert "metrics" in dash.json()
    print("  [PASS] All role dashboards (Parent, Doctor, Admin, Caretaker) return live aggregated statistics.")

def test_11_invalid_file_handling():
    print("[TEST 11/14] Invalid File, Corrupted Stream & Size Validation...")
    # 1. Unsupported extension -> 415
    txt_file = io.BytesIO(b"Just plain text file")
    r1 = client.post("/api/analyze-image", files={"file": ("test.txt", txt_file, "text/plain")})
    assert r1.status_code == 415
    print("  [PASS] Unsupported file extension caught (415 Unsupported Media Type).")

    # 2. Corrupted image bytes -> 400
    bad_img = io.BytesIO(b"GARBAGE_BYTES_THAT_ARE_NOT_AN_IMAGE")
    r2 = client.post("/api/analyze-image", files={"file": ("corrupt.jpg", bad_img, "image/jpeg")})
    assert r2.status_code == 400
    print("  [PASS] Corrupted image caught via PIL integrity verification (400 Bad Request).")

    # 3. Corrupted video bytes -> 400
    bad_vid = io.BytesIO(b"GARBAGE_BYTES_THAT_ARE_NOT_AN_MP4")
    r3 = client.post("/api/analyze-video", files={"file": ("corrupt.mp4", bad_vid, "video/mp4")})
    assert r3.status_code == 400
    print("  [PASS] Corrupted video stream caught via OpenCV decoder check (400 Bad Request).")

    # 4. 0-byte file -> 400
    empty_file = io.BytesIO(b"")
    r4 = client.post("/api/analyze-image", files={"file": ("empty.jpg", empty_file, "image/jpeg")})
    assert r4.status_code == 400
    print("  [PASS] Empty 0-byte file upload rejected (400 Bad Request).")

def test_12_authentication_and_authorization():
    print("[TEST 12/14] Authorization Enforcement & Multi-Tenant User Isolation...")
    # User 1
    u1_reg = client.post("/api/auth/register", json={"email": f"u1_{os.urandom(3).hex()}@test.com", "password": "Password123!", "fullName": "User One", "role": "parent"}).json()
    t1 = u1_reg["token"]
    h1 = {"Authorization": f"Bearer {t1}"}

    # User 2
    u2_reg = client.post("/api/auth/register", json={"email": f"u2_{os.urandom(3).hex()}@test.com", "password": "Password123!", "fullName": "User Two", "role": "parent"}).json()
    t2 = u2_reg["token"]
    h2 = {"Authorization": f"Bearer {t2}"}

    # User 1 uploads an image
    workspace_dir = backend_dir.parent
    sample_img = list((workspace_dir / "datasets").rglob("*.jpg"))[0]
    with open(sample_img, "rb") as f:
        pred_res = client.post("/api/analyze-image", files={"file": (sample_img.name, f, "image/jpeg")}, headers=h1).json()
    pred_id = pred_res["predictionId"]

    # User 2 attempts to view User 1's prediction -> 403 Forbidden
    cross_get = client.get(f"/api/predictions/{pred_id}", headers=h2)
    assert cross_get.status_code == 403
    print("  [PASS] Cross-user view access blocked (403 Forbidden).")

    # User 2 attempts to delete User 1's prediction -> 403 Forbidden
    cross_del = client.delete(f"/api/predictions/{pred_id}", headers=h2)
    assert cross_del.status_code == 403
    print("  [PASS] Cross-user delete operation blocked (403 Forbidden).")

    # Unauthenticated access to protected route -> 401 Unauthorized
    unauth_get = client.get("/api/predictions")
    assert unauth_get.status_code == 401
    print("  [PASS] Unauthenticated access rejected (401 Unauthorized).")

def test_13_database_persistence():
    print("[TEST 13/14] Database Persistence & Foreign Key Relations...")
    db = SessionLocal()
    try:
        latest_pred = db.query(Prediction).order_by(Prediction.created_at.desc()).first()
        assert latest_pred is not None
        assert latest_pred.id.startswith("pred_")
        assert latest_pred.confidence_score is not None

        # Check relation to uploaded_file
        if latest_pred.file_id:
            uploaded = db.query(UploadedFile).filter(UploadedFile.id == latest_pred.file_id).first()
            assert uploaded is not None
            assert Path(uploaded.file_path).exists()

        # Check audit trail relation
        audit_count = db.query(PredictionHistory).filter(PredictionHistory.prediction_id == latest_pred.id).count()
        assert audit_count >= 1
        print("  [PASS] Database persistence verified: predictions, uploaded files, and audit logs linked successfully.")
    finally:
        db.close()

def test_14_frontend_api_communication():
    print("[TEST 14/14] Frontend-to-Backend API Proxy & Health Verification...")
    # Verify health endpoint returns pre-warmed ML model metadata
    health = client.get("/api/health").json()
    assert health["status"] == "healthy"
    assert health["database"] == "connected"
    assert health["ml_inference"]["emotion_model"]["loaded"] is True
    assert health["ml_inference"]["video_model"]["loaded"] is True
    print("  [PASS] Health check confirms frontend can communicate with backend API services.")

if __name__ == "__main__":
    print("================================================================================")
    print("      EARLY AUTISM DETECTION PLATFORM: FULL BACKEND INTEGRATION TEST SUITE      ")
    print("================================================================================\n")
    
    test_1_backend_startup()
    test_2_database_connection()
    test_3_user_registration()
    test_4_login_and_jwt_auth()
    test_5_and_6_image_upload_and_emotion_prediction()
    test_7_and_8_video_upload_and_stimming_prediction()
    test_9_prediction_history()
    test_10_dashboard_statistics()
    test_11_invalid_file_handling()
    test_12_authentication_and_authorization()
    test_13_database_persistence()
    test_14_frontend_api_communication()

    print("\n================================================================================")
    print("      ALL 14 BACKEND INTEGRATION TEST SUITES PASSED SUCCESSFULLY! [OK]         ")
    print("================================================================================")
