from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "INR"
    interval: str = "monthly"
    trial_days: int = 0
    active: bool = True

class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    interval: Optional[str] = None
    trial_days: Optional[int] = None
    active: Optional[bool] = None


class PlanRead(PlanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True