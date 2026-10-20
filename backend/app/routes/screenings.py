from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.screening import (
    ScreeningCreate,
    ScreeningOut,
    ScreeningComputeRequest,
    ScreeningComputeResponse,
)
from app.services.screening_service import ScreeningService

router = APIRouter()

@router.get("", response_model=List[ScreeningOut])
@router.get("/", response_model=List[ScreeningOut], include_in_schema=False)
def get_screenings(
    child_id: Optional[str] = Query(None, alias="childId"),
    db: Session = Depends(get_db)
):
    """Retrieve all completed screening records."""
    return ScreeningService.get_all(db, child_id)

@router.post("/compute", response_model=ScreeningComputeResponse)
def compute_screening_score(payload: ScreeningComputeRequest):
    """Compute score, risk level, and recommendations for questionnaire answers."""
    return ScreeningService.compute_score(payload)

@router.post("", response_model=ScreeningOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ScreeningOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_screening(payload: ScreeningCreate, db: Session = Depends(get_db)):
    """Save a new screening record."""
    return ScreeningService.create_screening(db, payload)

@router.delete("/{screening_id}", status_code=status.HTTP_200_OK)
def delete_screening(screening_id: str, db: Session = Depends(get_db)):
    """Delete a screening record."""
    success = ScreeningService.delete_screening(db, screening_id)
    if not success:
        raise HTTPException(status_code=404, detail="Screening record not found")
    return {"message": "Screening record deleted successfully", "id": screening_id}
