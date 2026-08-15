from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.billing.invoicing import UsageCharge, generate_invoice
from app.billing.models import Invoice, Plan, Subscription
from app.billing.proration import calculate_proration
from app.billing.schemas import (
    GenerateCycleInvoiceRequest,
    InvoiceResponse,
    PlanCreate,
    PlanResponse,
    ProrationPreviewResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    UpgradeRequest,
)
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/billing", tags=["Billing"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def _get_plan_or_404(db: Session, code: str) -> Plan:
    plan = db.query(Plan).filter(Plan.code == code, Plan.is_active.is_(True)).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{code}' not found")
    return plan


def _get_owned_subscription_or_404(db: Session, subscription_id: int, user: User) -> Subscription:
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if subscription.user_id != user.id and user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not your subscription")
    return subscription


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------

@router.post("/plans", response_model=PlanResponse)
def create_plan(payload: PlanCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    if db.query(Plan).filter(Plan.code == payload.code).first():
        raise HTTPException(status_code=400, detail="A plan with this code already exists")

    plan = Plan(
        code=payload.code,
        name=payload.name,
        monthly_price=payload.monthly_price,
        currency=payload.currency,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans", response_model=list[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return db.query(Plan).filter(Plan.is_active.is_(True)).all()


# ---------------------------------------------------------------------------
# Subscriptions
# ---------------------------------------------------------------------------

@router.post("/subscriptions", response_model=SubscriptionResponse)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = _get_plan_or_404(db, payload.plan_code)

    period_start = date.today()
    period_end = period_start + timedelta(days=30)

    subscription = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("/subscriptions/me", response_model=SubscriptionResponse)
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the current user's subscription. If they don't have one yet,
    auto-create one on the cheapest active plan — convenient for demos
    and first-time customer sign-in, where a subscription doesn't yet exist.
    """
    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
        .first()
    )
    if subscription:
        return subscription

    default_plan = (
        db.query(Plan)
        .filter(Plan.is_active.is_(True))
        .order_by(Plan.monthly_price.asc())
        .first()
    )
    if not default_plan:
        raise HTTPException(status_code=404, detail="No plans are configured yet")

    period_start = date.today()
    period_end = period_start + timedelta(days=30)
    subscription = Subscription(
        user_id=current_user.id,
        plan_id=default_plan.id,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_subscription_or_404(db, subscription_id, current_user)


# ---------------------------------------------------------------------------
# Proration + upgrade
# ---------------------------------------------------------------------------

@router.post("/subscriptions/{subscription_id}/proration-preview", response_model=ProrationPreviewResponse)
def preview_proration(
    subscription_id: int,
    payload: UpgradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show the customer what an upgrade/downgrade would cost right now, without committing it."""
    subscription = _get_owned_subscription_or_404(db, subscription_id, current_user)
    new_plan = _get_plan_or_404(db, payload.new_plan_code)
    old_plan = subscription.plan

    result = calculate_proration(
        old_plan_name=old_plan.name,
        old_plan_price=old_plan.monthly_price,
        new_plan_name=new_plan.name,
        new_plan_price=new_plan.monthly_price,
        period_start=subscription.current_period_start,
        period_end=subscription.current_period_end,
        change_date=payload.change_date,
    )
    return ProrationPreviewResponse(
        old_plan_name=result.old_plan_name,
        old_plan_price=result.old_plan_price,
        new_plan_name=result.new_plan_name,
        new_plan_price=result.new_plan_price,
        days_in_cycle=result.days_in_cycle,
        days_used=result.days_used,
        days_remaining=result.days_remaining,
        unused_credit=result.unused_credit,
        new_plan_charge=result.new_plan_charge,
        net_amount=result.net_amount,
    )


@router.post("/subscriptions/{subscription_id}/upgrade", response_model=InvoiceResponse)
def upgrade_subscription(
    subscription_id: int,
    payload: UpgradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change the subscription's plan mid-cycle and immediately bill the
    prorated difference as its own invoice. The billing cycle dates stay
    the same; the new plan's full price takes over from next cycle.
    """
    subscription = _get_owned_subscription_or_404(db, subscription_id, current_user)
    new_plan = _get_plan_or_404(db, payload.new_plan_code)
    old_plan = subscription.plan

    if new_plan.id == old_plan.id:
        raise HTTPException(status_code=400, detail="Already on this plan")

    proration = calculate_proration(
        old_plan_name=old_plan.name,
        old_plan_price=old_plan.monthly_price,
        new_plan_name=new_plan.name,
        new_plan_price=new_plan.monthly_price,
        period_start=subscription.current_period_start,
        period_end=subscription.current_period_end,
        change_date=payload.change_date,
    )

    # Invoice the proration difference immediately. Plan fee for the
    # (already-paid) old cycle isn't re-billed, so plan_price=0 here —
    # the proration credit/debit lines carry the actual amounts.
    invoice = generate_invoice(
        db=db,
        subscription=subscription,
        plan_name=new_plan.name,
        plan_price=Decimal("0"),
        period_start=subscription.current_period_start,
        period_end=subscription.current_period_end,
        proration=proration,
    )

    subscription.plan_id = new_plan.id
    db.commit()
    db.refresh(invoice)
    return invoice


# ---------------------------------------------------------------------------
# Invoice generation
# ---------------------------------------------------------------------------

@router.post("/subscriptions/{subscription_id}/generate-invoice", response_model=InvoiceResponse)
def generate_cycle_invoice(
    subscription_id: int,
    payload: GenerateCycleInvoiceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate the regular invoice for a subscription's current billing
    cycle: plan fee + any usage charges + tax. In production this would
    be triggered by a scheduled job at the end of each cycle.
    """
    subscription = _get_owned_subscription_or_404(db, subscription_id, current_user)
    plan = subscription.plan

    usage_charges = [
        UsageCharge(description=u.description, amount=u.amount, quantity=u.quantity)
        for u in payload.usage_charges
    ]

    kwargs = {}
    if payload.tax_rate is not None:
        kwargs["tax_rate"] = payload.tax_rate

    invoice = generate_invoice(
        db=db,
        subscription=subscription,
        plan_name=plan.name,
        plan_price=plan.monthly_price,
        period_start=subscription.current_period_start,
        period_end=subscription.current_period_end,
        usage_charges=usage_charges,
        **kwargs,
    )
    return invoice


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not your invoice")
    return invoice


@router.get("/invoices", response_model=list[InvoiceResponse])
def list_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Invoice).filter(Invoice.user_id == current_user.id).order_by(Invoice.id.desc()).all()