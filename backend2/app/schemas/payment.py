from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field


PaymentStatus = Literal["pending", "paid", "failed", "refunded"]


class PaymentProcessRequest(BaseModel):
    invoice_id: Optional[int] = None
    subscription_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_email: Optional[str] = None
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    payment_method: Optional[str] = "mock"
    # Useful for deterministic demo/testing; normal behaviour uses PAYMENT_SUCCESS_RATE.
    simulate_failure: bool = False


class PaymentResponse(BaseModel):
    payment_id: str
    invoice_id: Optional[int]
    amount: Decimal
    currency: str
    status: PaymentStatus
    failure_reason: Optional[str] = None
    webhook_sent: bool


class PaymentWebhookRequest(BaseModel):
    event_id: str
    event: Literal["payment_paid", "payment_failed", "payment_refunded"]
    payment_id: str
    invoice_id: Optional[int] = None
    subscription_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_email: Optional[str] = None
    amount: Decimal = Field(gt=0)
    currency: str = "INR"
    failure_reason: Optional[str] = None


class RefundRequest(BaseModel):
    payment_id: str
    invoice_id: Optional[int] = None
    subscription_id: Optional[int] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    reason: str = "Subscription cancellation - unused billing period"
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


class RefundResponse(BaseModel):
    refund_id: str
    payment_id: str
    amount: Decimal
    currency: str
    status: Literal["refunded", "failed"]
    refund_percentage: Optional[float] = None
    webhook_sent: bool
    refund_line_item_created: bool = False
