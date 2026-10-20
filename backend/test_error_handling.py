import os
import sys
import io
import json
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from app.config import settings

client = TestClient(app)

def run_error_handling_tests():
    print("================================================================================")
    print("        COMPREHENSIVE BACKEND ERROR HANDLING & RESPONSE FORMAT AUDIT            ")
    print("================================================================================\n")

    # ---------------------------------------------------------------------------------
    # 1. Invalid Login
    # ---------------------------------------------------------------------------------
    print("[1/12] Testing Invalid Login Error Response...")
    bad_login_res = client.post("/api/auth/login", json={
        "email": "nonexistent.user.12345@autism.org",
        "password": "WrongPassword123!"
    })
    assert bad_login_res.status_code == 401
    bad_json = bad_login_res.json()
    assert bad_json["status"] == "error"
    assert bad_json["statusCode"] == 401
    assert "invalid" in bad_json["detail"].lower() or "password" in bad_json["detail"].lower()
    print(f"  [PASS] Invalid login returned {bad_login_res.status_code} with clean JSON: '{bad_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 2. Duplicate Registration
    # ---------------------------------------------------------------------------------
    print("\n[2/12] Testing Duplicate Registration Error Response...")
    unique_email = f"parent.dup.{os.urandom(3).hex()}@autism.org"
    reg1 = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "fullName": "Dup Parent",
        "role": "parent"
    })
    assert reg1.status_code == 201

    reg2 = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "fullName": "Dup Parent 2",
        "role": "parent"
    })
    assert reg2.status_code == 409
    dup_json = reg2.json()
    assert dup_json["status"] == "error"
    assert dup_json["statusCode"] == 409
    assert "already exists" in dup_json["detail"].lower() or "already registered" in dup_json["detail"].lower()
    print(f"  [PASS] Duplicate registration returned {reg2.status_code} with clean JSON: '{dup_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 3. Missing Authentication
    # ---------------------------------------------------------------------------------
    print("\n[3/12] Testing Missing Authentication Error Response...")
    unauth_res = client.get("/api/predictions")
    assert unauth_res.status_code == 401
    unauth_json = unauth_res.json()
    assert unauth_json["status"] == "error"
    assert unauth_json["statusCode"] == 401
    print(f"  [PASS] Missing auth returned {unauth_res.status_code} with clean JSON: '{unauth_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 4. Invalid / Tampered Token
    # ---------------------------------------------------------------------------------
    print("\n[4/12] Testing Invalid / Malformed Token Error Response...")
    bad_token_res = client.get("/api/auth/me", headers={"Authorization": "Bearer BAD_FAKE_EXPIRED_TOKEN_12345"})
    assert bad_token_res.status_code == 401
    bad_tok_json = bad_token_res.json()
    assert bad_tok_json["status"] == "error"
    assert bad_tok_json["statusCode"] == 401
    print(f"  [PASS] Invalid token returned {bad_token_res.status_code} with clean JSON: '{bad_tok_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 5. Invalid Image (Unsupported Format)
    # ---------------------------------------------------------------------------------
    print("\n[5/12] Testing Invalid Image Format Error Response...")
    text_stream = io.BytesIO(b"Hello world text file")
    inv_img_res = client.post("/api/analyze-image", files={"file": ("notes.txt", text_stream, "text/plain")})
    assert inv_img_res.status_code == 415
    inv_img_json = inv_img_res.json()
    assert inv_img_json["status"] == "error"
    assert inv_img_json["statusCode"] == 415
    assert "unsupported" in inv_img_json["detail"].lower()
    print(f"  [PASS] Invalid image format returned {inv_img_res.status_code} with clean JSON: '{inv_img_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 6. Invalid Video (Unsupported Format)
    # ---------------------------------------------------------------------------------
    print("\n[6/12] Testing Invalid Video Format Error Response...")
    doc_stream = io.BytesIO(b"Document binary")
    inv_vid_res = client.post("/api/analyze-video", files={"file": ("report.pdf", doc_stream, "application/pdf")})
    assert inv_vid_res.status_code == 415
    inv_vid_json = inv_vid_res.json()
    assert inv_vid_json["status"] == "error"
    assert inv_vid_json["statusCode"] == 415
    assert "unsupported" in inv_vid_json["detail"].lower()
    print(f"  [PASS] Invalid video format returned {inv_vid_res.status_code} with clean JSON: '{inv_vid_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 7. Large Files (>15MB image)
    # ---------------------------------------------------------------------------------
    print("\n[7/12] Testing Large File Limit Error Response...")
    large_stream = io.BytesIO(b"X" * (16 * 1024 * 1024))
    large_res = client.post("/api/analyze-image", files={"file": ("huge.jpg", large_stream, "image/jpeg")})
    assert large_res.status_code in [400, 413]
    large_json = large_res.json()
    assert large_json["status"] == "error"
    assert "exceeds" in large_json["detail"].lower() or "limit" in large_json["detail"].lower() or "invalid" in large_json["detail"].lower()
    print(f"  [PASS] Large file returned {large_res.status_code} with clean JSON: '{large_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 8. Corrupted Media Files
    # ---------------------------------------------------------------------------------
    print("\n[8/12] Testing Corrupted Media Error Response...")
    corrupt_stream = io.BytesIO(b"CORRUPTED_GARBAGE_BINARY_STREAM_0000000000000000")
    corrupt_res = client.post("/api/analyze-image", files={"file": ("broken.jpg", corrupt_stream, "image/jpeg")})
    assert corrupt_res.status_code == 400
    corrupt_json = corrupt_res.json()
    assert corrupt_json["status"] == "error"
    assert corrupt_json["statusCode"] == 400
    assert "corrupt" in corrupt_json["detail"].lower() or "invalid" in corrupt_json["detail"].lower()
    print(f"  [PASS] Corrupted file returned {corrupt_res.status_code} with clean JSON: '{corrupt_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 9. Request Validation Error (Missing Required Fields / Bad JSON)
    # ---------------------------------------------------------------------------------
    print("\n[9/12] Testing Request Body Validation Error Response...")
    bad_req_res = client.post("/api/auth/register", json={
        "email": "not-a-valid-email",
        "password": "123"  # too short
    })
    assert bad_req_res.status_code == 422
    val_json = bad_req_res.json()
    assert val_json["status"] == "error"
    assert val_json["statusCode"] == 422
    assert "detail" in val_json
    print(f"  [PASS] Validation error returned {bad_req_res.status_code} with clean JSON: '{val_json['detail']}'")

    # ---------------------------------------------------------------------------------
    # 10. Database Failure Simulation (Zero Passwords / URIs Leaked)
    # ---------------------------------------------------------------------------------
    print("\n[10/12] Testing Database Failure Exception Handler (Zero Leakage)...")
    # Trigger database exception handler directly via test endpoint
    from main import database_exception_handler, general_exception_handler, http_exception_handler
    from fastapi import Request
    from starlette.datastructures import URL

    dummy_scope = {"type": "http", "method": "GET", "path": "/api/children", "headers": []}
    dummy_req = Request(dummy_scope)
    db_exc = OperationalError("FATAL: password authentication failed for user postgres at localhost:5432", params={}, orig=None)
    
    import asyncio
    db_resp = asyncio.run(database_exception_handler(dummy_req, db_exc))
    assert db_resp.status_code == 503
    db_resp_data = json.loads(db_resp.body.decode())
    assert db_resp_data["status"] == "error"
    assert db_resp_data["statusCode"] == 503
    assert "postgres" not in db_resp_data["detail"]
    assert "password" not in db_resp_data["detail"]
    assert "Database service is temporarily unavailable" in db_resp_data["detail"]
    print(f"  [PASS] Database error returned 503 with sanitized message. Zero DB secrets exposed: '{db_resp_data['detail']}'")

    # ---------------------------------------------------------------------------------
    # 11. General Unhandled Server Exception (Zero Stack Traces Leaked)
    # ---------------------------------------------------------------------------------
    print("\n[11/12] Testing General Server Exception Handler (Zero Stack Trace Leakage)...")
    unhandled_exc = RuntimeError("CRITICAL_INTERNAL_CRASH: Traceback (most recent call last): File secret.py line 42")
    
    # In production/debug-false mode
    old_debug = settings.DEBUG
    settings.DEBUG = False
    try:
        gen_resp = asyncio.run(general_exception_handler(dummy_req, unhandled_exc))
        assert gen_resp.status_code == 500
        gen_resp_data = json.loads(gen_resp.body.decode())
        assert gen_resp_data["status"] == "error"
        assert gen_resp_data["statusCode"] == 500
        assert "Traceback" not in gen_resp_data["detail"]
        assert "secret.py" not in gen_resp_data["detail"]
        assert "internal server error" in gen_resp_data["detail"].lower()
        print(f"  [PASS] Unhandled exception returned 500 with sanitized message. Zero stack traces exposed: '{gen_resp_data['detail']}'")
    finally:
        settings.DEBUG = old_debug

    # ---------------------------------------------------------------------------------
    # 12. Missing Model Exception Handling
    # ---------------------------------------------------------------------------------
    print("\n[12/12] Testing Missing ML Model Exception Response...")
    from app.utils.exceptions import ModelNotFoundException
    model_exc = ModelNotFoundException("Facial Emotion Classifier")
    model_resp = asyncio.run(http_exception_handler(dummy_req, model_exc))
    assert model_resp.status_code == 503
    model_resp_data = json.loads(model_resp.body.decode())
    assert model_resp_data["status"] == "error"
    assert model_resp_data["statusCode"] == 503
    assert "trained model weights" in model_resp_data["detail"]
    print(f"  [PASS] Missing model returned 503 with clean structured JSON: '{model_resp_data['detail']}'")

    print("\n================================================================================")
    print("      ALL 12 BACKEND ERROR HANDLING CRITERIA PASSED WITH ZERO VULNERABILITIES!  ")
    print("================================================================================\n")

if __name__ == "__main__":
    run_error_handling_tests()
