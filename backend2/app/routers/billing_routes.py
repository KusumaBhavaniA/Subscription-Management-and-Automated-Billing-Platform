"""
Database-driven Billing, Subscription, Payment, Invoice, Support Tickets, and Admin FastAPI Router.
Authoritative single source of truth backed strictly by SQLite / SQLAlchemy models.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, RevokedToken, Ticket, TicketMessage
from app.auth.dependencies import get_current_user, get_current_admin
from app.auth.email import (
    send_payment_success_email,
    send_cancellation_email,
    send_upgrade_email,
    send_downgrade_email,
    _send,
)
from app.billing.models import Plan, Subscription, Invoice, InvoiceLineItem
from app.payment_models import Payment, Refund, Notification
from app.services.payment_gateway import generate_payment_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Billing & Subscriptions"])

# ---------------------------------------------------------------------------
# Central GST Configuration (10% GST as configured)
# ---------------------------------------------------------------------------
GST_RATE = Decimal("0.10")

DEFAULT_PLANS_SEED = [
    {
        "code": "starter_tier",
        "name": "Starter Tier",
        "description": "Perfect for small startups and solo founders building initial MRR.",
        "monthly_price": Decimal("1999.00"),
        "quarterly_price": Decimal("5399.00"),
        "yearly_price": Decimal("19990.00"),
        "features": json.dumps(["Automated Invoicing & Tax", "Standard Revenue Dashboards", "Standard Webhook Triggers"]),
        "is_popular": False,
    },
    {
        "code": "pro_business",
        "name": "Pro Business",
        "description": "For growing businesses requiring multi-currency and churn protection.",
        "monthly_price": Decimal("4999.00"),
        "quarterly_price": Decimal("13499.00"),
        "yearly_price": Decimal("49990.00"),
        "features": json.dumps(["Advanced Revenue Analytics", "Custom Payment Gateways", "Webhook Integrations", "Multi-currency Conversion"]),
        "is_popular": True,
    },
    {
        "code": "enterprise_scale",
        "name": "Enterprise Scale",
        "description": "Unlimited capacity with dedicated SLA, custom contracts, and audit logs.",
        "monthly_price": Decimal("14999.00"),
        "quarterly_price": Decimal("40499.00"),
        "yearly_price": Decimal("149990.00"),
        "features": json.dumps(["Dedicated Account Manager", "Custom Database SLA (99.99%)", "Custom SAML & SSO", "Custom Security Compliance"]),
        "is_popular": False,
    },
]


def _seed_default_plans(db: Session):
    canonical_codes = [item["code"] for item in DEFAULT_PLANS_SEED]
    # Remove or deactivate legacy obsolete plans
    db.query(Plan).filter(~Plan.code.in_(canonical_codes)).delete(synchronize_session=False)
    db.commit()

    for item in DEFAULT_PLANS_SEED:
        p = db.query(Plan).filter(Plan.code == item["code"]).first()
        if not p:
            new_plan = Plan(
                code=item["code"],
                name=item["name"],
                description=item["description"],
                monthly_price=item["monthly_price"],
                quarterly_price=item["quarterly_price"],
                yearly_price=item["yearly_price"],
                features=item["features"],
                currency="INR",
                is_active=True,
                is_popular=item["is_popular"],
            )
            db.add(new_plan)
            db.commit()
        else:
            p.name = item["name"]
            p.monthly_price = item["monthly_price"]
            p.quarterly_price = item["quarterly_price"]
            p.yearly_price = item["yearly_price"]
            p.description = item["description"]
            p.features = item["features"]
            p.is_active = True
            p.is_popular = item["is_popular"]
            db.commit()



def _lookup_plan(db: Session, plan_id_or_name: Any) -> Plan:
    _seed_default_plans(db)
    if not plan_id_or_name:
        plan = db.query(Plan).filter(Plan.is_active == True).first()
        return plan

    # Check if integer ID
    if isinstance(plan_id_or_name, int) or (isinstance(plan_id_or_name, str) and str(plan_id_or_name).isdigit()):
        p = db.query(Plan).filter(Plan.id == int(plan_id_or_name)).first()
        if p:
            return p

    str_val = str(plan_id_or_name).strip()
    clean_code = str_val.lower().replace(" ", "_").replace("-", "_")

    # Match by exact name or code
    p = db.query(Plan).filter(
        (Plan.name.ilike(str_val))
        | (Plan.code == clean_code)
        | (Plan.code == str_val.lower())
    ).first()
    if p:
        return p

    # Partial / alias match
    if "starter" in str_val.lower():
        p = db.query(Plan).filter(Plan.code == "starter_tier").first()
    elif "enterprise" in str_val.lower():
        p = db.query(Plan).filter(Plan.code == "enterprise_scale").first()
    elif "pro" in str_val.lower():
        p = db.query(Plan).filter(Plan.code == "pro_business").first()

    if p:
        return p

    # Fallback create
    p = Plan(code=clean_code, name=str_val, monthly_price=Decimal("1999.00"), currency="INR", is_active=True)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _calculate_plan_cycle_price(plan: Plan, cycle: str) -> Decimal:
    c = cycle.strip().lower()
    if c == "quarterly":
        if plan.quarterly_price and plan.quarterly_price > 0:
            return Decimal(str(plan.quarterly_price))
        return (Decimal(str(plan.monthly_price)) * Decimal("3") * Decimal("0.90")).quantize(Decimal("1.00"), rounding=ROUND_HALF_UP)
    elif c == "yearly":
        if plan.yearly_price and plan.yearly_price > 0:
            return Decimal(str(plan.yearly_price))
        return (Decimal(str(plan.monthly_price)) * Decimal("10")).quantize(Decimal("1.00"), rounding=ROUND_HALF_UP)
    else:
        return Decimal(str(plan.monthly_price))


def _get_customer_display_name(user: User) -> str:
    if not user:
        return "Valued Customer"
    name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    if not name or name.lower() in ["system administrator", "admin"] or "@" in name:
        return user.email.split("@")[0].replace(".", " ").title() if user.email else "Valued Customer"
    return name


# ---------------------------------------------------------------------------
# Request/Response Schemas
# ---------------------------------------------------------------------------

class PlanCreateUpdatePayload(BaseModel):
    name: str
    description: Optional[str] = ""
    priceMonthly: float
    priceQuarterly: Optional[float] = None
    priceYearly: Optional[float] = None
    features: Optional[List[str]] = []
    isEnabled: Optional[bool] = True
    isPopular: Optional[bool] = False


class BillingCalculatePayload(BaseModel):
    plan_id: Optional[Any] = None
    target_plan_name: Optional[str] = None
    plan_name: Optional[str] = None
    billing_cycle: str = "Monthly"
    target_plan_price: Optional[float] = None


class ProcessPaymentPayload(BaseModel):
    plan_id: Optional[Any] = None
    plan_name: Optional[str] = None
    billing_cycle: str = "Monthly"
    amount: Optional[float] = None
    payment_method: str = "demo"
    simulate_failure: bool = False
    simulate_cancel: bool = False
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None


class UpgradePayload(BaseModel):
    target_plan_name: str
    billing_cycle: str = "Monthly"
    simulate_failure: bool = False


class DowngradePayload(BaseModel):
    target_plan_name: str
    billing_cycle: str = "Monthly"


class CancelSubscriptionPayload(BaseModel):
    reason: Optional[str] = "Too Expensive"
    details: Optional[str] = None


class CreateTicketPayload(BaseModel):
    category: str
    subcategory: Optional[str] = None
    subject: str
    initialMessage: str
    dynamicFields: Optional[Dict[str, Any]] = None


class TicketMessagePayload(BaseModel):
    message: str


class UpdateTicketStatusPayload(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# Plan Catalog Endpoints (Database-Driven)
# ---------------------------------------------------------------------------

@router.get("/plans")
def get_public_plans(db: Session = Depends(get_db)):
    """
    Returns active plans catalog from database.
    """
    _seed_default_plans(db)
    plans = db.query(Plan).filter(Plan.is_active == True).order_by(Plan.id.asc()).all()
    result = []
    for p in plans:
        features_list = []
        if p.features:
            try:
                features_list = json.loads(p.features) if p.features.startswith("[") else [f.strip() for f in p.features.split(",")]
            except Exception:
                features_list = [p.features]

        # Calculate subscriber count
        active_sub_count = db.query(Subscription).filter(Subscription.plan_id == p.id, Subscription.status == "active").count()

        result.append({
            "id": f"plan-{p.id}",
            "dbId": p.id,
            "name": p.name,
            "description": p.description or "",
            "priceMonthly": float(p.monthly_price),
            "priceQuarterly": float(p.quarterly_price) if p.quarterly_price else round(float(p.monthly_price) * 3 * 0.9),
            "priceYearly": float(p.yearly_price) if p.yearly_price else round(float(p.monthly_price) * 10),
            "features": features_list,
            "activeSubscribers": active_sub_count,
            "maxCustomers": "Unlimited" if "enterprise" in p.code else ("5,000" if "pro" in p.code else "500"),
            "storage": "1 TB" if "enterprise" in p.code else ("100 GB" if "pro" in p.code else "10 GB"),
            "apiAccess": "Full REST API + Webhooks" if "pro" in p.code or "enterprise" in p.code else "Standard REST API",
            "supportLevel": "24/7 SLA Support" if "enterprise" in p.code else ("Priority 2h SLA" if "pro" in p.code else "Email Support (24h)"),
            "isEnabled": p.is_active,
            "isPopular": p.is_popular or False,
        })
    return {"success": True, "plans": result}


@router.get("/admin/plans")
def get_admin_plans(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Admin plan management endpoint.
    """
    _seed_default_plans(db)
    plans = db.query(Plan).order_by(Plan.id.asc()).all()
    result = []
    for p in plans:
        features_list = []
        if p.features:
            try:
                features_list = json.loads(p.features) if p.features.startswith("[") else [f.strip() for f in p.features.split(",")]
            except Exception:
                features_list = [p.features]
        active_sub_count = db.query(Subscription).filter(Subscription.plan_id == p.id, Subscription.status == "active").count()

        result.append({
            "id": f"plan-{p.id}",
            "dbId": p.id,
            "name": p.name,
            "description": p.description or "",
            "priceMonthly": float(p.monthly_price),
            "priceQuarterly": float(p.quarterly_price) if p.quarterly_price else round(float(p.monthly_price) * 3 * 0.9),
            "priceYearly": float(p.yearly_price) if p.yearly_price else round(float(p.monthly_price) * 10),
            "features": features_list,
            "activeSubscribers": active_sub_count,
            "isEnabled": p.is_active,
            "isPopular": p.is_popular or False,
        })
    return {"success": True, "plans": result}


# ---------------------------------------------------------------------------
# Central Authoritative Billing Calculation Endpoint
# ---------------------------------------------------------------------------

@router.post("/billing/calculate")
def calculate_billing(
    payload: BillingCalculatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Central Authoritative Billing Calculation Endpoint.
    Backend retrieves plan from database, derives base price by cycle, computes 10% GST and final payable.
    """
    plan_ident = payload.plan_id or payload.target_plan_name or payload.plan_name or "Starter Tier"
    target_plan = _lookup_plan(db, plan_ident)
    target_price = _calculate_plan_cycle_price(target_plan, payload.billing_cycle)

    # Fetch customer's active subscription
    active_sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
        .first()
    )

    current_plan_name = active_sub.plan.name if active_sub and active_sub.plan else None
    current_subscription_value = Decimal(str(active_sub.price)) if active_sub and active_sub.price else (
        Decimal(str(active_sub.plan.monthly_price)) if active_sub and active_sub.plan else Decimal("0.00")
    )

    is_upgrade = False
    is_downgrade = False
    upgrade_adjustment = Decimal("0.00")
    downgrade_adjustment = Decimal("0.00")
    unused_value = Decimal("0.00")

    if active_sub and active_sub.plan:
        unused_value = current_subscription_value
        if target_price > current_subscription_value:
            is_upgrade = True
            upgrade_adjustment = target_price - unused_value
        elif target_price < current_subscription_value:
            is_downgrade = True
            downgrade_adjustment = unused_value - target_price
            upgrade_adjustment = Decimal("0.00")
        else:
            upgrade_adjustment = Decimal("0.00")
    else:
        # Initial subscription purchase
        upgrade_adjustment = target_price

    # 10% GST calculation with integer rupee rounding
    gst_amount = (upgrade_adjustment * GST_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP) if upgrade_adjustment > 0 else Decimal("0")
    total_payable = (upgrade_adjustment + gst_amount).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    return {
        "success": True,
        "plan_id": target_plan.id,
        "current_plan_name": current_plan_name,
        "current_subscription_value": float(current_subscription_value),
        "new_plan_name": target_plan.name,
        "billing_cycle": payload.billing_cycle.capitalize(),
        "new_subscription_value": float(target_price),
        "unused_value": float(unused_value),
        "upgrade_adjustment": float(upgrade_adjustment),
        "downgrade_adjustment": float(downgrade_adjustment),
        "is_upgrade": is_upgrade,
        "is_downgrade": is_downgrade,
        "gst_rate": float(GST_RATE),
        "gst_amount": float(gst_amount),
        "total_payable": float(total_payable),
    }


# ---------------------------------------------------------------------------
# Subscription Endpoints
# ---------------------------------------------------------------------------

@router.get("/subscriptions/me")
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns only the authenticated customer's subscription.
    """
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .filter(~Subscription.status.in_(["superseded"]))
        .order_by(Subscription.id.desc())
        .first()
    )

    if not sub:
        return {"success": True, "subscription": None}

    next_plan_name = sub.next_plan.name if sub.next_plan else None
    cust_name = _get_customer_display_name(current_user)

    plan_name = sub.plan.name if sub.plan else "Starter Tier"
    price = float(sub.price) if sub.price is not None and sub.price > 0 else (float(sub.plan.monthly_price) if sub.plan else 1999.0)
    cycle = sub.billing_cycle or "Monthly"

    return {
        "success": True,
        "subscription": {
            "id": str(sub.id),
            "user_id": current_user.id,
            "customerName": cust_name,
            "customerEmail": current_user.email,
            "planName": plan_name,
            "planId": str(sub.plan_id),
            "amount": price,
            "status": "Canceled" if sub.status in ["canceled", "cancelled"] else ("Active" if sub.status == "active" else sub.status.capitalize()),
            "billingCycle": cycle,
            "startDate": sub.current_period_start.isoformat(),
            "nextBillingDate": sub.current_period_end.isoformat(),
            "cancelAtPeriodEnd": sub.cancel_at_period_end,
            "canceledAt": sub.canceled_at.isoformat() if sub.canceled_at else None,
            "nextPlanName": next_plan_name,
        },
    }


@router.get("/admin/subscriptions")
def get_admin_subscriptions(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Returns all subscriptions from database for Admin. Requires Admin authorization.
    """
    subs = (
        db.query(Subscription)
        .filter(~Subscription.status.in_(["superseded"]))
        .order_by(Subscription.id.desc())
        .all()
    )

    result = []
    for s in subs:
        u = db.query(User).filter(User.id == s.user_id).first()
        cust_name = _get_customer_display_name(u) if u else "Valued Customer"
        cust_email = u.email if u else ""
        plan_name = s.plan.name if s.plan else "Starter Tier"
        price = float(s.price) if s.price is not None and s.price > 0 else (float(s.plan.monthly_price) if s.plan else 0.0)

        result.append({
            "id": f"sub-{s.id}",
            "customerId": f"cust-{s.user_id}",
            "customerName": cust_name,
            "customerEmail": cust_email,
            "planName": plan_name,
            "status": "Active" if s.status == "active" else ("Canceled" if s.status in ["canceled", "cancelled"] else s.status.capitalize()),
            "billingCycle": s.billing_cycle or "Monthly",
            "amount": price,
            "startDate": s.current_period_start.isoformat(),
            "nextBillingDate": s.current_period_end.isoformat(),
            "cancelAtPeriodEnd": s.cancel_at_period_end,
        })
    return {"success": True, "subscriptions": result}


@router.get("/billing/summary")
def get_billing_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Authoritative Customer Billing Summary computed directly from SQLite database.
    """
    user_id = current_user.id

    # 1. Fetch active subscription
    active_sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
        .first()
    )

    current_plan_name = active_sub.plan.name if active_sub and active_sub.plan else "No active plan"
    current_sub_cost = float(active_sub.price) if active_sub and active_sub.price else (float(active_sub.plan.monthly_price) if active_sub and active_sub.plan else 0.0)
    billing_cycle = active_sub.billing_cycle if active_sub and active_sub.billing_cycle else ("Monthly" if active_sub else "N/A")
    sub_status = "Active" if active_sub and active_sub.status == "active" else "Inactive"
    renewal_date = active_sub.current_period_end.isoformat() if active_sub and active_sub.current_period_end else "N/A"
    next_billing_amount = current_sub_cost

    # 2. Invoices & Payments from SQLite
    invoices = db.query(Invoice).filter(Invoice.user_id == user_id).order_by(Invoice.id.desc()).all()
    payments = db.query(Payment).filter(
        (Payment.customer_id == user_id) | (Payment.customer_email.ilike(current_user.email))
    ).order_by(Payment.id.desc()).all()
    user_subs = db.query(Subscription).filter(Subscription.user_id == user_id).all()
    user_sub_ids = [s.id for s in user_subs]
    refunds = db.query(Refund).filter(Refund.subscription_id.in_(user_sub_ids)).all() if user_sub_ids else []

    successful_payments = [p for p in payments if p.status in ["paid", "PAID", "success", "SUCCESS"]]
    pending_payments = [p for p in payments if p.status in ["pending", "open", "processing"]]
    failed_payments = [p for p in payments if p.status in ["failed", "FAILED", "cancelled", "CANCELLED"]]
    refunded_payments = [p for p in payments if p.status in ["refunded", "REFUNDED"]]

    successful_amount = sum(float(p.amount) for p in successful_payments)
    pending_amount = sum(float(p.amount) for p in pending_payments)
    failed_amount = sum(float(p.amount) for p in failed_payments)
    refunded_amount = sum(float(r.amount) for r in refunds) or sum(float(p.amount) for p in refunded_payments)

    total_spent = successful_amount
    payments_completed_count = len(successful_payments)
    average_monthly_spend = round(total_spent / max(1, payments_completed_count), 2) if payments_completed_count > 0 else 0.0

    latest_payment_date = successful_payments[0].created_at.strftime("%Y-%m-%d") if (successful_payments and successful_payments[0].created_at) else None

    payment_summary = {
        "successfulCount": len(successful_payments),
        "successfulAmount": successful_amount,
        "pendingCount": len(pending_payments),
        "pendingAmount": pending_amount,
        "failedCount": len(failed_payments),
        "failedAmount": failed_amount,
        "refundedCount": len(refunds) or len(refunded_payments),
        "refundedAmount": refunded_amount,
        "latestPaymentDate": latest_payment_date,
    }

    # Format Recent Invoices
    cust_display_name = _get_customer_display_name(current_user)
    recent_invoices_data = []
    for inv in invoices[:5]:
        recent_invoices_data.append({
            "id": str(inv.id),
            "invoiceNumber": inv.invoice_number,
            "customerName": cust_display_name,
            "customerEmail": current_user.email,
            "amount": float(inv.total_amount),
            "status": "Paid" if inv.status in ["paid", "PAID"] else inv.status.capitalize(),
            "issueDate": inv.period_start.isoformat() if inv.period_start else date.today().isoformat(),
            "dueDate": inv.period_end.isoformat() if inv.period_end else date.today().isoformat(),
            "items": [
                {
                    "id": str(li.id),
                    "description": li.description,
                    "quantity": float(li.quantity),
                    "unitPrice": float(li.unit_amount),
                    "amount": float(li.amount),
                }
                for li in inv.line_items
            ],
        })

    # Calculate spending trend per month
    month_buckets: Dict[str, float] = {}
    for p in successful_payments:
        m_str = p.created_at.strftime("%b %Y") if p.created_at else datetime.now(timezone.utc).strftime("%b %Y")
        month_buckets[m_str] = month_buckets.get(m_str, 0.0) + float(p.amount)

    spending_trend = [{"month": m, "amount": amt} for m, amt in month_buckets.items()]
    if not spending_trend:
        spending_trend = [{"month": datetime.now(timezone.utc).strftime("%b %Y"), "amount": total_spent}]

    customer_since = current_user.created_at.strftime("%Y-%m-%d") if current_user.created_at else date.today().isoformat()
    membership_status = "Active" if getattr(current_user, "account_status", "ACTIVE") == "ACTIVE" and sub_status == "Active" else ("Verified" if current_user.is_verified else "Pending")

    return {
        "success": True,
        "summary": {
            "totalSpent": total_spent,
            "totalSavings": 0.0,
            "currentSubscriptionCost": current_sub_cost,
            "currentPlanName": current_plan_name,
            "averageMonthlySpend": average_monthly_spend,
            "paymentsCompletedCount": payments_completed_count,
            "billingCycle": billing_cycle,
            "subscriptionStatus": sub_status,
            "renewalDate": renewal_date,
            "nextBillingDate": renewal_date,
            "nextBillingAmount": next_billing_amount,
            "paymentSummary": payment_summary,
            "discounts": [],
            "recentInvoices": recent_invoices_data,
            "spendingTrend": spending_trend,
            "customerSince": customer_since,
            "membershipStatus": membership_status,
        }
    }


# ---------------------------------------------------------------------------
# Payment Processing Endpoints
# ---------------------------------------------------------------------------

@router.post("/payments/process")
@router.post("/billing/process-payment")
def process_payment(
    payload: ProcessPaymentPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment_id = generate_payment_id()
    cust_name = _get_customer_display_name(current_user)
    cust_email = current_user.email.strip().lower()
    target_user_id = current_user.id

    plan_ident = payload.plan_id or payload.plan_name or "Starter Tier"
    plan = _lookup_plan(db, plan_ident)
    cycle = payload.billing_cycle.strip().capitalize() if payload.billing_cycle else "Monthly"
    base_price = _calculate_plan_cycle_price(plan, cycle)
    gst_amount = (base_price * GST_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    calculated_total = base_price + gst_amount

    # Scenario 1: CANCELLED payment
    if payload.simulate_cancel:
        payment = Payment(
            payment_id=payment_id,
            customer_id=target_user_id,
            customer_email=cust_email,
            amount=calculated_total,
            currency="INR",
            payment_method=payload.payment_method.upper(),
            status="cancelled",
            failure_reason="Customer cancelled payment checkout before completion.",
        )
        db.add(payment)
        db.commit()

        try:
            subject = "Payment Cancelled — NexFlow"
            text_body = f"Hi {cust_name},\n\nYour payment for {plan.name} was cancelled. No amount was charged, and your plan was not activated.\n\n— NexFlow Team"
            html_body = f"<p>Hi {cust_name},</p><p>Your payment for <strong>{plan.name}</strong> was cancelled. No amount was charged, and your plan was not activated.</p>"
            background_tasks.add_task(_send, cust_email, subject, html_body, text_body)
        except Exception as exc:
            logger.error("Failed to queue payment cancelled email: %s", exc)

        return {
            "success": False,
            "payment_status": "CANCELLED",
            "subscription_status": "NOT_ACTIVE",
            "message": "Payment checkout was cancelled. Subscription was not activated.",
        }

    # Scenario 2: FAILED payment
    if payload.simulate_failure:
        payment = Payment(
            payment_id=payment_id,
            customer_id=target_user_id,
            customer_email=cust_email,
            amount=calculated_total,
            currency="INR",
            payment_method=payload.payment_method.upper(),
            status="failed",
            failure_reason="Bank Timeout — Issuing bank server did not respond.",
        )
        db.add(payment)
        db.commit()

        try:
            subject = "Payment Failed — NexFlow"
            text_body = f"Hi {cust_name},\n\nYour payment of ₹{calculated_total:,.2f} for {plan.name} failed. No amount was successfully charged, and the plan was not activated.\n\n— NexFlow Team"
            html_body = f"<p>Hi {cust_name},</p><p>Your payment of <strong>₹{calculated_total:,.2f}</strong> for <strong>{plan.name}</strong> failed. No amount was charged, and the plan was not activated.</p>"
            background_tasks.add_task(_send, cust_email, subject, html_body, text_body)
        except Exception as exc:
            logger.error("Failed to queue payment failed email: %s", exc)

        return {
            "success": False,
            "payment_status": "FAILED",
            "subscription_status": "NOT_ACTIVE",
            "failure_reason": "Bank Timeout — Issuing bank server did not respond.",
            "message": "Payment processing failed. No amount charged, and no plan activated.",
        }

    # Scenario 3: SUCCESSFUL payment
    # Deactivate old active subscriptions for this user
    old_subs = db.query(Subscription).filter(Subscription.user_id == target_user_id, Subscription.status == "active").all()
    for s in old_subs:
        s.status = "superseded"

    # Create new active subscription
    period_start = date.today()
    days_to_add = 90 if cycle.lower() == "quarterly" else (365 if cycle.lower() == "yearly" else 30)
    period_end = period_start + timedelta(days=days_to_add)

    sub = Subscription(
        user_id=target_user_id,
        plan_id=plan.id,
        billing_cycle=cycle,
        price=base_price,
        status="active",
        current_period_start=period_start,
        current_period_end=period_end,
    )
    db.add(sub)
    db.flush()

    # Generate Invoice & Line Items
    inv_num = f"INV-{datetime.utcnow():%Y%m}-{generate_payment_id().replace('PAY-', '')[:6]}"
    invoice = Invoice(
        invoice_number=inv_num,
        subscription_id=sub.id,
        user_id=target_user_id,
        payment_reference=payment_id,
        status="paid",
        currency="INR",
        period_start=period_start,
        period_end=period_end,
        subtotal_amount=base_price,
        tax_amount=gst_amount,
        total_amount=calculated_total,
        issued_at=datetime.now(timezone.utc),
        due_at=datetime.now(timezone.utc),
    )
    db.add(invoice)
    db.flush()

    line_item = InvoiceLineItem(
        invoice_id=invoice.id,
        item_type="plan_fee",
        description=f"{plan.name} ({cycle}) Subscription ({period_start.isoformat()} to {period_end.isoformat()})",
        quantity=Decimal("1"),
        unit_amount=base_price,
        amount=base_price,
    )
    db.add(line_item)

    payment = Payment(
        payment_id=payment_id,
        invoice_id=invoice.id,
        subscription_id=sub.id,
        customer_id=target_user_id,
        customer_email=cust_email,
        amount=calculated_total,
        currency="INR",
        payment_method=payload.payment_method.upper(),
        status="paid",
    )
    db.add(payment)
    db.commit()

    # Queue payment success email
    background_tasks.add_task(
        send_payment_success_email,
        cust_email,
        cust_name,
        plan.name,
        float(calculated_total),
        datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        payload.payment_method.upper(),
        payment_id,
        inv_num,
    )

    return {
        "success": True,
        "payment_status": "SUCCESS",
        "subscription_status": "ACTIVE",
        "transactionId": payment_id,
        "paymentId": payment_id,
        "invoiceId": inv_num,
        "planName": plan.name,
        "planId": plan.id,
        "billingCycle": cycle,
        "amountPaid": float(calculated_total),
        "baseAmount": float(base_price),
        "gstAmount": float(gst_amount),
        "paymentDate": date.today().isoformat(),
        "emailStatus": f"Receipt email sent to {cust_email}",
        "message": "Payment verified and subscription activated.",
    }


@router.post("/subscriptions/upgrade")
def upgrade_subscription(
    payload: UpgradePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
        .first()
    )
    if not sub:
        raise HTTPException(status_code=400, detail="No active subscription found to upgrade.")

    old_plan = sub.plan
    target_plan = _lookup_plan(db, payload.target_plan_name)
    cycle = payload.billing_cycle.strip().capitalize() if payload.billing_cycle else "Monthly"
    target_price = _calculate_plan_cycle_price(target_plan, cycle)
    current_value = Decimal(str(sub.price)) if sub.price is not None and sub.price > 0 else Decimal(str(old_plan.monthly_price))

    adjustment = max(Decimal("0.00"), target_price - current_value)
    gst_amt = (adjustment * GST_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP) if adjustment > 0 else Decimal("0")
    total_amount = (adjustment + gst_amt).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    amount_due = float(total_amount)

    cust_name = _get_customer_display_name(current_user)

    # Handle Upgrade Payment Failure
    if payload.simulate_failure:
        payment_id = generate_payment_id()
        payment = Payment(
            payment_id=payment_id,
            subscription_id=sub.id,
            customer_id=current_user.id,
            customer_email=current_user.email,
            amount=total_amount,
            currency="INR",
            payment_method="UPGRADE_PRORATED",
            status="failed",
            failure_reason="Upgrade payment transaction declined by bank.",
        )
        db.add(payment)
        db.commit()

        try:
            subject = "Upgrade Payment Failed — NexFlow"
            text_body = f"Hi {cust_name},\n\nYour upgrade payment to {target_plan.name} failed. Your current {old_plan.name} plan remains active and unchanged.\n\n— NexFlow Team"
            html_body = f"<p>Hi {cust_name},</p><p>Your upgrade payment to <strong>{target_plan.name}</strong> failed. Your current <strong>{old_plan.name}</strong> plan remains active and unchanged.</p>"
            background_tasks.add_task(_send, current_user.email, subject, html_body, text_body)
        except Exception as exc:
            logger.error("Failed to queue upgrade failed email: %s", exc)

        return {
            "success": False,
            "message": f"Upgrade payment failed. Your current plan ({old_plan.name}) remains active.",
            "current_plan": old_plan.name,
        }

    # Execute Upgrade
    sub.plan_id = target_plan.id
    sub.price = target_price
    sub.billing_cycle = cycle
    sub.current_period_start = date.today()

    payment_id = generate_payment_id()
    inv_num = f"INV-{datetime.utcnow():%Y%m}-{payment_id.replace('PAY-', '')[:6]}"

    invoice = Invoice(
        invoice_number=inv_num,
        subscription_id=sub.id,
        user_id=current_user.id,
        status="paid",
        currency="INR",
        period_start=sub.current_period_start,
        period_end=sub.current_period_end,
        subtotal_amount=adjustment,
        tax_amount=gst_amt,
        total_amount=total_amount,
        issued_at=datetime.now(timezone.utc),
        due_at=datetime.now(timezone.utc),
    )
    db.add(invoice)
    db.flush()

    line_item = InvoiceLineItem(
        invoice_id=invoice.id,
        item_type="plan_fee",
        description=f"Upgrade to {target_plan.name} ({cycle})",
        quantity=Decimal("1"),
        unit_amount=total_amount,
        amount=total_amount,
    )
    db.add(line_item)

    payment = Payment(
        payment_id=payment_id,
        invoice_id=invoice.id,
        subscription_id=sub.id,
        customer_id=current_user.id,
        customer_email=current_user.email,
        amount=total_amount,
        currency="INR",
        payment_method="UPGRADE_PRORATED",
        status="paid",
    )
    db.add(payment)
    db.commit()

    background_tasks.add_task(
        send_upgrade_email,
        current_user.email,
        cust_name,
        old_plan.name,
        target_plan.name,
        float(old_plan.monthly_price),
        float(target_plan.monthly_price),
        float(current_value),
        amount_due,
        float(target_plan.monthly_price),
        date.today().isoformat(),
        inv_num,
        payment_id,
    )

    return {
        "success": True,
        "message": f"Subscription upgraded to {target_plan.name}!",
        "amount_charged": amount_due,
        "new_plan": target_plan.name,
    }


@router.post("/subscriptions/downgrade")
def downgrade_subscription(
    payload: DowngradePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
        .first()
    )
    if not sub:
        raise HTTPException(status_code=400, detail="No active subscription found to downgrade.")

    target_plan = _lookup_plan(db, payload.target_plan_name)
    cycle = payload.billing_cycle.strip().capitalize() if payload.billing_cycle else "Monthly"
    old_plan_name = sub.plan.name
    old_plan_price = float(sub.price) if sub.price is not None and sub.price > 0 else float(sub.plan.monthly_price)

    sub.plan_id = target_plan.id
    sub.next_plan_id = target_plan.id
    sub.price = _calculate_plan_cycle_price(target_plan, cycle)
    sub.billing_cycle = cycle
    db.commit()
    db.refresh(sub)

    cust_name = _get_customer_display_name(current_user)
    background_tasks.add_task(
        send_downgrade_email,
        current_user.email,
        cust_name,
        old_plan_name,
        target_plan.name,
        old_plan_price,
        float(target_plan.monthly_price),
        sub.current_period_end.isoformat(),
        sub.current_period_end.isoformat(),
        str(sub.id),
    )

    return {
        "success": True,
        "message": f"Subscription successfully changed to {target_plan.name}.",
        "effective_date": sub.current_period_end.isoformat(),
        "target_plan": target_plan.name,
    }


@router.post("/subscriptions/cancel")
def cancel_subscription(
    payload: CancelSubscriptionPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        sub = (
            db.query(Subscription)
            .filter(Subscription.user_id == current_user.id)
            .filter(Subscription.status.ilike("active"))
            .order_by(Subscription.id.desc())
            .first()
        )
        if not sub:
            sub = (
                db.query(Subscription)
                .filter(Subscription.user_id == current_user.id)
                .filter(~Subscription.status.ilike("canceled"))
                .filter(~Subscription.status.ilike("cancelled"))
                .order_by(Subscription.id.desc())
                .first()
            )
        if not sub:
            raise HTTPException(status_code=404, detail="No active subscription found to cancel.")

        orig_payment = (
            db.query(Payment)
            .filter(
                Payment.customer_id == current_user.id,
                Payment.status.in_(["paid", "PAID", "success", "SUCCESS"]),
            )
            .order_by(Payment.id.desc())
            .first()
        )

        paid_amount = float(orig_payment.amount) if orig_payment else (float(sub.price) if sub.price and sub.price > 0 else float(sub.plan.monthly_price if sub.plan else 1999.0))

        start_date = sub.current_period_start
        end_date = sub.current_period_end
        cancellation_date = date.today()

        total_subscription_days = max(1, (end_date - start_date).days)
        used_days = max(0, (cancellation_date - start_date).days)
        remaining_days = max(0, total_subscription_days - used_days)

        refund_amount = round(paid_amount * (remaining_days / total_subscription_days), 2)

        valid_payment_id = orig_payment.payment_id if orig_payment and orig_payment.payment_id else f"PAY-{generate_payment_id().replace('PAY-', '')}"
        refund_id = f"REF-{generate_payment_id().replace('PAY-', '')[:8]}"

        refund = Refund(
            refund_id=refund_id,
            subscription_id=sub.id,
            payment_id=valid_payment_id,
            invoice_id=orig_payment.invoice_id if orig_payment else None,
            amount=Decimal(str(refund_amount)),
            currency=orig_payment.currency if orig_payment else "INR",
            reason=payload.reason or "Customer cancellation",
            status="refunded",
            period_start=start_date,
            period_end=end_date,
            cancelled_at=datetime.now(timezone.utc),
        )
        db.add(refund)

        sub.status = "canceled"
        sub.cancel_at_period_end = True
        sub.canceled_at = datetime.now(timezone.utc)

        db.commit()

        cust_name = _get_customer_display_name(current_user)
        plan_name = sub.plan.name if sub.plan else "Starter Tier"
        try:
            background_tasks.add_task(
                send_cancellation_email,
                current_user.email,
                cust_name,
                plan_name,
                date.today().isoformat(),
                sub.current_period_end.isoformat(),
                paid_amount,
                refund_amount,
                "Processed",
                str(sub.id),
            )
        except Exception as email_err:
            logger.error("Failed to add cancellation email task: %s", email_err)

        return {
            "success": True,
            "message": "Subscription cancelled.",
            "refund_amount": refund_amount,
            "effective_date": sub.current_period_end.isoformat(),
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.error("Failed to cancel subscription: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(exc)}")


# ---------------------------------------------------------------------------
# Invoices & Payments Endpoints
# ---------------------------------------------------------------------------

@router.get("/invoices/me")
def get_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() == "admin":
        invoices = db.query(Invoice).order_by(Invoice.id.desc()).all()
    else:
        invoices = (
            db.query(Invoice)
            .filter(Invoice.user_id == current_user.id)
            .order_by(Invoice.id.desc())
            .all()
        )

    default_cust_name = _get_customer_display_name(current_user)
    result = []
    for inv in invoices:
        inv_user = db.query(User).filter(User.id == inv.user_id).first()
        inv_cust_name = _get_customer_display_name(inv_user) if inv_user else default_cust_name
        inv_cust_email = inv_user.email if inv_user else current_user.email

        items = [
            {
                "id": str(li.id),
                "description": li.description,
                "quantity": float(li.quantity),
                "unitPrice": float(li.unit_amount),
                "amount": float(li.amount),
            }
            for li in inv.line_items
        ]
        result.append(
            {
                "id": str(inv.id),
                "invoiceNumber": inv.invoice_number,
                "customerName": inv_cust_name,
                "customerEmail": inv_cust_email,
                "amount": float(inv.total_amount),
                "status": "Paid" if inv.status in ["paid", "PAID"] else inv.status.capitalize(),
                "issueDate": inv.period_start.isoformat() if inv.period_start else date.today().isoformat(),
                "dueDate": inv.period_end.isoformat() if inv.period_end else date.today().isoformat(),
                "items": items,
            }
        )
    return {"success": True, "invoices": result}


@router.get("/payments/me")
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() == "admin":
        payments = db.query(Payment).order_by(Payment.id.desc()).all()
    else:
        payments = (
            db.query(Payment)
            .filter(
                (Payment.customer_id == current_user.id)
                | (Payment.customer_email.ilike(current_user.email))
            )
            .order_by(Payment.id.desc())
            .all()
        )

    result = []
    for p in payments:
        p_user = db.query(User).filter(User.id == p.customer_id).first() if p.customer_id else None
        if not p_user and p.customer_email:
            p_user = db.query(User).filter(User.email.ilike(p.customer_email)).first()
        if not p_user:
            p_user = current_user

        cust_name = _get_customer_display_name(p_user)
        if not cust_name or cust_name.lower() in ["system administrator", "admin"] or "@" in cust_name:
            if current_user.role.lower() != "admin":
                cust_name = _get_customer_display_name(current_user)
            else:
                cust_name = _get_customer_display_name(p_user)

        result.append({
            "id": p.payment_id,
            "reference": p.payment_id,
            "customerName": cust_name,
            "customer": cust_name,
            "customerEmail": p.customer_email or p_user.email,
            "method": p.payment_method,
            "paymentMethod": p.payment_method,
            "amount": float(p.amount),
            "status": "Success" if p.status in ["paid", "PAID", "success", "SUCCESS"] else p.status.capitalize(),
            "date": p.created_at.strftime("%Y-%m-%d") if p.created_at else date.today().isoformat(),
            "invoiceId": str(p.invoice_id) if p.invoice_id else None,
        })
    return {"success": True, "payments": result}


# ---------------------------------------------------------------------------
# Admin Dashboard, Analytics, and Reports Endpoints
# ---------------------------------------------------------------------------

@router.get("/admin/dashboard/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Authoritative Admin Dashboard Statistics directly computed from the active SQLite database.
    """
    all_customers = db.query(User).filter(User.role.ilike("customer"), (User.account_status != "DELETED") | (User.account_status == None)).all()
    total_customers = len(all_customers)
    active_customers = sum(1 for c in all_customers if getattr(c, "is_verified", True) and getattr(c, "account_status", "ACTIVE") != "SUSPENDED")

    active_subs = (
        db.query(Subscription)
        .filter(Subscription.status == "active")
        .all()
    )
    active_subscriptions_count = len(active_subs)

    # Compute exact recurring MRR normalized monthly from active subscriptions
    total_mrr = 0.0
    for s in active_subs:
        price = float(s.price) if s.price is not None and s.price > 0 else (float(s.plan.monthly_price) if s.plan else 0.0)
        cycle = (s.billing_cycle or "Monthly").lower()
        if cycle == "quarterly":
            total_mrr += round(price / 3, 2)
        elif cycle == "yearly":
            total_mrr += round(price / 12, 2)
        else:
            total_mrr += price

    payments = db.query(Payment).all()
    total_revenue = sum(float(p.amount) for p in payments if p.status in ["paid", "PAID", "success", "SUCCESS"])

    invoices = db.query(Invoice).order_by(Invoice.id.desc()).all()
    pending_invoices = sum(1 for inv in invoices if inv.status in ["open", "pending", "overdue"])

    open_tickets = db.query(Ticket).filter(Ticket.status.in_(["Open", "In Progress", "open"])).count()

    recent_customers_data = []
    for c in sorted(all_customers, key=lambda x: x.created_at or datetime.min, reverse=True)[:5]:
        c_sub = db.query(Subscription).filter(Subscription.user_id == c.id, Subscription.status == "active").first()
        recent_customers_data.append({
            "id": f"cust-{c.id}",
            "name": _get_customer_display_name(c),
            "email": c.email,
            "status": "Active" if getattr(c, "account_status", "ACTIVE") == "ACTIVE" and getattr(c, "is_active", True) else getattr(c, "account_status", "Active").capitalize(),
            "subscriptionPlan": c_sub.plan.name if c_sub and c_sub.plan else "None",
            "mrr": float(c_sub.price) if c_sub and c_sub.price else (float(c_sub.plan.monthly_price) if c_sub and c_sub.plan else 0.0),
            "totalSpent": sum(float(p.amount) for p in payments if p.customer_id == c.id and p.status in ["paid", "PAID", "success", "SUCCESS"]),
            "joinedDate": c.created_at.strftime("%Y-%m-%d") if c.created_at else date.today().isoformat(),
            "country": c.country or "India",
        })

    recent_invoices_data = []
    for inv in invoices[:5]:
        inv_user = db.query(User).filter(User.id == inv.user_id).first()
        recent_invoices_data.append({
            "id": str(inv.id),
            "invoiceNumber": inv.invoice_number,
            "customerName": _get_customer_display_name(inv_user) if inv_user else "Valued Customer",
            "customerEmail": inv_user.email if inv_user else "",
            "amount": float(inv.total_amount),
            "status": "Paid" if inv.status in ["paid", "PAID"] else inv.status.capitalize(),
            "issueDate": inv.period_start.isoformat() if inv.period_start else date.today().isoformat(),
            "dueDate": inv.period_end.isoformat() if inv.period_end else date.today().isoformat(),
        })

    recent_tickets_data = []
    tickets = db.query(Ticket).order_by(Ticket.id.desc()).all()
    for t in tickets[:4]:
        recent_tickets_data.append({
            "id": t.ticket_id,
            "subject": t.subject,
            "customerName": t.customer_name,
            "category": t.category,
            "status": t.status,
            "createdDate": t.created_at.isoformat() if t.created_at else date.today().isoformat(),
            "priority": "High" if "Failed" in t.subject or "Restore" in t.subject else "Medium",
        })

    return {
        "success": True,
        "stats": {
            "totalCustomers": total_customers,
            "activeCustomers": active_customers,
            "activeSubscriptions": active_subscriptions_count,
            "totalMRR": total_mrr,
            "totalRevenue": total_revenue,
            "pendingInvoices": pending_invoices,
            "openTickets": open_tickets,
            "recentCustomers": recent_customers_data,
            "recentInvoices": recent_invoices_data,
            "recentTickets": recent_tickets_data,
        }
    }


@router.get("/admin/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Authoritative SaaS Financial Analytics calculated strictly from active SQLite database.
    """
    all_customers = db.query(User).filter(User.role.ilike("customer"), (User.account_status != "DELETED") | (User.account_status == None)).all()
    active_customers_count = sum(1 for c in all_customers if getattr(c, "is_verified", True) and getattr(c, "account_status", "ACTIVE") != "SUSPENDED")

    active_subs = db.query(Subscription).filter(Subscription.status == "active").all()
    canceled_subs_count = db.query(Subscription).filter(Subscription.status.in_(["canceled", "cancelled"])).count()
    total_subs_count = len(active_subs) + canceled_subs_count

    total_mrr = 0.0
    for s in active_subs:
        price = float(s.price) if s.price is not None and s.price > 0 else (float(s.plan.monthly_price) if s.plan else 0.0)
        cycle = (s.billing_cycle or "Monthly").lower()
        if cycle == "quarterly":
            total_mrr += round(price / 3, 2)
        elif cycle == "yearly":
            total_mrr += round(price / 12, 2)
        else:
            total_mrr += price

    arpu = round(total_mrr / max(1, active_customers_count), 2) if active_customers_count > 0 else 0.0
    churn_rate = round((canceled_subs_count / max(1, total_subs_count)) * 100, 1) if total_subs_count > 0 else 0.0
    ltv = round(arpu * (100.0 / max(churn_rate, 5.0)), 2) if active_customers_count > 0 else 0.0

    plans = db.query(Plan).all()
    tier_breakdown = []
    for p in plans:
        matching_subs = [s for s in active_subs if s.plan_id == p.id]
        count = len(matching_subs)
        tier_mrr = sum(
            (float(s.price) if s.price and s.price > 0 else float(p.monthly_price))
            for s in matching_subs
        )
        pct = round((tier_mrr / max(1, total_mrr)) * 100) if total_mrr > 0 else 0
        tier_breakdown.append({
            "planName": p.name,
            "accountsCount": count,
            "mrr": tier_mrr,
            "percentage": pct,
        })

    return {
        "success": True,
        "analytics": {
            "arpu": arpu,
            "ltv": ltv,
            "churnRate": churn_rate,
            "totalMRR": total_mrr,
            "activeCustomers": active_customers_count,
            "tierBreakdown": tier_breakdown,
        }
    }


@router.get("/admin/reports/summary")
def get_admin_reports_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Authoritative Administrative Reports Summary.
    """
    payments = db.query(Payment).all()
    total_revenue = sum(float(p.amount) for p in payments if p.status in ["paid", "PAID", "success", "SUCCESS"])

    invoices = db.query(Invoice).all()
    paid_invoices_count = sum(1 for inv in invoices if inv.status in ["paid", "PAID"])
    pending_invoices_count = sum(1 for inv in invoices if inv.status in ["open", "pending", "overdue"])
    pending_revenue = sum(float(inv.total_amount) for inv in invoices if inv.status in ["open", "pending", "overdue"])

    active_subs = db.query(Subscription).filter(Subscription.status == "active").all()
    total_mrr = 0.0
    for s in active_subs:
        price = float(s.price) if s.price is not None and s.price > 0 else (float(s.plan.monthly_price) if s.plan else 0.0)
        cycle = (s.billing_cycle or "Monthly").lower()
        if cycle == "quarterly":
            total_mrr += round(price / 3, 2)
        elif cycle == "yearly":
            total_mrr += round(price / 12, 2)
        else:
            total_mrr += price

    return {
        "success": True,
        "reports": {
            "totalRevenue": total_revenue,
            "pendingRevenue": pending_revenue,
            "monthlyMRR": total_mrr,
            "paidInvoicesCount": paid_invoices_count,
            "pendingInvoicesCount": pending_invoices_count,
            "totalInvoicesCount": len(invoices),
        }
    }


# ---------------------------------------------------------------------------
# Support Tickets Database Endpoints
# ---------------------------------------------------------------------------

@router.get("/support/tickets")
def get_support_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() == "admin":
        tickets = db.query(Ticket).order_by(Ticket.id.desc()).all()
    else:
        tickets = (
            db.query(Ticket)
            .filter((Ticket.user_id == current_user.id) | (Ticket.customer_email.ilike(current_user.email)))
            .order_by(Ticket.id.desc())
            .all()
        )

    result = []
    for t in tickets:
        messages = (
            db.query(TicketMessage)
            .filter(TicketMessage.ticket_id == t.ticket_id)
            .order_by(TicketMessage.id.asc())
            .all()
        )
        msg_list = [
            {
                "id": str(m.id),
                "senderRole": m.sender_role,
                "senderName": m.sender_name,
                "message": m.message,
                "timestamp": m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else date.today().isoformat(),
            }
            for m in messages
        ]

        fields = {}
        if t.dynamic_fields:
            try:
                fields = json.loads(t.dynamic_fields)
            except Exception:
                fields = {}

        result.append({
            "id": t.ticket_id,
            "customerId": f"CUS-{t.user_id:06d}" if t.user_id else "CUS-000001",
            "customerName": t.customer_name,
            "customerEmail": t.customer_email,
            "category": t.category,
            "subcategory": t.subcategory or "",
            "status": t.status,
            "subject": t.subject,
            "createdDate": t.created_at.isoformat() if t.created_at else date.today().isoformat(),
            "updatedDate": t.updated_at.isoformat() if t.updated_at else date.today().isoformat(),
            "assignedAgent": t.assigned_agent or "Support Team",
            "unreadMessagesCount": 0,
            "dynamicFields": fields,
            "messages": msg_list,
        })

    return {"success": True, "tickets": result}


@router.post("/support/tickets")
def create_support_ticket(
    payload: CreateTicketPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket_num = f"TCK-{datetime.utcnow():%Y%m}-{generate_payment_id().replace('PAY-', '')[:6]}"
    cust_name = _get_customer_display_name(current_user)
    dyn_json = json.dumps(payload.dynamicFields) if payload.dynamicFields else None

    ticket = Ticket(
        ticket_id=ticket_num,
        user_id=current_user.id,
        customer_name=cust_name,
        customer_email=current_user.email,
        category=payload.category,
        subcategory=payload.subcategory,
        subject=payload.subject,
        status="Open",
        assigned_agent="Support Specialist",
        dynamic_fields=dyn_json,
    )
    db.add(ticket)
    db.flush()

    initial_msg = TicketMessage(
        ticket_id=ticket_num,
        sender_role="Customer" if current_user.role.lower() != "admin" else "Admin",
        sender_name=cust_name,
        message=payload.initialMessage,
    )
    db.add(initial_msg)
    db.commit()

    return {
        "success": True,
        "message": "Support ticket created successfully.",
        "ticketId": ticket_num,
    }


@router.post("/support/tickets/{ticket_id}/messages")
def send_ticket_message(
    ticket_id: str,
    payload: TicketMessagePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    if current_user.role.lower() != "admin" and ticket.user_id != current_user.id and ticket.customer_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Not authorized to reply to this ticket.")

    sender_role = "Admin" if current_user.role.lower() == "admin" else "Customer"
    sender_name = _get_customer_display_name(current_user)

    msg = TicketMessage(
        ticket_id=ticket_id,
        sender_role=sender_role,
        sender_name=sender_name,
        message=payload.message,
    )
    db.add(msg)
    ticket.updated_at = datetime.now(timezone.utc)
    if ticket.status == "Open" and sender_role == "Admin":
        ticket.status = "In Progress"
    db.commit()

    return {
        "success": True,
        "message": "Message sent.",
    }


@router.patch("/support/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    payload: UpdateTicketStatusPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    ticket.status = payload.status
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "success": True,
        "message": f"Ticket status updated to {payload.status}.",
    }


# ---------------------------------------------------------------------------
# Customer Reset (Admin only)
# ---------------------------------------------------------------------------

@router.post("/admin/reset-customer-data")
def admin_reset_customer_data(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Safely reset customer data for testing from scratch:
    - Removes customer users, subscriptions, payments, invoices, refunds, notifications, support tickets.
    - Preserves Admin account and default plans.
    """
    try:
        db.query(TicketMessage).delete()
        db.query(Ticket).delete()
        db.query(Refund).delete()
        db.query(InvoiceLineItem).delete()
        db.query(Invoice).delete()
        db.query(Payment).delete()
        db.query(Subscription).delete()
        db.query(Notification).delete()
        db.query(RevokedToken).delete()
        db.query(User).filter(User.role != "Admin").delete()
        db.commit()

        _seed_default_plans(db)

        return {
            "success": True,
            "message": "Customer data reset successfully. Admin and plans preserved.",
            "customer_count": 0,
        }
    except Exception as exc:
        db.rollback()
        logger.error("Failed to reset customer data: %s", exc)
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(exc)}")
