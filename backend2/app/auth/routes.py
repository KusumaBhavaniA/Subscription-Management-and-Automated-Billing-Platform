import hashlib
import hmac
import secrets
import string
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

from typing import Optional, Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RevokedToken, User
from app.billing.models import Subscription
from app.payment_models import Payment
from app.schemas.user import UserCreate, OTPVerifyRequest, ResetPasswordRequest, ResendOTPRequest
from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.auth.dependencies import get_current_user, oauth2_scheme_optional
from app.auth.email import (
    send_otp_email,
    send_welcome_email,
    send_password_reset_email,
    send_profile_incomplete_email,
    send_suspension_email,
    send_payment_success_email,
    send_cancellation_email,
    send_upgrade_email,
    send_downgrade_email,
)
from app.config import settings
from app.auth.rate_limit import (
    login_limiter,
    otp_limiter,
    password_reset_limiter,
    registration_limiter,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_otp(length: int = 6) -> str:
    """Return a zero-padded numeric OTP string."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def _hash_reset_token(token: str) -> str:
    """Store only a keyed digest, so a database leak cannot expose reset links."""
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _user_response(user: User, db: Session = None) -> dict:
    cust_prefix = "ADM" if getattr(user, "role", "").lower() == "admin" else "CUS"
    customer_id = f"{cust_prefix}-{user.id:06d}"
    created_iso = user.created_at.isoformat() if user.created_at else datetime.now(timezone.utc).isoformat()
    created_fmt = user.created_at.strftime("%d/%m/%Y") if user.created_at else datetime.now(timezone.utc).strftime("%d/%m/%Y")

    acc_status = getattr(user, "account_status", None) or "ACTIVE"

    plan_name = "No active plan"
    sub_status = "Inactive"
    mrr_amount = 0.0
    total_spent = 0.0

    if db is not None:
        active_sub = (
            db.query(Subscription)
            .filter(Subscription.user_id == user.id, Subscription.status == "active")
            .order_by(Subscription.id.desc())
            .first()
        )
        if active_sub and active_sub.plan:
            plan_name = active_sub.plan.name
            sub_status = "Active"
            mrr_amount = float(active_sub.price) if active_sub.price is not None and active_sub.price > 0 else (float(active_sub.plan.monthly_price) if active_sub.plan else 0.0)

        user_payments = db.query(Payment).filter(
            (Payment.customer_id == user.id) | (Payment.customer_email.ilike(user.email))
        ).all()
        total_spent = sum(float(p.amount) for p in user_payments if p.status in ["paid", "PAID", "success", "SUCCESS"])

    return {
        "id": str(user.id),
        "customerId": customer_id,
        "fullName": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email.split("@")[0],
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phoneNumber": user.phone_number,
        "phone": user.phone_number,
        "country": user.country or "India",
        "state": getattr(user, "state", None) or "Maharashtra",
        "city": getattr(user, "city", None) or "Mumbai",
        "zipCode": getattr(user, "zip_code", None) or "400001",
        "address": getattr(user, "address", None) or "",
        "role": user.role,
        "createdAt": created_iso,
        "isVerified": user.is_verified,
        "status": "Suspended" if acc_status == "SUSPENDED" else ("Verified" if user.is_verified else "Pending"),
        "accountStatus": acc_status,
        "registrationDate": created_fmt,
        "joinedDate": user.created_at.strftime("%Y-%m-%d") if user.created_at else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "currentPlan": plan_name,
        "subscriptionPlan": plan_name,
        "subscriptionStatus": sub_status,
        "mrr": mrr_amount,
        "totalSpent": total_spent,
        "themePreference": "light",
        "deletedAt": user.deleted_at.isoformat() if getattr(user, "deleted_at", None) else None,
        "deletedBy": getattr(user, "deleted_by", None),
        "suspendedAt": user.suspended_at.isoformat() if getattr(user, "suspended_at", None) else None,
        "suspendedBy": getattr(user, "suspended_by", None),
        "suspensionReason": getattr(user, "suspension_reason", None),
    }


# ---------------------------------------------------------------------------
# Request models (endpoint-specific, not worth putting in schemas file)
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    email: EmailStr
    fullName: str | None = None
    provider: str | None = "Google"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@router.post("/register")
def register_user(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    _: None = Depends(registration_limiter),
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
    _: None = Depends(otp_limiter),
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

@router.post("/resend-otp")
def resend_otp(
    payload: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    _: None = Depends(otp_limiter),
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
def login_user(
    data: LoginRequest,
    _: None = Depends(login_limiter),
    db: Session = Depends(get_db),
):
    db_user = db.query(User).filter(User.email == data.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not db_user.hashed_password or not verify_password(
        data.password, db_user.hashed_password
    ):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if getattr(db_user, "account_status", "ACTIVE") == "DELETED" or getattr(db_user, "deleted_at", None) is not None:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deleted. Please contact Support if you believe this was an error.",
        )

    if getattr(db_user, "account_status", "ACTIVE") == "SUSPENDED":
        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_SUSPENDED: Your NexFlow account has been temporarily suspended by an administrator. Please contact Support to request account restoration.",
        )

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


@router.post("/social-login")
def social_login(payload: SocialLoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        name_parts = (payload.fullName or clean_email.split('@')[0]).strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User(
            first_name=first_name,
            last_name=last_name,
            email=clean_email,
            hashed_password=None,
            role="Customer",
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if getattr(user, "account_status", "ACTIVE") == "SUSPENDED":
        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_SUSPENDED: Your NexFlow account has been temporarily suspended by an administrator."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    return {
        "success": True,
        "message": f"Authenticated with {payload.provider or 'OAuth'} successfully.",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_response(user),
        },
    }


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": "User fetched successfully.",
        "data": _user_response(current_user),
    }


# ---------------------------------------------------------------------------
# POST /auth/forgot-password
# ---------------------------------------------------------------------------

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    _: None = Depends(password_reset_limiter),
    db: Session = Depends(get_db),
):
    logger.info("=== FORGOT PASSWORD REQUEST RECEIVED for email: %s ===", payload.email)
    user = db.query(User).filter(User.email == payload.email).first()

    # Always return success message for non-existent or unverified users to avoid email enumeration
    if not user or not user.is_verified:
        logger.warning("Forgot password requested for unknown or unverified email: %s", payload.email)
        return {
            "success": True,
            "message": "If that email is registered, you will receive a reset link shortly.",
            "data": {"emailSent": True},
        }

    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
    )

    user.reset_token = _hash_reset_token(reset_token)
    user.reset_token_expires_at = reset_expires
    db.commit()

    try:
        logger.info("Executing send_password_reset_email for: %s", user.email)
        send_password_reset_email(user.email, user.first_name, reset_token)
        logger.info("Password reset email successfully delivered for: %s", user.email)
    except Exception as exc:
        logger.error("Failed to send password reset email to %s: %s", user.email, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deliver password reset email: {str(exc)}",
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
    user = db.query(User).filter(
        User.reset_token == _hash_reset_token(payload.token)
    ).first()

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
def logout(
    token: str = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """Invalidate the current JWT until its expiry time if present."""
    if token:
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                options={"verify_aud": False, "verify_iss": False},
            )
            token_id = payload.get("jti")
            exp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc)

            if token_id and not db.query(RevokedToken).filter(RevokedToken.jti == token_id).first():
                db.add(RevokedToken(jti=token_id, expires_at=expires_at))
                db.commit()
        except Exception as exc:
            logger.warning("Logout token decode notice: %s", exc)

    return {
        "success": True,
        "message": "Logged out successfully.",
        "data": {"loggedOut": True},
    }



# ---------------------------------------------------------------------------
# Request schemas for Provider Unlinking & Profile Notifications
# ---------------------------------------------------------------------------

class UnlinkProviderRequest(BaseModel):
    email: EmailStr
    provider: str


class NotifyProfileIncompleteRequest(BaseModel):
    email: EmailStr
    fullName: str
    missingFields: list[str] = []


# ---------------------------------------------------------------------------
# POST /auth/unlink-provider
# ---------------------------------------------------------------------------

@router.post("/unlink-provider")
def unlink_provider(payload: UnlinkProviderRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    provider_lower = payload.provider.lower()
    if provider_lower == "google":
        user.google_id = None
    elif provider_lower == "microsoft":
        user.microsoft_id = None
    elif provider_lower == "apple":
        user.apple_id = None

    db.commit()
    return {
        "success": True,
        "message": f"{payload.provider} disconnected successfully.",
        "data": {"unlinked": True},
    }


# ---------------------------------------------------------------------------
# POST /auth/notify-profile-incomplete
# ---------------------------------------------------------------------------

@router.post("/notify-profile-incomplete")
def notify_profile_incomplete(
    payload: NotifyProfileIncompleteRequest,
    background_tasks: BackgroundTasks,
):
    background_tasks.add_task(
        send_profile_incomplete_email,
        payload.email,
        payload.fullName,
        payload.missingFields,
    )
    return {
        "success": True,
        "message": "Profile incomplete email notification queued successfully.",
        "data": {"emailSent": True},
    }


class TestEmailRequest(BaseModel):
    to_email: EmailStr


# ---------------------------------------------------------------------------
# POST /auth/test-email (Development-Only Email Delivery Diagnostics)
# ---------------------------------------------------------------------------

@router.post("/test-email")
def test_email_endpoint(payload: TestEmailRequest):
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=403, detail="Test email endpoint is disabled in production environment.")

    logger.info("=== [TEST EMAIL DIAGNOSTICS INITIATED] Target: %s ===", payload.to_email)

    from app.auth.email import validate_smtp_connection, send_test_email

    logger.info("Step 1: Testing SMTP Host & Port Connection...")
    conn_ok = validate_smtp_connection()
    if not conn_ok:
        logger.error("Step 1 Failed: Unable to establish SMTP connection or authenticate credentials.")
        raise HTTPException(
            status_code=500,
            detail="SMTP Connection & Authentication check failed. Check backend logs for details."
        )

    logger.info("Step 2: Sending Plain Text Test Email...")
    try:
        send_test_email(payload.to_email)
        logger.info("Step 3: Test email accepted by SMTP server for recipient: %s", payload.to_email)
        return {
            "success": True,
            "message": f"Test email accepted by SMTP server for recipient: {payload.to_email}",
            "data": {
                "smtp_connection": "successful",
                "smtp_auth": "successful",
                "recipient_status": "accepted_by_smtp_relay",
                "target_email": payload.to_email,
            },
        }
    except Exception as exc:
        logger.error("Step 3 Failed: Error while sending email to %s: %s", payload.to_email, exc)
        raise HTTPException(
            status_code=500,
            detail=f"SMTP Email Send Failed for recipient '{payload.to_email}': {str(exc)}"
        )


# ---------------------------------------------------------------------------
# ADMIN CUSTOMER MANAGEMENT ENDPOINTS
# ---------------------------------------------------------------------------

class SuspendCustomerRequest(BaseModel):
    reason: str = ""


@router.get("/admin/customers")
def admin_get_customers(
    status_filter: str = "active",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    query = db.query(User).filter(User.role == "Customer")

    if status_filter == "active":
        query = query.filter(
            User.is_verified == True,
            User.account_status == "ACTIVE",
            User.deleted_at == None,
        )
    elif status_filter == "suspended":
        query = query.filter(
            User.account_status == "SUSPENDED",
            User.deleted_at == None,
        )
    elif status_filter == "deleted":
        query = query.filter(
            (User.account_status == "DELETED") | (User.deleted_at != None)
        )
    elif status_filter == "unverified":
        query = query.filter(
            User.is_verified == False,
            User.deleted_at == None,
        )
    else:
        query = query.filter(User.deleted_at == None)

    customers = query.order_by(User.id.desc()).all()
    return {
        "success": True,
        "data": [_user_response(c, db=db) for c in customers],
    }


@router.post("/admin/customers/{user_id}/suspend")
def admin_suspend_customer(
    user_id: str,
    payload: SuspendCustomerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    try:
        numeric_id = int(user_id.replace("CUS-2026-", "").replace("cust-", ""))
        customer = db.query(User).filter(User.id == numeric_id, User.role == "Customer").first()
    except ValueError:
        customer = db.query(User).filter(User.email == user_id, User.role == "Customer").first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer account not found")

    customer.account_status = "SUSPENDED"
    customer.suspended_at = datetime.now(timezone.utc)
    customer.suspended_by = current_user.email
    customer.suspension_reason = payload.reason
    db.commit()
    db.refresh(customer)

    customer_name = f"{customer.first_name} {customer.last_name}".strip() if customer.last_name else customer.first_name
    try:
        background_tasks.add_task(
            send_suspension_email,
            customer.email,
            customer_name,
            payload.reason or "",
        )
    except Exception as exc:
        logger.error("Failed to schedule suspension email for %s: %s", customer.email, exc)

    return {
        "success": True,
        "message": f"Customer {customer.first_name} {customer.last_name} has been suspended.",
        "data": _user_response(customer),
    }


@router.post("/admin/customers/{user_id}/restore")
def admin_restore_customer(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    try:
        numeric_id = int(user_id.replace("CUS-2026-", "").replace("cust-", ""))
        customer = db.query(User).filter(User.id == numeric_id, User.role == "Customer").first()
    except ValueError:
        customer = db.query(User).filter(User.email == user_id, User.role == "Customer").first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer account not found")

    customer.account_status = "ACTIVE"
    customer.deleted_at = None
    customer.deleted_by = None
    customer.suspended_at = None
    customer.suspended_by = None
    customer.suspension_reason = None
    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "message": f"Customer account {customer.first_name} {customer.last_name} restored successfully.",
        "data": _user_response(customer),
    }


@router.post("/admin/customers/{user_id}/soft-delete")
def admin_soft_delete_customer(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    try:
        numeric_id = int(user_id.replace("CUS-2026-", "").replace("cust-", ""))
        customer = db.query(User).filter(User.id == numeric_id, User.role == "Customer").first()
    except ValueError:
        customer = db.query(User).filter(User.email == user_id, User.role == "Customer").first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer account not found")

    customer.account_status = "DELETED"
    customer.deleted_at = datetime.now(timezone.utc)
    customer.deleted_by = current_user.email
    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "message": f"Customer {customer.first_name} {customer.last_name} soft-deleted. Account moved to Recycle Bin.",
        "data": _user_response(customer),
    }


# ---------------------------------------------------------------------------
# TRANSACTIONAL EMAIL ENDPOINTS & ADDRESS UPDATE
# ---------------------------------------------------------------------------

class PaymentSuccessEmailRequest(BaseModel):
    to_email: EmailStr
    customer_name: str
    plan_name: str
    amount_paid: float
    payment_date: str
    payment_method: str
    transaction_id: str
    invoice_id: str


@router.post("/email/payment-success")
def trigger_payment_success_email(payload: PaymentSuccessEmailRequest, background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(
            send_payment_success_email,
            payload.to_email,
            payload.customer_name,
            payload.plan_name,
            payload.amount_paid,
            payload.payment_date,
            payload.payment_method,
            payload.transaction_id,
            payload.invoice_id,
        )
        return {"success": True, "message": f"Payment success email queued for {payload.to_email}"}
    except Exception as exc:
        logger.error("Error queuing payment success email: %s", exc)
        return {"success": False, "message": str(exc)}


class CancellationEmailRequest(BaseModel):
    to_email: EmailStr
    customer_name: str
    plan_name: str
    cancellation_date: str
    expiry_date: str
    amount_paid: float
    refund_amount: float
    refund_status: str
    subscription_id: str


@router.post("/email/cancellation")
def trigger_cancellation_email(payload: CancellationEmailRequest, background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(
            send_cancellation_email,
            payload.to_email,
            payload.customer_name,
            payload.plan_name,
            payload.cancellation_date,
            payload.expiry_date,
            payload.amount_paid,
            payload.refund_amount,
            payload.refund_status,
            payload.subscription_id,
        )
        return {"success": True, "message": f"Cancellation email queued for {payload.to_email}"}
    except Exception as exc:
        logger.error("Error queuing cancellation email: %s", exc)
        return {"success": False, "message": str(exc)}


class UpgradeEmailRequest(BaseModel):
    to_email: EmailStr
    customer_name: str
    previous_plan: str
    new_plan: str
    previous_price: float
    new_price: float
    prorated_credit: float
    amount_charged: float
    next_renewal_amount: float
    effective_date: str
    invoice_id: str
    payment_id: str


@router.post("/email/upgrade")
def trigger_upgrade_email(payload: UpgradeEmailRequest, background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(
            send_upgrade_email,
            payload.to_email,
            payload.customer_name,
            payload.previous_plan,
            payload.new_plan,
            payload.previous_price,
            payload.new_price,
            payload.prorated_credit,
            payload.amount_charged,
            payload.next_renewal_amount,
            payload.effective_date,
            payload.invoice_id,
            payload.payment_id,
        )
        return {"success": True, "message": f"Upgrade email queued for {payload.to_email}"}
    except Exception as exc:
        logger.error("Error queuing upgrade email: %s", exc)
        return {"success": False, "message": str(exc)}


class DowngradeEmailRequest(BaseModel):
    to_email: EmailStr
    customer_name: str
    previous_plan: str
    new_plan: str
    previous_price: float
    new_price: float
    effective_date: str
    next_billing_date: str
    subscription_id: str


@router.post("/email/downgrade")
def trigger_downgrade_email(payload: DowngradeEmailRequest, background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(
            send_downgrade_email,
            payload.to_email,
            payload.customer_name,
            payload.previous_plan,
            payload.new_plan,
            payload.previous_price,
            payload.new_price,
            payload.effective_date,
            payload.next_billing_date,
            payload.subscription_id,
        )
        return {"success": True, "message": f"Downgrade email queued for {payload.to_email}"}
    except Exception as exc:
        logger.error("Error queuing downgrade email: %s", exc)
        return {"success": False, "message": str(exc)}


class UpdateProfileRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    phone_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    themePreference: Optional[str] = None


@router.put("/profile")
@router.put("/auth/profile")
@router.patch("/profile")
@router.patch("/auth/profile")
def update_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    first_name = payload.firstName or payload.first_name
    last_name = payload.lastName or payload.last_name
    if not first_name and payload.fullName:
        parts = payload.fullName.strip().split(" ", 1)
        first_name = parts[0]
        if len(parts) > 1 and not last_name:
            last_name = parts[1]

    if first_name is not None:
        current_user.first_name = first_name.strip()
    if last_name is not None:
        current_user.last_name = last_name.strip()

    phone = payload.phoneNumber or payload.phone_number or payload.phone
    if phone is not None:
        current_user.phone_number = phone.strip()

    if payload.address is not None:
        current_user.address = payload.address.strip()
    if payload.city is not None:
        current_user.city = payload.city.strip()
    if payload.state is not None:
        current_user.state = payload.state.strip()

    zip_val = payload.zipCode or payload.zip_code
    if zip_val is not None:
        current_user.zip_code = zip_val.strip()

    if payload.country is not None:
        current_user.country = payload.country.strip()

    db.commit()
    db.refresh(current_user)

    user_data = _user_response(current_user, db=db)
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": user_data,
        "data": user_data,
    }


class AddressUpdateRequest(BaseModel):
    country: str = "India"
    state: str = ""
    city: str = ""
    zip_code: str = ""
    address: str = ""


@router.put("/profile/address")
def update_profile_address(
    payload: AddressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.country = payload.country
    current_user.state = payload.state
    current_user.city = payload.city
    current_user.zip_code = payload.zip_code
    current_user.address = payload.address
    db.commit()
    db.refresh(current_user)
    return {
        "success": True,
        "message": "Profile address updated successfully.",
        "data": _user_response(current_user, db=db),
    }