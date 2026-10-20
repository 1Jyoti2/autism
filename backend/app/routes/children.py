from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.child import ChildCreate, ChildUpdate, ChildOut
from app.services.child_service import ChildService
from app.utils.security import get_optional_current_user

router = APIRouter()

@router.get("", response_model=List[ChildOut])
@router.get("/", response_model=List[ChildOut], include_in_schema=False)
def get_children(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve registered children profiles.
    For logged-in parents, returns only children belonging to their account.
    """
    return ChildService.get_all_children(db, user=current_user)

@router.get("/{child_id}", response_model=ChildOut)
def get_child(child_id: str, db: Session = Depends(get_db)):
    """Retrieve a single child profile by ID."""
    child = ChildService.get_child_by_id(db, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child record not found")
    return child

@router.post("", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ChildOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_child(
    payload: ChildCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new child profile dynamically linked to the authenticated parent user.
    """
    user_id = current_user.id if current_user else payload.user_id
    return ChildService.create_child(db, payload, user_id=user_id)

@router.put("/{child_id}", response_model=ChildOut)
def update_child(child_id: str, payload: ChildUpdate, db: Session = Depends(get_db)):
    """Update an existing child profile."""
    updated = ChildService.update_child(db, child_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Child record not found")
    return updated

@router.delete("/{child_id}", status_code=status.HTTP_200_OK)
def delete_child(child_id: str, db: Session = Depends(get_db)):
    """Delete a child profile."""
    success = ChildService.delete_child(db, child_id)
    if not success:
        raise HTTPException(status_code=404, detail="Child record not found")
    return {"message": "Child record deleted successfully", "id": child_id}
