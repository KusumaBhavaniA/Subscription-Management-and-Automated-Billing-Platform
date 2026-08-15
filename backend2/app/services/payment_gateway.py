import random
import uuid
from decimal import Decimal
from typing import Any

import httpx

from app.config import settings


def generate_payment_id() -> str:
    return f"PAY-{uuid.uuid4().hex[:12].upper()}"


def generate_event_id() -> str:
    return f"EVT-{uuid.uuid4().hex[:16].upper()}"


async def send_payment_webhook(payload: dict[str, Any]) -> bool:
    """
    Send a payment event to the billing webhook endpoint.

    The default URL points back to this FastAPI application. In deployment,
    PAYMENT_WEBHOOK_URL can be changed to the billing service URL.
    """
    try:
        async with httpx.AsyncClient(timeout=settings.PAYMENT_WEBHOOK_TIMEOUT_SECONDS) as client:
            response = await client.post(
                settings.PAYMENT_WEBHOOK_URL,
                json=payload,
                headers={"X-Payment-Gateway": "mock-gateway"},
            )
            return 200 <= response.status_code < 300
    except Exception:
        return False


def decide_payment_success(simulate_failure: bool = False) -> bool:
    if simulate_failure:
        return False
    return random.random() < settings.PAYMENT_SUCCESS_RATE


def serialize_amount(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.01")))
