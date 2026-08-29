from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    first_name = Column(
        String,
        nullable=False
    )

    last_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    phone_number = Column(
        String,
        unique=True,
        nullable=True
    )

    country = Column(
        String,
        nullable=True
    )

    state = Column(
        String,
        nullable=True
    )

    city = Column(
        String,
        nullable=True
    )

    zip_code = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    hashed_password = Column(
        String,
        nullable=True  # nullable for OAuth-only accounts
    )

    # Role: "Customer" or "Admin"
    role = Column(
        String,
        nullable=False,
        default="Customer"
    )

    # Email verification
    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # OTP fields
    otp_code = Column(
        String(6),
        nullable=True
    )

    otp_expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # Password reset token
    reset_token = Column(
        Text,
        nullable=True
    )

    reset_token_expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # OAuth provider IDs
    google_id = Column(
        String,
        unique=True,
        nullable=True
    )

    microsoft_id = Column(
        String,
        unique=True,
        nullable=True
    )

    apple_id = Column(
        String,
        unique=True,
        nullable=True
    )

    # Account lifecycle & status ("ACTIVE", "SUSPENDED", "DELETED")
    account_status = Column(
        String,
        nullable=False,
        default="ACTIVE"
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    deleted_by = Column(
        String,
        nullable=True
    )

    suspended_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    suspended_by = Column(
        String,
        nullable=True
    )

    suspension_reason = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class RevokedToken(Base):
    """JWT identifiers invalidated before their natural expiry (logout)."""

    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    jti = Column(String(36), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Ticket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    subcategory = Column(String(50), nullable=True)
    subject = Column(String(200), nullable=False)
    status = Column(String(30), nullable=False, default="Open", index=True)
    assigned_agent = Column(String(100), nullable=True)
    dynamic_fields = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TicketMessage(Base):
    __tablename__ = "support_ticket_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(64), nullable=False, index=True)
    sender_role = Column(String(30), nullable=False)  # "Customer", "Support", "Admin"
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

