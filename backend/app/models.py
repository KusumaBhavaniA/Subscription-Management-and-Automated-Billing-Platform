from sqlalchemy import Column, Integer, String, Boolean, DateTime
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
        nullable=False
    )

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

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )