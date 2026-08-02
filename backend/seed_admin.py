"""
Admin user seeder
-----------------
Run once to create the default admin account in the database.

Usage (from the backend/ directory):
    python seed_admin.py

The script is idempotent — running it again when the admin already exists
will print a message and exit without making any changes.

Default credentials (change the constants below or pass env vars before running):
    Email    : admin@billingplatform.com
    Password : Admin@123
"""

import sys
import os

# Ensure app package is importable when running the script directly
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from backend.app.models_backup import User
from app.auth.password import hash_password

# ---------------------------------------------------------------------------
# Admin credentials — edit these before first run or set as env vars
# ---------------------------------------------------------------------------
ADMIN_FIRST_NAME = os.getenv("ADMIN_FIRST_NAME", "System")
ADMIN_LAST_NAME  = os.getenv("ADMIN_LAST_NAME",  "Administrator")
ADMIN_EMAIL      = os.getenv("ADMIN_EMAIL",      "admin@billingplatform.com")
ADMIN_PASSWORD   = os.getenv("ADMIN_PASSWORD",   "Admin@123")
# ---------------------------------------------------------------------------


def seed_admin() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if existing:
            if existing.role == "Admin":
                print(f"[seed_admin] Admin already exists: {ADMIN_EMAIL} — nothing to do.")
            else:
                # Existing user found but is not an admin — promote
                existing.role = "Admin"
                existing.is_verified = True
                db.commit()
                print(f"[seed_admin] Promoted existing user to Admin: {ADMIN_EMAIL}")
            return

        admin = User(
            first_name=ADMIN_FIRST_NAME,
            last_name=ADMIN_LAST_NAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role="Admin",
            is_verified=True,   # admin accounts skip email verification
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(
            f"[seed_admin] Admin created successfully.\n"
            f"  ID    : {admin.id}\n"
            f"  Email : {admin.email}\n"
            f"  Role  : {admin.role}\n"
            f"\n"
            f"  !! Change the password after first login !!"
        )

    except Exception as exc:
        db.rollback()
        print(f"[seed_admin] ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
