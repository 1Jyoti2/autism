import uuid
import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_parent_child_flow():
    print("================================================================================")
    print("      TESTING USER-SPECIFIC PARENT CHILD PROFILE & IMAGE ASSESSMENT FLOW        ")
    print("================================================================================")

    # 1. Register a fresh parent user
    unique_suffix = uuid.uuid4().hex[:6]
    email = f"parent.test.{unique_suffix}@autism-platform.org"
    password = "SafePassword#2026!"
    
    print(f"\n[1] Registering fresh parent user: {email}...")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "fullName": f"Parent Tester {unique_suffix}",
        "role": "parent"
    })
    assert reg_res.status_code in [200, 201], f"Registration failed: {reg_res.text}"
    auth_data = reg_res.json()
    token = auth_data["token"]
    user_id = auth_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [SUCCESS] Registered user {user_id} with JWT token.")

    # 2. Query children for this new parent (MUST BE EMPTY, NO DUMMY DATA)
    print("\n[2] Fetching children for newly registered parent (should be empty)...")
    get_children_res = requests.get(f"{BASE_URL}/children", headers=headers)
    assert get_children_res.status_code == 200, f"Get children failed: {get_children_res.text}"
    children = get_children_res.json()
    print(f"  [RESULT] Returned {len(children)} children: {children}")
    assert len(children) == 0, f"Expected 0 children for new parent, but got {len(children)} (dummy seed data detected!)"
    print("  [SUCCESS] Verified: New parent has 0 children; no hardcoded dummy data leaked!")

    # 3. Create a real child for this parent
    print("\n[3] Creating real child profile for parent...")
    child_payload = {
        "name": f"Aarav TestChild {unique_suffix}",
        "dateOfBirth": "2023-05-15",
        "gender": "male",
        "caregiverName": f"Parent Tester {unique_suffix}",
        "relationship": "parent",
        "notes": "Loves building blocks and drawing."
    }
    create_child_res = requests.post(f"{BASE_URL}/children", json=child_payload, headers=headers)
    assert create_child_res.status_code == 201, f"Child creation failed: {create_child_res.text}"
    created_child = create_child_res.json()
    child_id = created_child["id"]
    print(f"  [SUCCESS] Child created: {created_child['name']} (ID: {child_id}, Age: {created_child['ageMonths']}m)")
    assert created_child["userId"] == user_id, f"Child userId mismatch: expected {user_id}, got {created_child.get('userId')}"

    # 4. Fetch children again (MUST RETURN EXACTLY THIS CHILD)
    print("\n[4] Re-fetching children for parent...")
    get_children_res2 = requests.get(f"{BASE_URL}/children", headers=headers)
    assert get_children_res2.status_code == 200
    children2 = get_children_res2.json()
    assert len(children2) == 1, f"Expected exactly 1 child, got {len(children2)}"
    assert children2[0]["id"] == child_id
    assert children2[0]["name"] == child_payload["name"]
    print(f"  [SUCCESS] Dynamic dropdown query returns exactly registered child: {children2[0]['name']}")

    # 5. Test Image Assessment with this registered child
    print("\n[5] Running Image Assessment for registered child...")
    from PIL import Image
    test_img_path = "test_eval_child_face.jpg"
    img = Image.new("RGB", (224, 224), color=(180, 160, 140))
    img.save(test_img_path)
    try:
        with open(test_img_path, "rb") as f:
            files = {"file": ("test_eval_child_face.jpg", f, "image/jpeg")}
            data = {
                "child_name": created_child["name"],
                "child_id": child_id
            }
            analyze_res = requests.post(f"{BASE_URL}/analyze-image", files=files, data=data, headers=headers)
    finally:
        import os
        if os.path.exists(test_img_path):
            os.remove(test_img_path)
    assert analyze_res.status_code == 200, f"Analyze image failed: {analyze_res.text}"
    analysis = analyze_res.json()
    print(f"  [SUCCESS] Analysis completed!")
    print(f"    - Child Name: {analysis.get('childName')}")
    print(f"    - Child ID: {analysis.get('childId')}")
    print(f"    - Emotion: {analysis.get('predictedEmotion') or analysis.get('predicted_emotion')}")
    print(f"    - Confidence: {analysis.get('confidenceScore') or analysis.get('confidence_score')}")
    print(f"    - Stored Prediction ID: {analysis.get('predictionId')}")

    assert analysis.get("childName") == created_child["name"], f"Expected childName {created_child['name']}, got {analysis.get('childName')}"
    assert analysis.get("childId") == child_id, f"Expected childId {child_id}, got {analysis.get('childId')}"

    # 6. Verify prediction history stored in database for this parent and child
    print("\n[6] Verifying user prediction history in DB...")
    pred_res = requests.get(f"{BASE_URL}/predictions?childId={child_id}", headers=headers)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert pred_data["total"] >= 1, f"Expected at least 1 prediction record in DB, got {pred_data['total']}"
    latest_pred = pred_data["items"][0]
    pred_child_id = latest_pred.get("childId") or latest_pred.get("child_id")
    print(f"  [SUCCESS] Verified DB record: Prediction ID {latest_pred['id']} linked to Child {pred_child_id} ({latest_pred.get('childName')})")
    assert pred_child_id == child_id

    # 7. Register a second parent to ensure strict user isolation
    print("\n[7] Verifying user isolation with a second parent...")
    reg2_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": f"parent2.test.{unique_suffix}@autism-platform.org",
        "password": password,
        "fullName": "Second Parent",
        "role": "parent"
    })
    token2 = reg2_res.json()["token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    get2 = requests.get(f"{BASE_URL}/children", headers=headers2)
    assert len(get2.json()) == 0, f"Parent 2 saw Parent 1's children! Isolation failed!"
    print("  [SUCCESS] Verified strict user isolation: Parent 2 sees 0 children!")

    print("\n================================================================================")
    print("          ALL USER-SPECIFIC PARENT-CHILD FLOW AUDITS PASSED 100%!               ")
    print("================================================================================")

if __name__ == "__main__":
    test_full_parent_child_flow()
