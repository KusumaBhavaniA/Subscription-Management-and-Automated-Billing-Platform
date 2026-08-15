from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.auth.oauth import router as oauth_router
from app.billing.routes import router as billing_router
from app.billing import models as billing_models  # noqa: F401 — registers billing tables with Base

from app.database import engine, Base
from app.routers.payment import router as payment_router

import app.models
import app.payment_models

from sqlalchemy import inspect, text

Base.metadata.create_all(bind=engine)


def ensure_db_schema():
    try:
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("users")]
            with engine.begin() as conn:
                if "account_status" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR DEFAULT 'ACTIVE' NOT NULL"))
                if "deleted_at" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP"))
                if "deleted_by" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN deleted_by VARCHAR"))
                if "suspended_at" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP"))
                if "suspended_by" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN suspended_by VARCHAR"))
                if "suspension_reason" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN suspension_reason TEXT"))
    except Exception as e:
        print("ensure_db_schema error:", e)


ensure_db_schema()

app = FastAPI(
    title="Subscription Management API",
    description="Authentication and subscription management backend.",
    version="1.0.0",
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(billing_router)
app.include_router(payment_router)


@app.on_event("startup")
def seed_demo_plans() -> None:
    """
    Seed a few demo plans if none exist yet, so the billing demo works
    out of the box without requiring a separate admin setup step.

    Wrapped defensively: if migrations haven't been run yet (billing
    tables don't exist), we log a warning instead of crashing the whole
    app on startup — auth and everything else should still come up.
    """
    from decimal import Decimal

    from app.billing.models import Plan
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        if db.query(Plan).count() == 0:
            db.add_all(
                [
                    Plan(code="starter", name="Starter", monthly_price=Decimal("10.00")),
                    Plan(code="growth", name="Growth", monthly_price=Decimal("20.00")),
                    Plan(code="pro", name="Pro", monthly_price=Decimal("30.00")),
                ]
            )
            db.commit()
    except Exception as exc:
        logger.warning(
            "Skipped demo plan seeding (likely need to run `alembic upgrade head` first): %s",
            exc,
        )
        db.rollback()
    finally:
        db.close()


@app.on_event("startup")
def startup_smtp_diagnostics():
    from app.config import settings
    logger.info("=== [SMTP CONFIGURATION DIAGNOSTICS] ===")
    logger.info("SMTP_HOST configured    : %s (%s)", "YES" if settings.SMTP_HOST else "NO", settings.SMTP_HOST)
    logger.info("SMTP_PORT configured    : %s (%s)", "YES" if settings.SMTP_PORT else "NO", settings.SMTP_PORT)
    logger.info("SMTP_USER configured    : %s", "YES" if bool(settings.SMTP_USER and settings.SMTP_USER.strip()) else "NO")
    logger.info("SMTP_PASSWORD configured: %s", "YES" if bool(settings.SMTP_PASSWORD and settings.SMTP_PASSWORD.strip()) else "NO")
    logger.info("EMAIL_FROM configured   : %s", "YES" if bool(settings.EMAIL_FROM and settings.EMAIL_FROM.strip()) else "NO")
    logger.info("=========================================")


@app.get("/")
def root():
    return {"message": "Backend running"}