from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., alias="fullName")
    role: str = "parent"

    class Config:
        populate_by_name = True

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    full_name: Optional[str] = Field(None, alias="fullName")
    role: Optional[str] = "parent"

    @field_validator("role")
    def validate_role(cls, v):
        if v:
            normalized = v.lower().strip()
            if normalized not in ["parent", "doctor", "caretaker", "admin"]:
                raise ValueError("Role must be one of: parent, doctor, caretaker, admin")
            return normalized
        return "parent"

    @field_validator("full_name", mode="before")
    def fallback_name(cls, v, values):
        if v and str(v).strip():
            return str(v).strip()
        return "User"

    class Config:
        populate_by_name = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, description="Password is required")

class UserOut(BaseModel):
    id: str
    name: str
    fullName: str
    full_name: Optional[str] = None
    email: str
    role: str
    isActive: bool = True
    is_active: Optional[bool] = True
    createdAt: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class TokenResponse(BaseModel):
    token: str
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None
    reset_url: Optional[str] = None
    success: bool = True

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=8, alias="newPassword", description="New password must be at least 8 characters")
    confirm_password: Optional[str] = Field(None, alias="confirmPassword")
    token: Optional[str] = Field(None, description="Optional verification token")

    class Config:
        populate_by_name = True

