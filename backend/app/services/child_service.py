import uuid
from typing import List, Optional, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildUpdate, ChildOut, calculate_age_months

DEFAULT_CHILDREN_SEED = [
    {
        "id": "ch_maya",
        "name": "Maya Patel",
        "date_of_birth": "2021-11-02",
        "gender": "female",
        "caregiver_name": "Anita Patel",
        "relationship": "parent",
        "notes": "Enjoys building blocks and story time. Uses short sentences.",
        "avatar_color": "#0d9488",
        "status": "Completed",
        "risk_level": "Low",
        "created_at": datetime(2026, 4, 12, 8, 30),
    },
    {
        "id": "ch_liam",
        "name": "Liam Carter",
        "date_of_birth": "2020-05-19",
        "gender": "male",
        "caregiver_name": "Daniel Carter",
        "relationship": "parent",
        "notes": "Very attentive to detail, lines up toys. Communicates mostly non-verbally.",
        "avatar_color": "#6366f1",
        "status": "Needs Review",
        "risk_level": "High",
        "created_at": datetime(2026, 4, 12, 8, 31),
    },
    {
        "id": "ch_sofia",
        "name": "Sofia Reyes",
        "date_of_birth": "2023-01-27",
        "gender": "female",
        "caregiver_name": "Luis Reyes",
        "relationship": "parent",
        "notes": "Loves music and mirrors. Most comfortable with familiar adults.",
        "avatar_color": "#8b5cf6",
        "status": "Completed",
        "risk_level": "Low",
        "created_at": datetime(2026, 6, 3, 12, 0),
    },
]

class ChildService:
    @staticmethod
    def _to_schema(child: Child) -> ChildOut:
        age_m = calculate_age_months(child.date_of_birth)
        created_str = child.created_at.isoformat() if child.created_at else datetime.utcnow().isoformat()
        return ChildOut(
            id=child.id,
            userId=child.user_id,
            name=child.name,
            dateOfBirth=child.date_of_birth,
            gender=child.gender,
            caregiverName=child.caregiver_name,
            relationship=child.relationship,
            notes=child.notes,
            avatarColor=child.avatar_color,
            status=child.status or "Completed",
            riskLevel=child.risk_level or "Low",
            ageMonths=age_m,
            createdAt=created_str,
        )

    @classmethod
    def seed_initial_if_empty(cls, db: Session):
        pass

    @classmethod
    def get_all_children(cls, db: Session, user: Optional[Any] = None) -> List[ChildOut]:
        query = db.query(Child)
        if user:
            if getattr(user, "role", "parent") not in ["admin", "doctor"]:
                # Standard logged-in parent only sees their own registered children!
                query = query.filter(Child.user_id == user.id)
        records = query.order_by(Child.created_at.desc()).all()
        return [cls._to_schema(c) for c in records]

    @classmethod
    def get_child_by_id(cls, db: Session, child_id: str) -> Optional[ChildOut]:
        child = db.query(Child).filter(Child.id == child_id).first()
        return cls._to_schema(child) if child else None

    @classmethod
    def create_child(cls, db: Session, data: ChildCreate, user_id: Optional[str] = None) -> ChildOut:
        child_id = f"ch_{uuid.uuid4().hex[:8]}"
        dob = data.date_of_birth or "2022-01-01"
        effective_user_id = user_id or data.user_id
        new_child = Child(
            id=child_id,
            user_id=effective_user_id,
            name=data.name,
            date_of_birth=dob,
            gender=data.gender,
            caregiver_name=data.caregiver_name,
            relationship=data.relationship or "parent",
            notes=data.notes,
            avatar_color=data.avatar_color or "#0d9488",
            status=data.status or "Completed",
            risk_level=data.risk_level or "Low",
            created_at=datetime.utcnow(),
        )
        db.add(new_child)
        db.commit()
        db.refresh(new_child)
        return cls._to_schema(new_child)

    @classmethod
    def update_child(cls, db: Session, child_id: str, data: ChildUpdate) -> Optional[ChildOut]:
        child = db.query(Child).filter(Child.id == child_id).first()
        if not child:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        if "date_of_birth" in update_dict and update_dict["date_of_birth"] is not None:
            child.date_of_birth = update_dict["date_of_birth"]
        if "name" in update_dict and update_dict["name"] is not None:
            child.name = update_dict["name"]
        if "gender" in update_dict and update_dict["gender"] is not None:
            child.gender = update_dict["gender"]
        if "caregiver_name" in update_dict and update_dict["caregiver_name"] is not None:
            child.caregiver_name = update_dict["caregiver_name"]
        if "relationship" in update_dict and update_dict["relationship"] is not None:
            child.relationship = update_dict["relationship"]
        if "notes" in update_dict and update_dict["notes"] is not None:
            child.notes = update_dict["notes"]
        if "avatar_color" in update_dict and update_dict["avatar_color"] is not None:
            child.avatar_color = update_dict["avatar_color"]
        if "status" in update_dict and update_dict["status"] is not None:
            child.status = update_dict["status"]
        if "risk_level" in update_dict and update_dict["risk_level"] is not None:
            child.risk_level = update_dict["risk_level"]

        db.commit()
        db.refresh(child)
        return cls._to_schema(child)

    @classmethod
    def delete_child(cls, db: Session, child_id: str) -> bool:
        child = db.query(Child).filter(Child.id == child_id).first()
        if not child:
            return False
        db.delete(child)
        db.commit()
        return True
