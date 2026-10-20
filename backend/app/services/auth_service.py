import uuid
from typing import Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    UserOut,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    MessageResponse,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)

class AuthService:
    @staticmethod
    def derive_role_from_email(email: str) -> str:
        lower = email.lower()
        if any(d in lower for d in ["doctor", "doc", "md"]):
            return "doctor"
        if any(c in lower for c in ["caretaker", "nurse", "staff"]):
            return "caretaker"
        if "admin" in lower:
            return "admin"
        return "parent"

    @classmethod
    def user_to_schema(cls, user: User) -> UserOut:
        created_str = user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat()
        name = user.full_name or "User"
        return UserOut(
            id=user.id,
            name=name,
            fullName=name,
            full_name=name,
            email=user.email,
            role=user.role or "parent",
            isActive=user.is_active,
            is_active=user.is_active,
            createdAt=created_str,
            created_at=created_str,
        )

    @classmethod
    def register_user(cls, db: Session, req: RegisterRequest) -> Tuple[UserOut, str]:
        email_clean = str(req.email).strip().lower()

        # Duplicate email check
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with email '{email_clean}' already exists. Please sign in."
            )

        # Validate name
        name = req.full_name
        if not name or not name.strip():
            name = email_clean.split("@")[0].replace(".", " ").replace("-", " ").title()

        role = req.role if req.role else cls.derive_role_from_email(email_clean)
        user_id = f"usr_{uuid.uuid4().hex[:8]}"

        # Hash password with bcrypt (NEVER store plain-text)
        hashed_pwd = get_password_hash(req.password)

        new_user = User(
            id=user_id,
            email=email_clean,
            hashed_password=hashed_pwd,
            full_name=name.strip(),
            role=role,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token({
            "sub": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "name": new_user.full_name
        })

        return cls.user_to_schema(new_user), token

    @classmethod
    def login_user(cls, db: Session, req: LoginRequest) -> Tuple[UserOut, str]:
        email_clean = str(req.email).strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact support."
            )

        # Verify bcrypt hashed password
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token({
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.full_name
        })

        return cls.user_to_schema(user), token

    @classmethod
    def request_password_reset(cls, db: Session, req: ForgotPasswordRequest) -> ForgotPasswordResponse:
        email_clean = str(req.email).strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()

        if not user:
            # We raise 404 or return structured instructions so user knows to register
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered account found with email '{email_clean}'. Please check the email address or register."
            )

        # Generate signed reset token valid for 30 minutes
        reset_token = create_access_token(
            data={"sub": user.id, "email": user.email, "purpose": "password_reset"},
            expires_delta=timedelta(minutes=30)
        )

        return ForgotPasswordResponse(
            message=f"Password reset instructions and verification token generated for {email_clean}.",
            reset_token=reset_token,
            reset_url=f"/reset-password?email={email_clean}&token={reset_token}",
            success=True
        )

    @classmethod
    def reset_password(cls, db: Session, req: ResetPasswordRequest) -> MessageResponse:
        email_clean = str(req.email).strip().lower()

        # 1. Verify user exists in database
        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered account found with email '{email_clean}'. Please verify your email or create an account."
            )

        # 2. Check matching passwords if confirm_password provided
        if req.confirm_password and req.new_password != req.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password and confirmation password do not match."
            )

        # 3. Optional token validation if provided
        if req.token:
            payload = decode_access_token(req.token)
            if not payload or payload.get("purpose") != "password_reset":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The password reset token is invalid, expired, or malformed."
                )
            token_email = payload.get("email")
            if token_email and token_email.lower() != email_clean:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The password reset token does not match the provided email address."
                )

        # 4. Validate new password length
        if len(req.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long."
            )

        # 5. Hash new password securely with bcrypt
        user.hashed_password = get_password_hash(req.new_password)
        db.commit()
        db.refresh(user)

        return MessageResponse(
            message="Your password has been successfully reset. You can now log in with your new password.",
            success=True
        )

