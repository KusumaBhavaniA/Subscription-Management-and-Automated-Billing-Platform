"""
Best-effort bridge to the invoice/subscription tables owned by the billing module.

The current project snapshot does not yet contain those backend models. This
helper updates them only when the corresponding tables exist. After the
teammate's invoice/subscription implementation is merged, this file can be
tightened to those exact ORM models without changing the payment API.
"""

from sqlalchemy import MetaData, Table, inspect, select, update
from sqlalchemy.orm import Session

from app.database import engine


def _table(name: str):
    inspector = inspect(engine)
    if name not in inspector.get_table_names():
        return None
    return Table(name, MetaData(), autoload_with=engine)


def _status_value(db: Session, table: Table, row_id: int, status: str) -> str:
    """
    Match the existing status casing when possible.

    This keeps the payment module compatible with either backend convention:
    "paid"/"failed"/"active" or "Paid"/"Failed"/"Active".
    """
    if "status" not in table.c:
        return status.lower()

    row = db.execute(
        select(table.c.status).where(table.c.id == row_id)
    ).first()

    current = row[0] if row else None
    if isinstance(current, str) and current[:1].isupper():
        return status.title()
    return status.lower()


def update_invoice_status(db: Session, invoice_id: int | None, status: str) -> bool:
    if invoice_id is None:
        return False

    table = _table("invoices")
    if table is None or "id" not in table.c or "status" not in table.c:
        return False

    value = _status_value(db, table, invoice_id, status)
    result = db.execute(
        update(table)
        .where(table.c.id == invoice_id)
        .values(status=value)
    )
    return result.rowcount > 0


def update_subscription_status(
    db: Session,
    subscription_id: int | None,
    status: str,
) -> bool:
    if subscription_id is None:
        return False

    table = _table("subscriptions")
    if table is None or "id" not in table.c or "status" not in table.c:
        return False

    value = _status_value(db, table, subscription_id, status)
    result = db.execute(
        update(table)
        .where(table.c.id == subscription_id)
        .values(status=value)
    )
    return result.rowcount > 0


def resolve_subscription_id_from_invoice(
    db: Session,
    invoice_id: int | None,
) -> int | None:
    if invoice_id is None:
        return None

    table = _table("invoices")
    if table is None or "id" not in table.c or "subscription_id" not in table.c:
        return None

    row = db.execute(
        select(table.c.subscription_id).where(table.c.id == invoice_id)
    ).first()
    return row[0] if row else None


def create_refund_line_item(
    db: Session,
    invoice_id: int | None,
    amount,
    reason: str,
) -> bool:
    """
    Add a negative refund adjustment to the invoice's line-item table when the
    teammate's invoice implementation exposes one.

    Supported conventional table names: invoice_line_items, invoice_items.
    """
    if invoice_id is None:
        return False

    table = None
    for name in ("invoice_line_items", "invoice_items"):
        table = _table(name)
        if table is not None:
            break

    if table is None:
        return False

    required = {"invoice_id", "amount"}
    if not required.issubset(set(table.c.keys())):
        return False

    values = {
        "invoice_id": invoice_id,
        "amount": -abs(amount),
    }

    if "description" in table.c:
        values["description"] = f"Refund - {reason}"
    if "quantity" in table.c:
        values["quantity"] = 1
    if "unit_price" in table.c:
        values["unit_price"] = -abs(amount)

    db.execute(table.insert().values(**values))
    return True
