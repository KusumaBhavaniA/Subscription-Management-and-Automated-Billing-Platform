from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.payment_models import Notification, Payment, Refund
from app.schemas.payment import (
    PaymentProcessRequest,
    PaymentResponse,
    PaymentWebhookRequest,
    RefundRequest,
    RefundResponse,
)
from app.services.billing_sync import (
    create_refund_line_item,
    resolve_subscription_id_from_invoice,
    update_invoice_status,
    update_subscription_status,
)
from app.services.payment_gateway import (
    decide_payment_success,
    generate_event_id,
    generate_payment_id,
    send_payment_webhook,
)
from app.services.refund_service import calculate_unused_refund

router = APIRouter(tags=["Payments"])


def _notification(
    db: Session,
    *,
    customer_email: str | None,
    user_id: int | None,
    title: str,
    message: str,
    notification_type: str,
) -> None:
    db.add(
        Notification(
            user_id=user_id,
            customer_email=customer_email,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False,
        )
    )


@router.post("/payments/process", response_model=PaymentResponse)
async def process_mock_payment(
    payload: PaymentProcessRequest,
    db: Session = Depends(get_db),
):
    payment_id = generate_payment_id()
    success = decide_payment_success(payload.simulate_failure)

    payment = Payment(
        payment_id=payment_id,
        invoice_id=payload.invoice_id,
        subscription_id=payload.subscription_id,
        customer_id=payload.customer_id,
        customer_email=payload.customer_email,
        amount=payload.amount,
        currency=payload.currency.upper(),
        payment_method=payload.payment_method,
        status="paid" if success else "failed",
        failure_reason=None if success else "Mock gateway payment declined",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    event = "payment_paid" if success else "payment_failed"
    webhook_payload = {
        "event_id": generate_event_id(),
        "event": event,
        "payment_id": payment.payment_id,
        "invoice_id": payment.invoice_id,
        "subscription_id": payment.subscription_id,
        "customer_id": payment.customer_id,
        "customer_email": payment.customer_email,
        "amount": float(payment.amount),
        "currency": payment.currency,
        "failure_reason": payment.failure_reason,
    }

    webhook_sent = await send_payment_webhook(webhook_payload)

    return PaymentResponse(
        payment_id=payment.payment_id,
        invoice_id=payment.invoice_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        failure_reason=payment.failure_reason,
        webhook_sent=webhook_sent,
    )


@router.post("/webhooks/payment")
def payment_webhook(
    payload: PaymentWebhookRequest,
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(
        Payment.payment_id == payload.payment_id
    ).first()

    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = {
        "payment_paid": "paid",
        "payment_failed": "failed",
        "payment_refunded": "refunded",
    }[payload.event]

    if payload.failure_reason:
        payment.failure_reason = payload.failure_reason

    invoice_id = payload.invoice_id or payment.invoice_id
    subscription_id = (
        payload.subscription_id
        or payment.subscription_id
        or resolve_subscription_id_from_invoice(db, invoice_id)
    )

    invoice_updated = False
    subscription_updated = False

    if payload.event == "payment_paid":
        invoice_updated = update_invoice_status(db, invoice_id, "paid")
        subscription_updated = update_subscription_status(
            db, subscription_id, "active"
        )
        _notification(
            db,
            customer_email=payload.customer_email or payment.customer_email,
            user_id=payload.customer_id or payment.customer_id,
            title="Payment Successful",
            message=f"Payment {payment.payment_id} of {payment.currency} {payment.amount} was received successfully.",
            notification_type="success",
        )

    elif payload.event == "payment_failed":
        invoice_updated = update_invoice_status(db, invoice_id, "failed")
        _notification(
            db,
            customer_email=payload.customer_email or payment.customer_email,
            user_id=payload.customer_id or payment.customer_id,
            title="Payment Failed",
            message=f"Payment {payment.payment_id} failed. Please retry the payment.",
            notification_type="error",
        )

    else:
        invoice_updated = update_invoice_status(db, invoice_id, "refunded")
        _notification(
            db,
            customer_email=payload.customer_email or payment.customer_email,
            user_id=payload.customer_id or payment.customer_id,
            title="Payment Refunded",
            message=f"Refund for payment {payment.payment_id} has been processed.",
            notification_type="info",
        )

    db.commit()

    return {
        "success": True,
        "event_id": payload.event_id,
        "event": payload.event,
        "payment_id": payment.payment_id,
        "invoice_updated": invoice_updated,
        "subscription_updated": subscription_updated,
    }


@router.post("/payments/refund", response_model=RefundResponse)
async def process_refund(
    payload: RefundRequest,
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(
        Payment.payment_id == payload.payment_id
    ).first()

    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status not in {"paid", "refunded"}:
        raise HTTPException(
            status_code=400,
            detail="Only a successful payment can be refunded.",
        )

    if payment.status == "refunded":
        raise HTTPException(status_code=400, detail="Payment is already refunded.")

    refund_amount = payload.amount
    refund_percentage = None

    if refund_amount is None:
        if not (
            payload.period_start
            and payload.period_end
            and payload.cancelled_at
        ):
            raise HTTPException(
                status_code=400,
                detail="Provide amount or all billing-period dates to calculate the unused-period refund.",
            )

        try:
            refund_amount, refund_percentage = calculate_unused_refund(
                Decimal(str(payment.amount)),
                payload.period_start,
                payload.period_end,
                payload.cancelled_at,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    refund_amount = Decimal(str(refund_amount))

    if refund_amount > Decimal(str(payment.amount)):
        raise HTTPException(
            status_code=400,
            detail="Refund cannot exceed the original payment amount.",
        )

    refund_id = f"REF-{generate_payment_id().replace('PAY-', '')}"

    refund = Refund(
        refund_id=refund_id,
        payment_id=payment.payment_id,
        invoice_id=payload.invoice_id or payment.invoice_id,
        subscription_id=payload.subscription_id or payment.subscription_id,
        amount=refund_amount,
        currency=payment.currency,
        reason=payload.reason,
        status="refunded",
        period_start=payload.period_start,
        period_end=payload.period_end,
        cancelled_at=payload.cancelled_at,
    )

    db.add(refund)
    payment.status = "refunded"
    refund_line_item_created = create_refund_line_item(
        db,
        refund.invoice_id,
        refund.amount,
        refund.reason or "Unused billing period",
    )
    db.commit()
    db.refresh(refund)

    webhook_payload = {
        "event_id": generate_event_id(),
        "event": "payment_refunded",
        "payment_id": payment.payment_id,
        "invoice_id": refund.invoice_id,
        "subscription_id": refund.subscription_id,
        "customer_email": payment.customer_email,
        "amount": float(refund.amount),
        "currency": refund.currency,
    }

    webhook_sent = await send_payment_webhook(webhook_payload)

    return RefundResponse(
        refund_id=refund.refund_id,
        payment_id=refund.payment_id,
        amount=refund.amount,
        currency=refund.currency,
        status="refunded",
        refund_percentage=refund_percentage,
        webhook_sent=webhook_sent,
        refund_line_item_created=refund_line_item_created,
    )


@router.get("/payments/{payment_id}")
def get_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {
        "payment_id": payment.payment_id,
        "invoice_id": payment.invoice_id,
        "subscription_id": payment.subscription_id,
        "customer_email": payment.customer_email,
        "amount": float(payment.amount),
        "currency": payment.currency,
        "payment_method": payment.payment_method,
        "status": payment.status,
        "failure_reason": payment.failure_reason,
        "created_at": payment.created_at,
    }
