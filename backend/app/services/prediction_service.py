import os
import uuid
import math
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, date
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status
from app.models.uploaded_file import UploadedFile
from app.models.prediction import Prediction
from app.models.prediction_history import PredictionHistory
from app.models.child import Child
from app.models.user import User
from app.schemas.prediction import (
    UploadedFileOut,
    PredictionRecordOut,
    PredictionDetailOut,
    PaginatedPredictionsOut,
    PredictionHistoryOut,
)

class PredictionPersistenceService:
    @classmethod
    def _sanitize_relations(
        cls, db: Session, user_id: Optional[str], child_id: Optional[str]
    ) -> Tuple[Optional[str], Optional[str]]:
        valid_user_id = None
        if user_id:
            if db.query(User.id).filter(User.id == user_id).first():
                valid_user_id = user_id

        valid_child_id = None
        if child_id:
            if db.query(Child.id).filter(Child.id == child_id).first():
                valid_child_id = child_id

        return valid_user_id, valid_child_id

    @classmethod
    def record_file_upload(
        cls,
        db: Session,
        file_path: Path,
        file_name: str,
        file_type: str,
        user_id: Optional[str] = None,
        child_id: Optional[str] = None,
    ) -> UploadedFile:
        user_id, child_id = cls._sanitize_relations(db, user_id, child_id)
        file_id = f"upl_{uuid.uuid4().hex[:8]}"
        size_bytes = file_path.stat().st_size if file_path.exists() else 0
        ext = file_path.suffix.lower()

        uploaded = UploadedFile(
            id=file_id,
            user_id=user_id,
            child_id=child_id,
            file_name=file_name,
            file_path=str(file_path),
            file_type=file_type,
            file_size_bytes=size_bytes,
            mime_type=f"{file_type}/{ext.replace('.', '')}",
            created_at=datetime.utcnow()
        )
        db.add(uploaded)
        db.commit()
        db.refresh(uploaded)
        return uploaded

    @classmethod
    def record_prediction(
        cls,
        db: Session,
        file_id: str,
        assessment_type: str,
        model_name: str,
        predicted_class: str,
        confidence_score: float,
        has_autism_signs: bool,
        status: str,
        status_tone: str,
        explanation: str,
        recommendation: str,
        raw_probabilities: List[Dict[str, Any]],
        metadata_json: Dict[str, Any],
        predicted_behavior_key: Optional[str] = None,
        user_id: Optional[str] = None,
        child_id: Optional[str] = None,
    ) -> Prediction:
        user_id, child_id = cls._sanitize_relations(db, user_id, child_id)
        pred_id = f"pred_{uuid.uuid4().hex[:8]}"
        
        prediction = Prediction(
            id=pred_id,
            user_id=user_id,
            child_id=child_id,
            file_id=file_id,
            model_name=model_name,
            model_version="1.0.0",
            assessment_type=assessment_type,
            predicted_class=predicted_class,
            predicted_behavior_key=predicted_behavior_key,
            confidence_score=confidence_score,
            has_autism_signs=has_autism_signs,
            status=status,
            status_tone=status_tone,
            explanation=explanation,
            recommendation=recommendation,
            raw_probabilities=raw_probabilities,
            metadata_json=metadata_json,
            created_at=datetime.utcnow()
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        # Log initial creation history
        history_id = f"hist_{uuid.uuid4().hex[:8]}"
        history = PredictionHistory(
            id=history_id,
            prediction_id=prediction.id,
            user_id=user_id,
            child_id=child_id,
            action="created",
            reviewer_notes="Automated AI Model Inference Execution",
            snapshot_data={
                "predicted_class": predicted_class,
                "confidence": confidence_score,
                "has_signs": has_autism_signs,
            },
            created_at=datetime.utcnow()
        )
        db.add(history)
        db.commit()

        return prediction

    @classmethod
    def _format_prediction_record(cls, r: Prediction, db: Session) -> PredictionRecordOut:
        is_video = "video" in r.assessment_type.lower()
        pred_type = "video" if is_video else "image"
        
        # Child name resolution
        child_name = None
        if r.child_id:
            child = db.query(Child).filter(Child.id == r.child_id).first()
            if child:
                child_name = child.name
        if not child_name and r.metadata_json and isinstance(r.metadata_json, dict):
            child_name = r.metadata_json.get("childName")

        # File URL resolution
        file_url = None
        if r.file:
            file_path_str = r.file.file_path
            if "uploads" in file_path_str:
                parts = file_path_str.replace("\\", "/").split("uploads/")
                if len(parts) > 1:
                    file_url = f"/uploads/{parts[1]}"

        created_iso = r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat()
        date_simple = r.created_at.strftime("%Y-%m-%d") if r.created_at else datetime.utcnow().strftime("%Y-%m-%d")

        return PredictionRecordOut(
            id=r.id,
            type=pred_type,
            assessmentType=r.assessment_type,
            modelName=r.model_name,
            predictedClass=r.predicted_class,
            predictedEmotion=r.predicted_class if not is_video else None,
            predictedBehavior=r.predicted_class if is_video else None,
            predictedBehaviorKey=r.predicted_behavior_key,
            confidenceScore=round(r.confidence_score, 4),
            confidencePercentage=f"{round(r.confidence_score * 100, 1)}%",
            hasAutismSigns=r.has_autism_signs,
            status=r.status,
            statusTone=r.status_tone or "neutral",
            explanation=r.explanation,
            recommendation=r.recommendation,
            rawProbabilities=r.raw_probabilities or [],
            metadataJson=r.metadata_json or {},
            childId=r.child_id,
            child_id=r.child_id,
            childName=child_name or "Selected Child",
            fileId=r.file_id,
            file_id=r.file_id,
            fileUrl=file_url,
            date=date_simple,
            createdAt=created_iso
        )

    @classmethod
    def get_user_predictions_paginated(
        cls,
        db: Session,
        current_user: Optional[User] = None,
        pred_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        child_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedPredictionsOut:
        """
        Query predictions with user ownership isolation or child_id filtering, and pagination.
        """
        query = db.query(Prediction)

        # User Isolation: authenticated standard users access their own records
        if current_user:
            if current_user.role not in ["admin", "doctor"]:
                query = query.filter(Prediction.user_id == current_user.id)
        elif not child_id:
            # If unauthenticated and no child_id filter provided, return empty
            return PaginatedPredictionsOut(items=[], total=0, page=page, pageSize=page_size, totalPages=1, hasMore=False)

        # Filter by type ("image" or "video")
        if pred_type and pred_type.lower() != "all":
            norm_type = pred_type.lower().strip()
            if norm_type in ["image", "images", "image analysis"]:
                query = query.filter(Prediction.assessment_type.ilike("%image%"))
            elif norm_type in ["video", "videos", "video analysis"]:
                query = query.filter(Prediction.assessment_type.ilike("%video%"))

        # Filter by child_id
        if child_id:
            query = query.filter(Prediction.child_id == child_id)

        # Filter by start_date
        if start_date:
            try:
                if len(start_date) == 10:  # YYYY-MM-DD
                    dt_start = datetime.strptime(start_date, "%Y-%m-%d")
                else:
                    dt_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                query = query.filter(Prediction.created_at >= dt_start)
            except Exception:
                pass

        # Filter by end_date
        if end_date:
            try:
                if len(end_date) == 10:  # YYYY-MM-DD
                    dt_end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
                else:
                    dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                    if dt_end.hour == 0 and dt_end.minute == 0:
                        dt_end = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
                query = query.filter(Prediction.created_at <= dt_end)
            except Exception:
                pass

        total = query.count()
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
        has_more = page < total_pages

        offset = (page - 1) * page_size
        records = query.order_by(Prediction.created_at.desc()).offset(offset).limit(page_size).all()

        formatted_items = [cls._format_prediction_record(r, db) for r in records]

        return PaginatedPredictionsOut(
            items=formatted_items,
            total=total,
            page=page,
            pageSize=page_size,
            page_size=page_size,
            totalPages=total_pages,
            total_pages=total_pages,
            hasMore=has_more,
            has_more=has_more
        )

    @classmethod
    def get_user_prediction_by_id(
        cls,
        db: Session,
        prediction_id: str,
        current_user: User
    ) -> PredictionDetailOut:
        """
        Retrieve full prediction details with file information and audit timeline.
        Verifies ownership.
        """
        pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
        if not pred:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction record not found."
            )

        # Ownership check
        if current_user.role not in ["admin", "doctor"] and pred.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this prediction record."
            )

        base_record = cls._format_prediction_record(pred, db)

        # File details
        file_details = None
        if pred.file:
            f = pred.file
            file_details = UploadedFileOut(
                id=f.id,
                fileName=f.file_name,
                filePath=f.file_path,
                fileType=f.file_type,
                fileSizeBytes=f.file_size_bytes or 0,
                mimeType=f.mime_type,
                createdAt=f.created_at.isoformat() if f.created_at else ""
            )

        # History timeline
        histories = (
            db.query(PredictionHistory)
            .filter(PredictionHistory.prediction_id == pred.id)
            .order_by(PredictionHistory.created_at.desc())
            .all()
        )
        history_out = [
            PredictionHistoryOut(
                id=h.id,
                predictionId=h.prediction_id,
                action=h.action,
                reviewerNotes=h.reviewer_notes,
                clinicalFeedback=h.clinical_feedback,
                snapshotData=h.snapshot_data or {},
                createdAt=h.created_at.isoformat() if h.created_at else ""
            )
            for h in histories
        ]

        return PredictionDetailOut(
            **base_record.model_dump(),
            fileDetails=file_details,
            history=history_out
        )

    @classmethod
    def delete_user_prediction(
        cls,
        db: Session,
        prediction_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        Delete a prediction record and its associated history.
        Verifies user ownership.
        """
        pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
        if not pred:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction record not found."
            )

        # Ownership check
        if current_user.role != "admin" and pred.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this prediction record."
            )

        # Optional: delete stored file from disk if owned
        if pred.file and pred.file.file_path:
            try:
                p = Path(pred.file.file_path)
                if p.exists():
                    p.unlink()
                db.delete(pred.file)
            except Exception:
                pass

        db.delete(pred)
        db.commit()

        return {
            "message": "Prediction record and associated history deleted successfully.",
            "id": prediction_id,
            "success": True
        }
