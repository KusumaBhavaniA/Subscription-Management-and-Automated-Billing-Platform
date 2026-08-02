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

    github_id = Column(
        String,
        unique=True,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
