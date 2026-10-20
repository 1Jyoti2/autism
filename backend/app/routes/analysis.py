from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from pathlib import Path
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.analysis import ImageAnalysisOut, VideoAnalysisOut
from app.schemas.prediction import (
    PredictionRecordOut,
    PredictionDetailOut,
    PaginatedPredictionsOut,
    PredictionHistoryOut,
)
from app.services.inference_service import InferenceService
from app.services.prediction_service import PredictionPersistenceService
from app.utils.security import get_current_user, get_optional_current_user
from app.utils.file_handler import (
    save_upload_file,
    validate_image_file,
    validate_video_file,
    MAX_IMAGE_SIZE_BYTES,
    MAX_VIDEO_SIZE_BYTES,
)
from app.utils.logger import ml_logger

router = APIRouter()

@router.get("/models/health", response_model=Dict[str, Any])
def get_ml_models_health():
    """Check the status, devices, and architectures of preloaded ML inference models."""
    return InferenceService.get_models_health()

@router.post("/analyze-image", response_model=ImageAnalysisOut)
@router.post("/emotion/predict", response_model=ImageAnalysisOut)
@router.post("/analysis/image", response_model=ImageAnalysisOut, include_in_schema=False)
@router.post("/analyze_image", response_model=ImageAnalysisOut, include_in_schema=False)
async def analyze_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP)"),
    child_name: str = Form("Selected Child", description="Child's display name"),
    child_id: Optional[str] = Form(None, description="Optional associated child ID"),
    user_id: Optional[str] = Form(None, description="Optional associated user ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Image Upload & Inference API for the Facial Emotion Recognition model (`ml/models/best_model.pt`).
    Routes to dedicated ML Inference Service layer and persists results.
    """
    validate_image_file(file)
    saved_path = await save_upload_file(file, subfolder="images", max_bytes=MAX_IMAGE_SIZE_BYTES)

    effective_user_id = (current_user.id if current_user else None) or user_id

    try:
        # Preprocess and run PyTorch inference via dedicated inference service
        result = InferenceService.analyze_image(saved_path, child_name=child_name)

        # Persist uploaded file to database
        uploaded_rec = PredictionPersistenceService.record_file_upload(
            db=db,
            file_path=saved_path,
            file_name=file.filename or "image.jpg",
            file_type="image",
            user_id=effective_user_id,
            child_id=child_id
        )

        # Persist prediction and history audit log
        pred_rec = PredictionPersistenceService.record_prediction(
            db=db,
            file_id=uploaded_rec.id,
            assessment_type="Image Analysis",
            model_name="emotion_resnet18",
            predicted_class=result.predicted_emotion,
            confidence_score=result.confidence_score,
            has_autism_signs=result.hasSigns,
            status=result.status,
            status_tone=result.statusTone,
            explanation=result.explanation,
            recommendation=result.recommendation,
            raw_probabilities=result.probabilities or [],
            metadata_json={"childName": child_name, "detectedClass": result.detectedClass},
            user_id=effective_user_id,
            child_id=child_id
        )

        result.predictionId = pred_rec.id
        result.prediction_id = pred_rec.id
        result.fileId = uploaded_rec.id
        result.file_id = uploaded_rec.id
        result.childId = child_id
        result.child_id = child_id
        return result

    except HTTPException:
        raise
    except Exception as e:
        ml_logger.error(f"Image assessment flow failed: {e}", exc_info=True)
        err_msg = str(e) if settings.DEBUG else "An unexpected error occurred during image assessment."
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image assessment failed: {err_msg}"
        )

@router.post("/analyze-video", response_model=VideoAnalysisOut)
@router.post("/video/predict", response_model=VideoAnalysisOut)
@router.post("/analysis/video", response_model=VideoAnalysisOut, include_in_schema=False)
@router.post("/analyze_video", response_model=VideoAnalysisOut, include_in_schema=False)
async def analyze_video(
    file: UploadFile = File(..., description="Video file (MP4, AVI, MOV, MKV, WebM)"),
    child_name: str = Form("Selected Child", description="Child's display name"),
    child_id: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Video Upload & Inference API for the Video Stimming Action Model (`video_ml/video_model.pth`).
    Routes to dedicated ML Inference Service layer and persists results.
    """
    validate_video_file(file)
    saved_path = await save_upload_file(file, subfolder="videos", max_bytes=MAX_VIDEO_SIZE_BYTES)

    effective_user_id = (current_user.id if current_user else None) or user_id

    try:
        # Preprocess and run temporal video inference via dedicated inference service
        result = InferenceService.analyze_video(saved_path, child_name=child_name)

        # Persist uploaded file to database
        uploaded_rec = PredictionPersistenceService.record_file_upload(
            db=db,
            file_path=saved_path,
            file_name=file.filename or "video.mp4",
            file_type="video",
            user_id=effective_user_id,
            child_id=child_id
        )

        pred_rec = PredictionPersistenceService.record_prediction(
            db=db,
            file_id=uploaded_rec.id,
            assessment_type="Video Analysis",
            model_name="video_stimming_classifier",
            predicted_class=result.predicted_behavior,
            predicted_behavior_key=result.behaviorKey,
            confidence_score=result.confidence_score,
            has_autism_signs=result.hasSigns,
            status=result.status,
            status_tone=result.statusTone,
            explanation=result.explanation,
            recommendation=result.recommendation,
            raw_probabilities=result.probabilities or [],
            metadata_json=result.video_metadata or {},
            user_id=effective_user_id,
            child_id=child_id
        )

        result.predictionId = pred_rec.id
        result.prediction_id = pred_rec.id
        result.fileId = uploaded_rec.id
        result.file_id = uploaded_rec.id
        result.childId = child_id
        result.child_id = child_id
        return result

    except HTTPException:
        raise
    except Exception as e:
        ml_logger.error(f"Video assessment flow failed: {e}", exc_info=True)
        err_msg = str(e) if settings.DEBUG else "An unexpected error occurred during video assessment."
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video assessment failed: {err_msg}"
        )

# ==========================================
# PREDICTION HISTORY APIS (Protected Routes)
# ==========================================

@router.get("/predictions", response_model=PaginatedPredictionsOut)
@router.get("/predictions/history", response_model=PaginatedPredictionsOut, include_in_schema=False)
def get_user_predictions_history(
    type: Optional[str] = Query(None, description="Filter by type: 'image', 'video', or 'all'"),
    start_date: Optional[str] = Query(None, alias="startDate", description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, alias="endDate", description="Filter to date (YYYY-MM-DD)"),
    child_id: Optional[str] = Query(None, alias="childId", description="Filter by child ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="Items per page"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve authenticated user's prediction history with type and date filters and pagination.
    Users only have access to their own records.
    """
    return PredictionPersistenceService.get_user_predictions_paginated(
        db=db,
        current_user=current_user,
        pred_type=type,
        start_date=start_date,
        end_date=end_date,
        child_id=child_id,
        page=page,
        page_size=page_size
    )

@router.get("/predictions/images", response_model=PaginatedPredictionsOut)
def get_user_image_predictions(
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    child_id: Optional[str] = Query(None, alias="childId"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convenience endpoint to retrieve authenticated user's image predictions only."""
    return PredictionPersistenceService.get_user_predictions_paginated(
        db=db,
        current_user=current_user,
        pred_type="image",
        start_date=start_date,
        end_date=end_date,
        child_id=child_id,
        page=page,
        page_size=page_size
    )

@router.get("/predictions/videos", response_model=PaginatedPredictionsOut)
def get_user_video_predictions(
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    child_id: Optional[str] = Query(None, alias="childId"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convenience endpoint to retrieve authenticated user's video predictions only."""
    return PredictionPersistenceService.get_user_predictions_paginated(
        db=db,
        current_user=current_user,
        pred_type="video",
        start_date=start_date,
        end_date=end_date,
        child_id=child_id,
        page=page,
        page_size=page_size
    )

@router.get("/predictions/{prediction_id}", response_model=PredictionDetailOut)
def get_prediction_detail(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve full details, probabilities, media information, and audit timeline for a specific prediction.
    Users can only access their own records.
    """
    return PredictionPersistenceService.get_user_prediction_by_id(
        db=db,
        prediction_id=prediction_id,
        current_user=current_user
    )

@router.delete("/predictions/{prediction_id}", status_code=status.HTTP_200_OK)
def delete_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user's own prediction record and associated audit history.
    Users can only delete their own records.
    """
    return PredictionPersistenceService.delete_user_prediction(
        db=db,
        prediction_id=prediction_id,
        current_user=current_user
    )
