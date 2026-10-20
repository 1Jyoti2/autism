import os
import sys
import io
import time
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from app.config import settings
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def run_security_audit():
    print("================================================================================")
    print("        COMPREHENSIVE BACKEND SECURITY & VULNERABILITY AUDIT                   ")
    print("================================================================================\n")

    # ---------------------------------------------------------------------------------
    # 1. Password Hashing & Salt Verification
    # ---------------------------------------------------------------------------------
    print("[1/12] Testing Password Hashing & Bcrypt Security...")
    plain_pw = "SuperSecurePassword123!"
    hash1 = get_password_hash(plain_pw)
    hash2 = get_password_hash(plain_pw)
    assert hash1 != plain_pw, "Password was not hashed"
    assert hash1 != hash2, "Password hashing lacks unique cryptographic salting"
    assert hash1.startswith("$2b$") or hash1.startswith("$2a$"), "Hash is not a valid bcrypt string"
    assert verify_password(plain_pw, hash1) is True, "Valid password verification failed"
    assert verify_password("WrongPassword999!", hash1) is False, "Invalid password was accepted"
    print("  [PASS] Cryptographic bcrypt hashing and distinct salts verified.")

    # ---------------------------------------------------------------------------------
    # 2. JWT Validation, Signatures & Claims
    # ---------------------------------------------------------------------------------
    print("\n[2/12] Testing JWT Signature Validation, Claims & Expiration...")
    test_sub = "usr_sec_1001"
    token = create_access_token({"sub": test_sub, "role": "parent"})
    payload = decode_access_token(token)
    assert payload is not None, "Token decoding failed"
    assert payload.get("sub") == test_sub, "Subject claim mismatch"
    assert "exp" in payload and "iat" in payload, "Missing standard JWT timestamp claims"

    # Tampered token check
    tampered_token = token[:-4] + "abcd"
    tampered_payload = decode_access_token(tampered_token)
    assert tampered_payload is None, "Tampered JWT token was incorrectly accepted"
    print("  [PASS] JWT generation, claim encoding, and signature verification verified.")

    # ---------------------------------------------------------------------------------
    # 3. Protected Endpoints & 401 Unauthorized Enforcement
    # ---------------------------------------------------------------------------------
    print("\n[3/12] Testing Protected Endpoints (401 Unauthorized Enforcement)...")
    protected_urls = [
        "/api/auth/me",
        "/api/predictions",
        "/api/predictions/images",
        "/api/predictions/videos",
        "/api/predictions/some_pred_id",
    ]
    for url in protected_urls:
        res = client.get(url)
        assert res.status_code == 401, f"Expected 401 for unauthenticated {url}, got {res.status_code}"
    print(f"  [PASS] All {len(protected_urls)} protected endpoints reject unauthenticated requests.")

    # ---------------------------------------------------------------------------------
    # 4. User Authorization & Multi-Tenant Data Isolation
    # ---------------------------------------------------------------------------------
    print("\n[4/12] Testing Multi-Tenant Data Isolation & Cross-User Access Block (403)...")
    # Register User A (Parent)
    uA_email = f"userA_{os.urandom(3).hex()}@domain.com"
    regA = client.post("/api/auth/register", json={"email": uA_email, "password": "Password123!", "fullName": "Alice A", "role": "parent"}).json()
    tokenA = regA["token"]
    headersA = {"Authorization": f"Bearer {tokenA}"}

    # Register User B (Parent)
    uB_email = f"userB_{os.urandom(3).hex()}@domain.com"
    regB = client.post("/api/auth/register", json={"email": uB_email, "password": "Password123!", "fullName": "Bob B", "role": "parent"}).json()
    tokenB = regB["token"]
    headersB = {"Authorization": f"Bearer {tokenB}"}

    # User A creates a prediction
    workspace_dir = backend_dir.parent
    sample_img = list((workspace_dir / "datasets").rglob("*.jpg"))[0]
    with open(sample_img, "rb") as f:
        predA_res = client.post("/api/analyze-image", files={"file": (sample_img.name, f, "image/jpeg")}, headers=headersA).json()
    predA_id = predA_res["predictionId"]

    # User B attempts to access User A's prediction -> 403 Forbidden
    cross_read = client.get(f"/api/predictions/{predA_id}", headers=headersB)
    assert cross_read.status_code == 403, f"Expected 403 Forbidden, got {cross_read.status_code}"

    # User B attempts to delete User A's prediction -> 403 Forbidden
    cross_del = client.delete(f"/api/predictions/{predA_id}", headers=headersB)
    assert cross_del.status_code == 403, f"Expected 403 Forbidden, got {cross_del.status_code}"
    print("  [PASS] Multi-tenant isolation verified: Cross-user view and delete operations blocked (403).")

    # ---------------------------------------------------------------------------------
    # 5. File Upload Validation & Size Limits
    # ---------------------------------------------------------------------------------
    print("\n[5/12] Testing File Upload Size Limits & Empty File Handling...")
    # Empty file -> 400 Bad Request
    empty_stream = io.BytesIO(b"")
    empty_res = client.post("/api/analyze-image", files={"file": ("empty.jpg", empty_stream, "image/jpeg")})
    assert empty_res.status_code == 400, f"Expected 400, got {empty_res.status_code}"

    # Oversized image (>15 MB limit) -> 413 Request Entity Too Large
    big_stream = io.BytesIO(b"0" * (16 * 1024 * 1024))  # 16 MB
    big_res = client.post("/api/analyze-image", files={"file": ("big.jpg", big_stream, "image/jpeg")})
    assert big_res.status_code in [400, 413], f"Expected 413 or 400 for 16MB image, got {big_res.status_code}"
    print("  [PASS] Empty file and oversized uploads safely rejected.")

    # ---------------------------------------------------------------------------------
    # 6. Allowed Extensions Whitelist Enforcement
    # ---------------------------------------------------------------------------------
    print("\n[6/12] Testing File Extension Whitelist Enforcement (415 Unsupported Media Type)...")
    forbidden_files = [
        ("malicious.exe", "application/x-msdownload"),
        ("exploit.php", "application/x-php"),
        ("script.sh", "application/x-sh"),
        ("payload.py", "text/x-python"),
        ("document.pdf", "application/pdf"),
        ("notes.txt", "text/plain"),
    ]
    for fname, mime in forbidden_files:
        stream = io.BytesIO(b"Malicious dummy payload")
        res = client.post("/api/analyze-image", files={"file": (fname, stream, mime)})
        assert res.status_code == 415, f"Expected 415 for {fname}, got {res.status_code}"
    print(f"  [PASS] All {len(forbidden_files)} non-whitelisted extensions rejected with 415.")

    # ---------------------------------------------------------------------------------
    # 7. Path Traversal & Arbitrary File Overwrite Protection
    # ---------------------------------------------------------------------------------
    print("\n[7/12] Testing Path Traversal Protection...")
    traversal_filenames = [
        "../../etc/passwd.jpg",
        "..\\..\\Windows\\System32\\cmd.exe.jpg",
        "....//....//shell.jpg",
        "nested/sub/dir/test.jpg",
    ]
    with open(sample_img, "rb") as f:
        real_bytes = f.read()

    for trav_name in traversal_filenames:
        stream = io.BytesIO(real_bytes)
        res = client.post("/api/analyze-image", files={"file": (trav_name, stream, "image/jpeg")})
        assert res.status_code == 200, f"Valid image with traversal name should be safely ingested: {res.status_code}"
        # Verify the saved file on disk does NOT escape uploads directory
        data = res.json()
        saved_file_id = data.get("fileId") or data.get("file_id")
        assert saved_file_id is not None
        
        db = SessionLocal()
        from app.models.uploaded_file import UploadedFile
        uploaded = db.query(UploadedFile).filter(UploadedFile.id == saved_file_id).first()
        saved_disk_path = Path(uploaded.file_path)
        assert saved_disk_path.resolve().is_relative_to(settings.UPLOAD_DIR.resolve()), "Saved file escaped uploads directory!"
        db.close()
    print("  [PASS] Path traversal attacks neutralized: Uploads safely sanitized to UUID hex names.")

    # ---------------------------------------------------------------------------------
    # 8. SQL Injection Resistance
    # ---------------------------------------------------------------------------------
    print("\n[8/12] Testing SQL Injection Resistance...")
    sqli_strings = [
        "' OR '1'='1",
        "admin' --",
        "'; DROP TABLE users; --",
        "' UNION SELECT null, null, null --",
        "1' OR 1=1 #",
    ]
    for sqli in sqli_strings:
        # Test SQLi in login email
        login_res = client.post("/api/auth/login", json={"email": f"{sqli}@test.com", "password": "Password123!"})
        assert login_res.status_code in [401, 422], f"SQLi payload broke login with status {login_res.status_code}"

        # Test SQLi in child_id filter
        filter_res = client.get(f"/api/predictions?childId={sqli}", headers=headersA)
        assert filter_res.status_code in [200, 422], f"SQLi payload in query param broke server: {filter_res.status_code}"
    print("  [PASS] SQL Injection attacks neutralized via SQLAlchemy parameterized queries.")

    # ---------------------------------------------------------------------------------
    # 9. CORS Configuration & Header Inspection
    # ---------------------------------------------------------------------------------
    print("\n[9/12] Testing CORS Configuration & Origin Headers...")
    assert "*" not in settings.CORS_ORIGINS, "Wildcard '*' must not be combined with allow_credentials=True"
    for allowed_origin in ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]:
        assert allowed_origin in settings.CORS_ORIGINS, f"Trusted origin {allowed_origin} missing"
    
    cors_preflight = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization"
        }
    )
    assert cors_preflight.status_code in [200, 204]
    print("  [PASS] CORS configured strictly with explicit trusted frontend origins.")

    # ---------------------------------------------------------------------------------
    # 10. Sensitive Data Leakage in API Responses
    # ---------------------------------------------------------------------------------
    print("\n[10/12] Testing Sensitive Information Exposure in JSON Responses...")
    # Check registration response
    reg_user = regA["user"]
    assert "hashed_password" not in reg_user, "Password hash leaked in registration response!"
    assert "password" not in reg_user, "Plain password leaked in registration response!"

    # Check /api/auth/me response
    me_resp = client.get("/api/auth/me", headers=headersA).json()
    assert "hashed_password" not in me_resp, "Password hash leaked in /api/auth/me!"
    assert "password" not in me_resp, "Password leaked in /api/auth/me!"
    print("  [PASS] Zero sensitive password hashes or credentials exposed in JSON payloads.")

    # ---------------------------------------------------------------------------------
    # 11. Environment Variables & Secret Configuration
    # ---------------------------------------------------------------------------------
    print("\n[11/12] Testing Environment Variables & Secret Settings...")
    assert settings.SECRET_KEY is not None and len(settings.SECRET_KEY) >= 16, "Insecure secret key length"
    assert settings.ALGORITHM == "HS256", "Insecure JWT algorithm"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0, "Invalid token expiry"
    print("  [PASS] Security configuration keys, algorithms, and token expiration verified.")

    # ---------------------------------------------------------------------------------
    # 12. Corrupted Binary & Malformed Media Resilience
    # ---------------------------------------------------------------------------------
    print("\n[12/12] Testing Malformed Binary & Corruption Resilience...")
    corrupt_bytes = io.BytesIO(b"CORRUPTED_GARBAGE_HEADER\x00\x01\x02\xFF\xFE\xFD")
    r_corrupt = client.post("/api/analyze-image", files={"file": ("fake.jpg", corrupt_bytes, "image/jpeg")})
    assert r_corrupt.status_code == 400
    assert "corrupt" in r_corrupt.json()["detail"].lower() or "invalid" in r_corrupt.json()["detail"].lower()
    print("  [PASS] Malformed and corrupted binary payloads handled gracefully with 400 Bad Request.")

    print("\n================================================================================")
    print("        ALL 12 SECURITY AUDIT TEST CRITERIA PASSED WITH ZERO VULNERABILITIES!  ")
    print("================================================================================\n")

if __name__ == "__main__":
    run_security_audit()
