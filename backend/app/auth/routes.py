from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate
from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# Request Models
# -------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# Register
# -------------------------

@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    db_user = User(
        first_name=user.firstName,
        last_name=user.lastName,
        email=user.email,
        phone_number=f"{user.phoneCode or ''}{user.phoneNumber}",
        country=user.country,
        hashed_password=hash_password(user.password),
        is_active=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "success": True,
        "message": "Registration successful.",
        "data": {
            "email": db_user.email
        }
    }


# -------------------------
# Login
# -------------------------

@router.post("/login")
def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    if not verify_password(
        data.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "email": db_user.email
        }
    )

    return {
        "success": True,
        "message": "Login successful.",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(db_user.id),
                "customerId": None,
                "fullName": f"{db_user.first_name} {db_user.last_name}",
                "firstName": db_user.first_name,
                "lastName": db_user.last_name,
                "email": db_user.email,
                "phoneNumber": db_user.phone_number,
                "country": db_user.country,
                "role": "Customer",
                "createdAt": db_user.created_at.isoformat(),
                "status": "Verified",
                "registrationDate": db_user.created_at.strftime("%d/%m/%Y"),
                "currentPlan": "Starter",
                "subscriptionStatus": "Active",
                "themePreference": "light"
            }
        }
    }


# -------------------------
# Current User
# -------------------------

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": str(current_user.id),
        "customerId": None,
        "fullName": f"{current_user.first_name} {current_user.last_name}",
        "firstName": current_user.first_name,
        "lastName": current_user.last_name,
        "email": current_user.email,
        "phoneNumber": current_user.phone_number,
        "country": current_user.country,
        "role": "Customer",
        "createdAt": current_user.created_at.isoformat(),
        "status": "Verified",
        "registrationDate": current_user.created_at.strftime("%d/%m/%Y"),
        "currentPlan": "Starter",
        "subscriptionStatus": "Active",
        "themePreference": "light"
    }