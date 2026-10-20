from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.note import NoteCreate, NoteOut
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("", response_model=List[NoteOut])
@router.get("/", response_model=List[NoteOut], include_in_schema=False)
def get_notes(db: Session = Depends(get_db)):
    """Retrieve all clinical observation notes."""
    return DashboardService.get_notes(db)

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=NoteOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    """Create a new clinical observation note."""
    return DashboardService.create_note(db, payload)
