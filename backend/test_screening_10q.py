import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_10_question_screening():
    print("=" * 80)
    print("      TESTING 10-QUESTION DEVELOPMENTAL SCREENING & SCORING PIPELINE     ")
    print("=" * 80)

    # 1. Test /screenings/compute with Low Risk answers (All Always = 0)
    print("\n[1] Testing Low Risk screening computation (All Always = 0)...")
    low_answers = {
        "q_si_01": 0, "q_si_02": 0, "q_si_03": 0,
        "q_co_01": 0, "q_co_02": 0, "q_co_03": 0,
        "q_rb_01": 0, "q_rb_02": 0,
        "q_se_01": 0, "q_se_02": 0,
    }
    res_low = requests.post(f"{BASE_URL}/screenings/compute", json={"answers": low_answers})
    assert res_low.status_code == 200, f"Compute failed: {res_low.text}"
    data_low = res_low.json()
    print(f"  [RESULT] Total: {data_low['totalScore']} / {data_low['maxScore']}, Likelihood: {data_low['likelihood']}, Prob: {data_low['probability']}%")
    assert data_low["totalScore"] == 0
    assert data_low["maxScore"] == 30
    assert data_low["likelihood"] == "low"
    assert "socialInteraction" in data_low["domainScores"]
    print("  [SUCCESS] Low risk verified out of 30!")

    # 2. Test /screenings/compute with Medium / Elevated Risk answers (Score ~15)
    print("\n[2] Testing Elevated Risk screening computation (Score 15)...")
    med_answers = {
        "q_si_01": 2, "q_si_02": 1, "q_si_03": 2, # 5 / 9
        "q_co_01": 1, "q_co_02": 2, "q_co_03": 1, # 4 / 9
        "q_rb_01": 2, "q_rb_02": 1,                 # 3 / 6
        "q_se_01": 2, "q_se_02": 1,                 # 3 / 6
    }
    res_med = requests.post(f"{BASE_URL}/screenings/compute", json={"answers": med_answers})
    assert res_med.status_code == 200
    data_med = res_med.json()
    print(f"  [RESULT] Total: {data_med['totalScore']} / {data_med['maxScore']}, Likelihood: {data_med['likelihood']}, Prob: {data_med['probability']}%")
    assert data_med["totalScore"] == 15
    assert data_med["maxScore"] == 30
    assert data_med["likelihood"] == "elevated"
    print("  [SUCCESS] Elevated risk verified out of 30!")

    # 3. Test /screenings/compute with High Risk answers (All Never = 3)
    print("\n[3] Testing High Risk screening computation (All Never = 3)...")
    high_answers = {
        "q_si_01": 3, "q_si_02": 3, "q_si_03": 3,
        "q_co_01": 3, "q_co_02": 3, "q_co_03": 3,
        "q_rb_01": 3, "q_rb_02": 3,
        "q_se_01": 3, "q_se_02": 3,
    }
    res_high = requests.post(f"{BASE_URL}/screenings/compute", json={"answers": high_answers})
    assert res_high.status_code == 200
    data_high = res_high.json()
    print(f"  [RESULT] Total: {data_high['totalScore']} / {data_high['maxScore']}, Likelihood: {data_high['likelihood']}, Prob: {data_high['probability']}%")
    assert data_high["totalScore"] == 30
    assert data_high["maxScore"] == 30
    assert data_high["likelihood"] == "high"
    print("  [SUCCESS] High risk verified out of 30!")

    # 4. Test persisting 10-question screening via POST /screenings
    print("\n[4] Testing POST /screenings to persist 10-question screening in DB...")
    save_payload = {
        "childId": "ch_test_10q",
        "assessmentType": "10-Question Developmental Screening",
        "answers": med_answers,
        "domainScores": data_med["domainScores"],
        "totalScore": data_med["totalScore"],
        "maxScore": 30,
        "probability": data_med["probability"],
        "likelihood": data_med["likelihood"],
        "recommendations": data_med["recommendations"],
    }
    save_res = requests.post(f"{BASE_URL}/screenings", json=save_payload)
    assert save_res.status_code == 201, f"Save screening failed: {save_res.text}"
    saved_scr = save_res.json()
    print(f"  [SUCCESS] Saved Screening ID: {saved_scr['id']}, Child ID: {saved_scr['childId']}")
    assert saved_scr["totalScore"] == 15
    assert saved_scr["maxScore"] == 30
    assert len(saved_scr["answers"]) == 10

    # 5. Test GET /screenings query
    print("\n[5] Testing GET /screenings query...")
    get_res = requests.get(f"{BASE_URL}/screenings?childId=ch_test_10q")
    assert get_res.status_code == 200
    records = get_res.json()
    assert any(r["id"] == saved_scr["id"] for r in records)
    print("  [SUCCESS] Found saved screening in DB query!")

    # 6. Cleanup test screening
    print("\n[6] Cleaning up test screening record...")
    del_res = requests.delete(f"{BASE_URL}/screenings/{saved_scr['id']}")
    assert del_res.status_code == 200
    print("  [SUCCESS] Cleanup complete.")

    print("\n" + "=" * 80)
    print("        ALL 10-QUESTION SCREENING TESTS PASSED 100%!             ")
    print("=" * 80)

if __name__ == "__main__":
    test_10_question_screening()
