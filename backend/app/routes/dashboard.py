from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardMetricsOut
from app.utils.security import get_optional_current_user

router = APIRouter()

@router.get("/metrics", response_model=DashboardMetricsOut)
@router.get("/stats", response_model=DashboardMetricsOut, include_in_schema=False)
@router.get("/analytics", response_model=DashboardMetricsOut, include_in_schema=False)
@router.get("/summary", response_model=DashboardMetricsOut, include_in_schema=False)
def get_dashboard_metrics(
    role: Optional[str] = Query(None, description="Optional role filter ('parent', 'doctor', 'admin')"),
    user_id: Optional[str] = Query(None, alias="userId", description="Optional user ID scope"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> DashboardMetricsOut:
    """
    Retrieve live aggregated prediction metrics directly calculated from the database:
    - Total predictions count
    - Image prediction count
    - Video prediction count
    - Recent predictions list
    - Most frequently detected emotions with percentages
    - Most frequently detected behaviors with percentages
    - Chronological prediction activity by date
    """
    effective_user_id = (current_user.id if current_user else None) or user_id
    effective_role = role or (current_user.role if current_user else "doctor")

    return DashboardService.calculate_dashboard_metrics(
        db=db,
        user_id=effective_user_id,
        role=effective_role
    )

@router.get("/{role}")
def get_dashboard_by_role(
    role: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieve aggregated dashboard metrics and lists for a specific user role (parent, doctor, caretaker, admin)."""
    user_id = current_user.id if current_user else None
    return DashboardService.get_dashboard_data(db=db, role=role, user_id=user_id)
