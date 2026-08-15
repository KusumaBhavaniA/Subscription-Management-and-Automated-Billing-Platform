from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    code: str
    name: str
    monthly_price: Decimal = Field(gt=0)
    currency: str = "USD"


class PlanResponse(BaseModel):
    id: int
    code: str
    name: str
    monthly_price: Decimal
    currency: str
    is_active: bool

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    plan_code: str


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan: PlanResponse
    status: str
    current_period_start: date
    current_period_end: date
    cancel_at_period_end: bool

    class Config:
        from_attributes = True


class UpgradeRequest(BaseModel):
    new_plan_code: str
    change_date: Optional[date] = None  # defaults to today if omitted


class ProrationPreviewResponse(BaseModel):
    old_plan_name: str
    old_plan_price: Decimal
    new_plan_name: str
    new_plan_price: Decimal
    days_in_cycle: int
    days_used: int
    days_remaining: int
    unused_credit: Decimal
    new_plan_charge: Decimal
    net_amount: Decimal


class UsageChargeInput(BaseModel):
    description: str
    amount: Decimal
    quantity: Decimal = Decimal("1")


class GenerateCycleInvoiceRequest(BaseModel):
    usage_charges: List[UsageChargeInput] = Field(default_factory=list)
    tax_rate: Optional[Decimal] = None


class InvoiceLineItemResponse(BaseModel):
    id: int
    item_type: str
    description: str
    quantity: Decimal
    unit_amount: Decimal
    amount: Decimal

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    subscription_id: int
    status: str
    currency: str
    period_start: date
    period_end: date
    subtotal_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    issued_at: datetime
    due_at: Optional[datetime]
    line_items: List[InvoiceLineItemResponse]

    class Config:
        from_attributes = True