from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field

def calculate_age_months(dob_str: str) -> int:
    try:
        parts = dob_str.split("-")
        dob = date(int(parts[0]), int(parts[1]), int(parts[2]))
        today = date.today()
        months = (today.year - dob.year) * 12 + (today.month - dob.month)
        return max(1, months)
    except Exception:
        return 24

class ChildBase(BaseModel):
    name: str
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")
    gender: str = "female"
    caregiver_name: Optional[str] = Field(None, alias="caregiverName")
    relationship: Optional[str] = "parent"
    notes: Optional[str] = None
    avatar_color: Optional[str] = Field("#0d9488", alias="avatarColor")
    status: Optional[str] = "Completed"
    risk_level: Optional[str] = Field("Low", alias="riskLevel")
    user_id: Optional[str] = Field(None, alias="userId")

    class Config:
        populate_by_name = True

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")
    gender: Optional[str] = None
    caregiver_name: Optional[str] = Field(None, alias="caregiverName")
    relationship: Optional[str] = None
    notes: Optional[str] = None
    avatar_color: Optional[str] = Field(None, alias="avatarColor")
    status: Optional[str] = None
    risk_level: Optional[str] = Field(None, alias="riskLevel")
    user_id: Optional[str] = Field(None, alias="userId")

    class Config:
        populate_by_name = True

class ChildOut(BaseModel):
    id: str
    user_id: Optional[str] = Field(None, alias="userId")
    name: str
    dateOfBirth: str
    gender: str
    caregiverName: Optional[str] = None
    relationship: Optional[str] = "parent"
    notes: Optional[str] = None
    avatarColor: Optional[str] = "#0d9488"
    status: str = "Completed"
    riskLevel: str = "Low"
    ageMonths: int = 24
    createdAt: str

    class Config:
        from_attributes = True
        populate_by_name = True
