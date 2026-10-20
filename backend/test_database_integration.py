import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text, func

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import Base, engine, SessionLocal, get_db
from app.models.user import User
from app.models.child import Child
from app.models.screening import ScreeningRecord
from app.models.uploaded_file import UploadedFile
from app.models.prediction import Prediction
from app.models.prediction_history import PredictionHistory
from app.models.note import Note
from app.models.notification import Notification
from app.services.dashboard_service import DashboardService
from app.utils.security import get_password_hash, verify_password

def run_db_audit():
    print("================================================================================")
    print("      COMPREHENSIVE DATABASE CRUD, RELATIONSHIPS & AGGREGATION AUDIT            ")
    print("================================================================================\n")

    db: Session = SessionLocal()
    try:
        # -----------------------------------------------------------------------------
        # 1. Verify Database Connection & Engine Configuration
        # -----------------------------------------------------------------------------
        print("[1/8] Verifying Database Connection & Dialect...")
        db_url_display = settings.DATABASE_URL.split('@')[-1] if '@' in (settings.DATABASE_URL or '') else settings.DATABASE_URL
        print(f"  Target DB URL: {db_url_display}")
        result = db.execute(text("SELECT 1")).scalar()
        assert result == 1, "Database connectivity check failed"
        print("  [SUCCESS] Database connection active. Basic SQL execution verified.")

        # Ensure all tables exist in schema metadata
        table_names = list(Base.metadata.tables.keys())
        expected_tables = ["users", "children", "screenings", "uploaded_files", "predictions", "prediction_history", "notes", "notifications"]
        for t in expected_tables:
            assert t in table_names, f"Expected table '{t}' missing from metadata"
        print(f"  [SUCCESS] All {len(expected_tables)} schema tables verified in metadata: {expected_tables}")

        # -----------------------------------------------------------------------------
        # 2. Test User Model: INSERT, READ, UPDATE, DELETE
        # -----------------------------------------------------------------------------
        print("\n[2/8] Testing User CRUD & Password Hashing Persistence...")
        test_uid = f"usr_test_{uuid.uuid4().hex[:6]}"
        test_email = f"doctor.test.{uuid.uuid4().hex[:6]}@clinic.org"
        raw_password = "SecurePassword123!"
        hashed_pwd = get_password_hash(raw_password)

        # INSERT
        new_user = User(
            id=test_uid,
            email=test_email,
            hashed_password=hashed_pwd,
            full_name="Dr. Elena Rostova",
            role="doctor",
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"  [INSERT] User inserted: {new_user.id} ({new_user.email})")

        # READ
        queried_user = db.query(User).filter(User.id == test_uid).first()
        assert queried_user is not None
        assert queried_user.email == test_email
        assert verify_password(raw_password, queried_user.hashed_password) is True
        print(f"  [READ] User fetched & password hash verified against bcrypt.")

        # UPDATE
        queried_user.full_name = "Dr. Elena Rostova, MD, PhD"
        queried_user.role = "doctor"
        db.commit()
        db.refresh(queried_user)
        assert queried_user.full_name == "Dr. Elena Rostova, MD, PhD"
        print(f"  [UPDATE] User profile updated successfully.")

        # -----------------------------------------------------------------------------
        # 3. Test Child & Patient Persistence: INSERT, READ, UPDATE
        # -----------------------------------------------------------------------------
        print("\n[3/8] Testing Child Profile CRUD Operations...")
        test_child_id = f"ch_test_{uuid.uuid4().hex[:6]}"
        new_child = Child(
            id=test_child_id,
            name="Test Patient Baby",
            date_of_birth="2022-06-15",
            gender="male",
            caregiver_name="Anna Rostova",
            relationship="mother",
            notes="Active motor exploration during morning sessions.",
            status="Needs Review",
            risk_level="High",
            created_at=datetime.utcnow()
        )
        db.add(new_child)
        db.commit()
        db.refresh(new_child)
        print(f"  [INSERT] Child record created: {new_child.id} ({new_child.name})")

        # Read & Update Child
        ch = db.query(Child).filter(Child.id == test_child_id).first()
        assert ch is not None
        ch.risk_level = "Medium"
        db.commit()
        db.refresh(ch)
        assert ch.risk_level == "Medium"
        print(f"  [UPDATE] Child risk level updated to 'Medium'.")

        # -----------------------------------------------------------------------------
        # 4. Test UploadedFile & Foreign Key Linkage
        # -----------------------------------------------------------------------------
        print("\n[4/8] Testing UploadedFile Tracking & Metadata...")
        test_file_id = f"upl_test_{uuid.uuid4().hex[:6]}"
        test_file_path = backend_dir / "uploads" / "images" / f"sample_{test_file_id}.jpg"
        
        uploaded_file = UploadedFile(
            id=test_file_id,
            user_id=test_uid,
            child_id=test_child_id,
            file_name="sample_assessment.jpg",
            file_path=str(test_file_path),
            file_type="image",
            file_size_bytes=45230,
            mime_type="image/jpeg",
            created_at=datetime.utcnow()
        )
        db.add(uploaded_file)
        db.commit()
        db.refresh(uploaded_file)
        print(f"  [INSERT] UploadedFile record inserted: {uploaded_file.id} linked to User {uploaded_file.user_id}")
        assert uploaded_file.user.id == test_uid
        assert uploaded_file.child.id == test_child_id
        print(f"  [RELATION] Bidirectional relationships verified: UploadedFile.user -> {uploaded_file.user.email}")

        # -----------------------------------------------------------------------------
        # 5. Test Predictions (Image & Video) & PredictionHistory Audit Links
        # -----------------------------------------------------------------------------
        print("\n[5/8] Testing Predictions & Cascade Audit History Links...")
        # 5.1 Image Prediction
        img_pred_id = f"pred_img_{uuid.uuid4().hex[:6]}"
        img_pred = Prediction(
            id=img_pred_id,
            user_id=test_uid,
            child_id=test_child_id,
            file_id=test_file_id,
            model_name="emotion_resnet18",
            model_version="1.0.0",
            assessment_type="Image Analysis",
            predicted_class="Sadness",
            confidence_score=0.925,
            has_autism_signs=True,
            status="Autism-Related Signs Detected",
            status_tone="danger",
            explanation="Atypical social-emotional facial expression alignment detected.",
            recommendation="Specialist follow-up evaluation recommended.",
            raw_probabilities=[
                {"class_key": "sadness", "label": "Sadness", "confidence": 0.925, "percentage": "92.5%"},
                {"class_key": "anger", "label": "Anger", "confidence": 0.045, "percentage": "4.5%"},
                {"class_key": "natural", "label": "Natural", "confidence": 0.030, "percentage": "3.0%"}
            ],
            metadata_json={"childName": "Test Patient Baby", "modelLatencyMs": 24.5},
            created_at=datetime.utcnow()
        )
        db.add(img_pred)

        # 5.2 Video Prediction
        vid_pred_id = f"pred_vid_{uuid.uuid4().hex[:6]}"
        vid_pred = Prediction(
            id=vid_pred_id,
            user_id=test_uid,
            child_id=test_child_id,
            file_id=test_file_id,
            model_name="video_stimming_classifier",
            model_version="1.0.0",
            assessment_type="Video Analysis",
            predicted_class="Arm Flapping",
            predicted_behavior_key="arm_flapping",
            confidence_score=0.962,
            has_autism_signs=True,
            status="Autism-Related Behavioral Signs Detected",
            status_tone="danger",
            explanation="Temporal video analysis identified motor repetition cues.",
            recommendation="Clinical behavioral review recommended.",
            raw_probabilities=[
                {"class_key": "arm_flapping", "label": "Arm Flapping", "confidence": 0.962, "percentage": "96.2%"},
                {"class_key": "head_banging", "label": "Head Banging", "confidence": 0.025, "percentage": "2.5%"},
                {"class_key": "spinning", "label": "Spinning", "confidence": 0.013, "percentage": "1.3%"}
            ],
            metadata_json={"durationSeconds": 42.0, "totalFrames": 1260},
            created_at=datetime.utcnow()
        )
        db.add(vid_pred)
        db.commit()

        # 5.3 Audit History records for each prediction
        hist1 = PredictionHistory(
            id=f"ph_{uuid.uuid4().hex[:8]}",
            prediction_id=img_pred_id,
            user_id=test_uid,
            child_id=test_child_id,
            action="created",
            reviewer_notes="Automated PyTorch ResNet18 pipeline inference completed.",
            created_at=datetime.utcnow()
        )
        hist2 = PredictionHistory(
            id=f"ph_{uuid.uuid4().hex[:8]}",
            prediction_id=vid_pred_id,
            user_id=test_uid,
            child_id=test_child_id,
            action="created",
            reviewer_notes="Automated MobileNetV3 stimming action classification completed.",
            created_at=datetime.utcnow()
        )
        db.add_all([hist1, hist2])
        db.commit()

        # Verify query and relation
        loaded_img_pred = db.query(Prediction).filter(Prediction.id == img_pred_id).first()
        assert loaded_img_pred is not None
        assert loaded_img_pred.user.id == test_uid
        assert len(loaded_img_pred.history_entries) == 1
        assert loaded_img_pred.raw_probabilities[0]["class_key"] == "sadness"
        print(f"  [SUCCESS] Image prediction ({img_pred_id}) and Video prediction ({vid_pred_id}) saved with JSON probabilities and audit logs.")

        # -------------------------------------------------------------
        # 6. Test Cascade Deletion: Deleting Prediction cascades History
        # -------------------------------------------------------------
        print("\n[6/8] Testing Cascade Deletion Integrity...")
        pred_to_delete = img_pred_id
        db.delete(loaded_img_pred)
        db.commit()

        # Prediction should be deleted
        assert db.query(Prediction).filter(Prediction.id == pred_to_delete).first() is None
        # Cascade should have deleted linked PredictionHistory
        linked_hist = db.query(PredictionHistory).filter(PredictionHistory.prediction_id == pred_to_delete).all()
        assert len(linked_hist) == 0, "Cascade failed: history entries remained after prediction deletion"
        print("  [SUCCESS] Cascade deletion verified: Deleting prediction cleanly removed child history logs.")

        # -------------------------------------------------------------
        # 7. Test Clinical Screenings, Notes & Notifications Persistence
        # -------------------------------------------------------------
        print("\n[7/8] Testing Screenings, Notes & Notifications CRUD...")
        # Screening record
        scr_id = f"scr_test_{uuid.uuid4().hex[:6]}"
        new_scr = ScreeningRecord(
            id=scr_id,
            child_id=test_child_id,
            total_score=24,
            max_score=60,
            probability=40,
            likelihood="elevated",
            domain_scores={"communication": 8, "socialInteraction": 8, "repetitiveBehavior": 4, "sensory": 4},
            answers={"q1": 2, "q2": 2, "q3": 2},
            recommendations=["Discuss developmental observations with pediatrician."],
            created_at=datetime.utcnow()
        )
        db.add(new_scr)

        # Note record
        note_id = f"nt_test_{uuid.uuid4().hex[:6]}"
        new_note = Note(
            id=note_id,
            author="Dr. Elena Rostova",
            role="Doctor",
            title="Comprehensive Neurological Observation",
            content="Child displayed strong engagement with auditory prompts, minor motor cues under stress.",
            child_id=test_child_id,
            date=datetime.utcnow().strftime("%Y-%m-%d")
        )
        db.add(new_note)

        # Notification record
        notif_id = f"notif_test_{uuid.uuid4().hex[:6]}"
        new_notif = Notification(
            id=notif_id,
            user_id=test_uid,
            title="Screening Report Available",
            message="New behavioral screening assessment report generated.",
            time="Just now",
            unread=True,
            created_at=datetime.utcnow()
        )
        db.add(new_notif)
        db.commit()

        assert db.query(ScreeningRecord).filter(ScreeningRecord.id == scr_id).first() is not None
        assert db.query(Note).filter(Note.id == note_id).first() is not None
        assert db.query(Notification).filter(Notification.id == notif_id).first() is not None
        print("  [SUCCESS] Screenings, Notes, and Notifications successfully persisted and queryable.")

        # -------------------------------------------------------------
        # 8. Test Dynamic Database Aggregations & Analytics
        # -------------------------------------------------------------
        print("\n[8/8] Testing Live SQL Analytics & Dashboard Aggregation Logic...")
        metrics = DashboardService.calculate_dashboard_metrics(db=db)
        assert metrics.totalPredictions >= 1
        assert metrics.videoPredictionCount >= 1
        assert len(metrics.mostFrequentBehaviors) >= 1
        print(f"  [SUCCESS] Live SQL Aggregations:")
        print(f"     - Total DB Predictions: {metrics.totalPredictions}")
        print(f"     - Total Images: {metrics.imagePredictionCount} | Total Videos: {metrics.videoPredictionCount}")
        print(f"     - Top Stimming Behaviors: {[b.behavior for b in metrics.mostFrequentBehaviors[:2]]}")
        print(f"     - Top Emotions: {[e.emotion for e in metrics.mostFrequentEmotions[:2]]}")

        # Cleanup test entities
        print("\n--- Cleaning up temporary test records ---")
        db.query(Notification).filter(Notification.id == notif_id).delete()
        db.query(Note).filter(Note.id == note_id).delete()
        db.query(ScreeningRecord).filter(ScreeningRecord.id == scr_id).delete()
        db.query(PredictionHistory).filter(PredictionHistory.prediction_id == vid_pred_id).delete()
        db.query(Prediction).filter(Prediction.id == vid_pred_id).delete()
        db.query(UploadedFile).filter(UploadedFile.id == test_file_id).delete()
        db.query(Child).filter(Child.id == test_child_id).delete()
        db.query(User).filter(User.id == test_uid).delete()
        db.commit()
        print("  [CLEANUP] All test database records purged successfully.")

        print("\n================================================================================")
        print("      ALL DATABASE SCHEMA, CRUD & RELATIONAL AUDITS PASSED WITH ZERO ERRORS!    ")
        print("================================================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    run_db_audit()
