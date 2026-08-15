"""
Billing domain models.

Plan               -> a subscription tier with a monthly price (e.g. Starter, Pro)
Subscription       -> a user's active plan and current billing cycle dates
Invoice            -> one billed document for a cycle, with a unique invoice number
InvoiceLineItem    -> individual charges/credits that make up an invoice
                      (plan fee, proration credit/debit, usage, tax, refund)
"""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False, index=True)  # e.g. "starter", "pro"
    name = Column(String, nullable=False)                           # e.g. "Starter", "Pro"
    monthly_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)

    # active, canceled, past_due
    status = Column(String, nullable=False, default="active")

    current_period_start = Column(Date, nullable=False)
    current_period_end = Column(Date, nullable=False)

    cancel_at_period_end = Column(Boolean, nullable=False, default=False)
    canceled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan = relationship("Plan")
    invoices = relationship("Invoice", back_populates="subscription")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_number = Column(String, unique=True, nullable=False, index=True)

    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # draft, open, paid, failed, refunded, void
    status = Column(String, nullable=False, default="open")
    currency = Column(String(3), nullable=False, default="USD")

    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    subtotal_amount = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)

    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    due_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subscription = relationship("Subscription", back_populates="invoices")
    line_items = relationship(
        "InvoiceLineItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceLineItem.id",
    )


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)

    # plan_fee, proration_credit, proration_debit, usage, tax, refund
    item_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    quantity = Column(Numeric(12, 4), nullable=False, default=1)
    unit_amount = Column(Numeric(12, 2), nullable=False)
    # Signed amount: negative = credit/refund, positive = charge.
    amount = Column(Numeric(12, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    invoice = relationship("Invoice", back_populates="line_items")