"""
Invoice generation engine.

For a subscription's billing cycle, builds line items — plan fee,
proration credit/debit (if the plan changed mid-cycle), and usage
charges — applies tax to the subtotal, and persists the Invoice with a
unique invoice number.
"""

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Iterable, List, Optional

from sqlalchemy.orm import Session

from app.billing.models import Invoice, InvoiceLineItem, Subscription
from app.billing.proration import ProrationResult

TWO_PLACES = Decimal("0.01")
DEFAULT_TAX_RATE = Decimal("0.10")  # 10% GST rate for subscription billing
INVOICE_DUE_DAYS = 7


def _round_money(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@dataclass
class UsageCharge:
    """A single usage-based charge to append to an invoice."""

    description: str
    amount: Decimal
    quantity: Decimal = Decimal("1")


def _generate_invoice_number(db: Session) -> str:
    """
    Format: INV-<YYYYMM>-<6 random hex chars>, e.g. INV-202608-8F3A2C.
    Verified unique against the DB; collisions are astronomically
    unlikely but we retry a few times just in case.
    """
    prefix = f"INV-{datetime.utcnow():%Y%m}-"
    for _ in range(5):
        candidate = f"{prefix}{secrets.token_hex(3).upper()}"
        exists = (
            db.query(Invoice)
            .filter(Invoice.invoice_number == candidate)
            .first()
        )
        if not exists:
            return candidate
    raise RuntimeError("Could not generate a unique invoice number after 5 attempts")


def generate_invoice(
    db: Session,
    subscription: Subscription,
    plan_name: str,
    plan_price: Decimal,
    period_start,
    period_end,
    proration: Optional[ProrationResult] = None,
    usage_charges: Optional[Iterable[UsageCharge]] = None,
    tax_rate: Decimal = DEFAULT_TAX_RATE,
    status: str = "open",
) -> Invoice:
    """
    Build and persist one invoice for a billing cycle.

    Always includes the base plan fee. If `proration` is supplied (the
    customer changed plans mid-cycle), the unused-credit and new-plan
    charge lines are layered on top. Any `usage_charges` are appended as
    additional line items. Tax is computed on the subtotal last.
    """
    plan_price = Decimal(str(plan_price))
    tax_rate = Decimal(str(tax_rate))
    line_items: List[InvoiceLineItem] = []

    # 1. Base plan fee for the cycle
    line_items.append(
        InvoiceLineItem(
            item_type="plan_fee",
            description=f"{plan_name} plan ({period_start.isoformat()} to {period_end.isoformat()})",
            quantity=Decimal("1"),
            unit_amount=plan_price,
            amount=plan_price,
        )
    )

    # 2. Proration credit/debit from a mid-cycle plan change
    if proration is not None:
        line_items.append(
            InvoiceLineItem(
                item_type="proration_credit",
                description=(
                    f"Unused credit \u2014 {proration.old_plan_name} "
                    f"({proration.days_remaining} day(s) remaining)"
                ),
                quantity=Decimal("1"),
                unit_amount=-proration.unused_credit,
                amount=-proration.unused_credit,
            )
        )
        line_items.append(
            InvoiceLineItem(
                item_type="proration_debit",
                description=(
                    f"Prorated charge \u2014 {proration.new_plan_name} "
                    f"({proration.days_remaining} day(s) remaining)"
                ),
                quantity=Decimal("1"),
                unit_amount=proration.new_plan_charge,
                amount=proration.new_plan_charge,
            )
        )

    # 3. Usage-based charges
    for usage in usage_charges or []:
        unit_amount = Decimal(str(usage.amount))
        quantity = Decimal(str(usage.quantity))
        amount = _round_money(unit_amount * quantity)
        line_items.append(
            InvoiceLineItem(
                item_type="usage",
                description=usage.description,
                quantity=quantity,
                unit_amount=unit_amount,
                amount=amount,
            )
        )

    subtotal = _round_money(sum((li.amount for li in line_items), Decimal("0")))
    tax_amount = _round_money(subtotal * tax_rate) if subtotal > 0 else Decimal("0.00")
    total = _round_money(subtotal + tax_amount)

    if tax_amount != Decimal("0.00"):
        line_items.append(
            InvoiceLineItem(
                item_type="tax",
                description=f"Tax ({(tax_rate * 100):.0f}%)",
                quantity=Decimal("1"),
                unit_amount=tax_amount,
                amount=tax_amount,
            )
        )

    invoice = Invoice(
        invoice_number=_generate_invoice_number(db),
        subscription_id=subscription.id,
        user_id=subscription.user_id,
        status=status,
        currency="USD",
        period_start=period_start,
        period_end=period_end,
        subtotal_amount=subtotal,
        tax_amount=tax_amount,
        total_amount=total,
        issued_at=datetime.utcnow(),
        due_at=datetime.utcnow() + timedelta(days=INVOICE_DUE_DAYS),
    )
    invoice.line_items = line_items

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice