from pydantic import BaseModel, EmailStr
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    country: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    country: str | None = None


class CustomerRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None
    country: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True