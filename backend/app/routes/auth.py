from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
    MessageResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService
from app.utils.security import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account with secure bcrypt password hashing.
    Rejects duplicate emails and returns an access token with user profile.
    """
    user, token = AuthService.register_user(db, payload)
    return TokenResponse(
        token=token,
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user using email and password.
    Returns signed JWT access token and user profile.
    """
    user, token = AuthService.login_user(db, payload)
    return TokenResponse(
        token=token,
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate password reset verification token and reset URL.
    """
    return AuthService.request_password_reset(db, payload)

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using verification token.
    """
    return AuthService.reset_password(db, payload)

@router.get("/me", response_model=UserOut)
@router.get("/user", response_model=UserOut, include_in_schema=False)
def get_current_authenticated_user(current_user: User = Depends(get_current_user)):
    """
    Retrieve profile details for the currently authenticated user.
    Requires Bearer JWT token in Authorization header.
    """
    return AuthService.user_to_schema(current_user)

@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user session.
    Instructs the client to remove the stored token.
    """
    return MessageResponse(
        message=f"User {current_user.email} successfully logged out.",
        success=True
    )

