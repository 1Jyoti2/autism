from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.note import NotificationOut
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("", response_model=List[NotificationOut])
@router.get("/", response_model=List[NotificationOut], include_in_schema=False)
def get_notifications(db: Session = Depends(get_db)):
    """Retrieve all user notifications and alerts."""
    return DashboardService.get_notifications(db)
