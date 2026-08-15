from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP


def _utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def calculate_unused_refund(
    amount: Decimal,
    period_start: datetime,
    period_end: datetime,
    cancelled_at: datetime,
) -> tuple[Decimal, float]:
    """
    Calculate a straight-line refund for the unused part of a billing period.

    Example:
      ₹1000 plan, 1 Aug -> 31 Aug, cancelled 16 Aug
      refund = ₹1000 * remaining_seconds / total_seconds
    """
    start = _utc(period_start)
    end = _utc(period_end)
    cancelled = _utc(cancelled_at)

    if end <= start:
        raise ValueError("Billing period end must be after period start.")

    if cancelled <= start:
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), 100.0

    if cancelled >= end:
        return Decimal("0.00"), 0.0

    total_seconds = Decimal(str((end - start).total_seconds()))
    unused_seconds = Decimal(str((end - cancelled).total_seconds()))
    percentage = float((unused_seconds / total_seconds) * Decimal("100"))

    refund = (amount * unused_seconds / total_seconds).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    return refund, round(percentage, 2)
