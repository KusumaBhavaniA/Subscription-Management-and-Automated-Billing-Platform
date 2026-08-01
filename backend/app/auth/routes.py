import random
import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, OTPVerifyRequest, ResetPasswordRequest
from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.auth.dependencies import get_current_user
from app.auth.email import send_otp_email, send_welcome_email, send_password_reset_email
from app.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_otp(length: int = 6) -> str:
    """Return a zero-padded numeric OTP string."""
    return "".join(random.choices(string.digits, k=length))


def _user_response(user: User) -> dict:
    """Serialise a User ORM object into the shape the frontend expects."""
    return {
        "id": str(user.id),
        "customerId": None,
        "fullName": f"{user.first_name} {user.last_name}",
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phoneNumber": user.phone_number,
        "country": user.country,
        "role": user.role,
        "createdAt": user.created_at.isoformat(),
        "status": "Verified" if user.is_verified else "Pending",
        "registrationDate": user.created_at.strftime("%d/%m/%Y"),
        "currentPlan": "Starter",
        "subscriptionStatus": "Active",
        "themePreference": "light",
    }


# ---------------------------------------------------------------------------
# Request models (endpoint-specific, not worth putting in schemas file)
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@router.post("/register")
def register_user(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    otp = _generate_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )

    db_user = User(
        first_name=user.firstName,
        last_name=user.lastName,
        email=user.email,
        phone_number=f"{user.phoneCode or ''}{user.phoneNumber}",
        country=user.country,
        hashed_password=hash_password(user.password),
        role="Customer",
        is_verified=False,
        is_active=True,
        otp_code=otp,
        otp_expires_at=otp_expires,
    )

    db.add(db_user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="An account with this phone number already exists.",
        )
    db.refresh(db_user)

    # Send OTP email in the background so the HTTP response is not delayed
    background_tasks.add_task(
        send_otp_email, db_user.email, db_user.first_name, otp
    )

    return {
        "success": True,
        "message": "Registration successful. Please check your email for the verification code.",
        "data": {"email": db_user.email},
    }


# ---------------------------------------------------------------------------
# POST /auth/verify-otp
# ---------------------------------------------------------------------------

@router.post("/verify-otp")
def verify_otp(
    payload: OTPVerifyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {
            "success": True,
            "message": "Email is already verified.",
            "data": {"verified": True},
        }

    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail="No OTP found. Please request a new one.",
        )

    # Compare expiry in a timezone-aware way
    now = datetime.now(timezone.utc)
    otp_expiry = user.otp_expires_at
    if otp_expiry.tzinfo is None:
        otp_expiry = otp_expiry.replace(tzinfo=timezone.utc)

    if now > otp_expiry:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new one.",
        )

    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Mark verified and clear OTP fields
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    background_tasks.add_task(send_welcome_email, user.email, user.first_name)

    return {
        "success": True,
        "message": "Email verified successfully. Welcome!",
        "data": {"verified": True},
    }


# ---------------------------------------------------------------------------
# POST /auth/resend-otp
# ---------------------------------------------------------------------------

class ResendOTPRequest(BaseModel):
    email: EmailStr


@router.post("/resend-otp")
def resend_otp(
    payload: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {
            "success": True,
            "message": "Email is already verified.",
            "data": {"otpSent": False},
        }

    otp = _generate_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )

    user.otp_code = otp
    user.otp_expires_at = otp_expires
    db.commit()

    background_tasks.add_task(send_otp_email, user.email, user.first_name, otp)

    return {
        "success": True,
        "message": "A new verification code has been sent to your email.",
        "data": {"otpSent": True},
    }


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post("/login")
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == data.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not db_user.hashed_password or not verify_password(
        data.password, db_user.hashed_password
    ):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated.")

    if not db_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in.",
        )

    access_token = create_access_token(
        data={"sub": str(db_user.id), "email": db_user.email}
    )

    return {
        "success": True,
        "message": "Login successful.",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_response(db_user),
        },
    }


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)


# ---------------------------------------------------------------------------
# POST /auth/forgot-password
# ---------------------------------------------------------------------------

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    # Always return success to avoid email enumeration attacks
    if not user or not user.is_verified:
        return {
            "success": True,
            "message": "If that email is registered, you will receive a reset link shortly.",
            "data": {"emailSent": True},
        }

    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
    )

    user.reset_token = reset_token
    user.reset_token_expires_at = reset_expires
    db.commit()

    background_tasks.add_task(
        send_password_reset_email, user.email, user.first_name, reset_token
    )

    return {
        "success": True,
        "message": "If that email is registered, you will receive a reset link shortly.",
        "data": {"emailSent": True},
    }


# ---------------------------------------------------------------------------
# POST /auth/reset-password
# ---------------------------------------------------------------------------

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == payload.token).first()

    if not user or not user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    now = datetime.now(timezone.utc)
    token_expiry = user.reset_token_expires_at
    if token_expiry.tzinfo is None:
        token_expiry = token_expiry.replace(tzinfo=timezone.utc)

    if now > token_expiry:
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    user.hashed_password = hash_password(payload.newPassword)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return {
        "success": True,
        "message": "Password has been reset successfully. You can now log in.",
        "data": {"reset": True},
    }


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------

@router.post("/logout")
def logout():
    """
    JWT is stateless so invalidation is handled client-side.
    This endpoint exists so the frontend can call it for consistency
    (e.g. server-side session clearing can be added later).
    """
    return {
        "success": True,
        "message": "Logged out successfully.",
        "data": {"loggedOut": True},
    }
