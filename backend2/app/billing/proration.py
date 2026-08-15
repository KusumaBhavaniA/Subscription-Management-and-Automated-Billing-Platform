"""
Proration calculation for mid-cycle plan changes.

When a customer upgrades (or downgrades) partway through a billing cycle,
we owe them credit for the unused portion of their OLD plan, and we need
to charge them for the NEW plan for the remaining days of that same cycle.

Method: daily proration.
    daily_rate   = monthly_price / days_in_cycle
    unused_credit = old_plan_daily_rate * days_remaining
    new_charge    = new_plan_daily_rate * days_remaining
    net_amount    = new_charge - unused_credit

net_amount > 0  -> customer owes more right now (upgrade)
net_amount < 0  -> customer is owed a credit right now (downgrade)

All money math uses Decimal, never float, to avoid rounding errors that
compound over many invoices.
"""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional, Union

TWO_PLACES = Decimal("0.01")


def _round_money(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _as_date(value: Union[date, datetime]) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value


@dataclass
class ProrationResult:
    period_start: date
    period_end: date
    change_date: date

    days_in_cycle: int
    days_used: int
    days_remaining: int

    old_plan_name: str
    old_plan_price: Decimal
    old_plan_daily_rate: Decimal
    unused_credit: Decimal  # positive number; this is a CREDIT (reduces the bill)

    new_plan_name: str
    new_plan_price: Decimal
    new_plan_daily_rate: Decimal
    new_plan_charge: Decimal  # positive number; charge for the new plan's remaining days

    net_amount: Decimal  # new_plan_charge - unused_credit


def calculate_proration(
    old_plan_name: str,
    old_plan_price: Decimal,
    new_plan_name: str,
    new_plan_price: Decimal,
    period_start: Union[date, datetime],
    period_end: Union[date, datetime],
    change_date: Optional[Union[date, datetime]] = None,
) -> ProrationResult:
    """
    Compute the prorated credit/charge for a plan change within a
    billing cycle.

    period_start / period_end define the current billing cycle.
    change_date is the day the upgrade/downgrade happens; defaults to
    today and must fall within [period_start, period_end].
    """
    period_start = _as_date(period_start)
    period_end = _as_date(period_end)
    change_date = _as_date(change_date) if change_date else date.today()

    if period_end <= period_start:
        raise ValueError("period_end must be after period_start")

    if change_date < period_start or change_date > period_end:
        raise ValueError("change_date must fall within the current billing period")

    old_plan_price = Decimal(str(old_plan_price))
    new_plan_price = Decimal(str(new_plan_price))

    days_in_cycle = (period_end - period_start).days
    days_used = (change_date - period_start).days
    days_remaining = days_in_cycle - days_used

    old_daily_rate = old_plan_price / Decimal(days_in_cycle)
    new_daily_rate = new_plan_price / Decimal(days_in_cycle)

    unused_credit = _round_money(old_daily_rate * Decimal(days_remaining))
    new_plan_charge = _round_money(new_daily_rate * Decimal(days_remaining))
    net_amount = _round_money(new_plan_charge - unused_credit)

    return ProrationResult(
        period_start=period_start,
        period_end=period_end,
        change_date=change_date,
        days_in_cycle=days_in_cycle,
        days_used=days_used,
        days_remaining=days_remaining,
        old_plan_name=old_plan_name,
        old_plan_price=old_plan_price,
        old_plan_daily_rate=_round_money(old_daily_rate),
        unused_credit=unused_credit,
        new_plan_name=new_plan_name,
        new_plan_price=new_plan_price,
        new_plan_daily_rate=_round_money(new_daily_rate),
        new_plan_charge=new_plan_charge,
        net_amount=net_amount,
    )