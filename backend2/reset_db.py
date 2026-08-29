"""
Development Database Reset Script
---------------------------------
Safely removes all CUSTOMER test data:
- Customer users and profiles
- Customer subscriptions
- Payments
- Invoices and invoice line items
- Refunds
- Notifications
- Revoked tokens

Preserves:
- Administrator account & credentials
- Plans catalog and pricing
- System settings and database schema

Usage:
    python reset_db.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import User, RevokedToken, Ticket, TicketMessage
from app.payment_models import Payment, Refund, Notification
from app.billing.models import Plan, Subscription, Invoice, InvoiceLineItem
from seed_admin import seed_admin

def reset_customer_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[reset_db] Starting safe customer data reset...")

        # 0. Delete Tickets and Messages
        deleted_msgs = db.query(TicketMessage).delete()
        deleted_tcks = db.query(Ticket).delete()
        print(f"[reset_db] Deleted {deleted_tcks} tickets and {deleted_msgs} ticket messages.")

        # 1. Delete Refunds
        deleted_refunds = db.query(Refund).delete()
        print(f"[reset_db] Deleted {deleted_refunds} refunds.")


        # 2. Delete Invoice Line Items
        deleted_line_items = db.query(InvoiceLineItem).delete()
        print(f"[reset_db] Deleted {deleted_line_items} invoice line items.")

        # 3. Delete Invoices
        deleted_invoices = db.query(Invoice).delete()
        print(f"[reset_db] Deleted {deleted_invoices} invoices.")

        # 4. Delete Payments
        deleted_payments = db.query(Payment).delete()
        print(f"[reset_db] Deleted {deleted_payments} payments.")

        # 5. Delete Subscriptions
        deleted_subs = db.query(Subscription).delete()
        print(f"[reset_db] Deleted {deleted_subs} subscriptions.")

        # 6. Delete Notifications
        deleted_notifs = db.query(Notification).delete()
        print(f"[reset_db] Deleted {deleted_notifs} notifications.")

        # 7. Delete Revoked Tokens
        deleted_tokens = db.query(RevokedToken).delete()
        print(f"[reset_db] Deleted {deleted_tokens} revoked tokens.")

        # 8. Delete Customer Users (Preserve Admin!)
        deleted_users = db.query(User).filter(User.role != "Admin").delete()
        print(f"[reset_db] Deleted {deleted_users} customer accounts.")

        db.commit()

        # Ensure Admin is present
        seed_admin()

        # Verify final state
        remaining_customers = db.query(User).filter(User.role == "Customer").count()
        remaining_admins = db.query(User).filter(User.role == "Admin").count()
        print(f"[reset_db] Complete! Customers in DB: {remaining_customers}, Admins in DB: {remaining_admins}")

    except Exception as exc:
        db.rollback()
        print(f"[reset_db] ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    reset_customer_data()
