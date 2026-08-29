from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.auth.oauth import router as oauth_router
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
                if "state" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN state VARCHAR"))
                if "city" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN city VARCHAR"))
                if "zip_code" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN zip_code VARCHAR"))
                if "address" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN address VARCHAR"))

        if "plans" in inspector.get_table_names():
            plan_columns = [c["name"] for c in inspector.get_columns("plans")]
            with engine.begin() as conn:
                if "description" not in plan_columns:
                    conn.execute(text("ALTER TABLE plans ADD COLUMN description TEXT"))
                if "quarterly_price" not in plan_columns:
                    conn.execute(text("ALTER TABLE plans ADD COLUMN quarterly_price NUMERIC(12, 2)"))
                if "yearly_price" not in plan_columns:
                    conn.execute(text("ALTER TABLE plans ADD COLUMN yearly_price NUMERIC(12, 2)"))
                if "features" not in plan_columns:
                    conn.execute(text("ALTER TABLE plans ADD COLUMN features TEXT"))
                if "is_popular" not in plan_columns:
                    conn.execute(text("ALTER TABLE plans ADD COLUMN is_popular BOOLEAN DEFAULT 0"))

        if "subscriptions" in inspector.get_table_names():
            sub_columns = [c["name"] for c in inspector.get_columns("subscriptions")]
            with engine.begin() as conn:
                if "next_plan_id" not in sub_columns:
                    conn.execute(text("ALTER TABLE subscriptions ADD COLUMN next_plan_id INTEGER"))
                if "billing_cycle" not in sub_columns:
                    conn.execute(text("ALTER TABLE subscriptions ADD COLUMN billing_cycle VARCHAR DEFAULT 'Monthly'"))
                if "price" not in sub_columns:
                    conn.execute(text("ALTER TABLE subscriptions ADD COLUMN price NUMERIC(12, 2) DEFAULT 0"))

        if "invoices" in inspector.get_table_names():
            inv_columns = [c["name"] for c in inspector.get_columns("invoices")]
            with engine.begin() as conn:
                if "payment_reference" not in inv_columns:
                    conn.execute(text("ALTER TABLE invoices ADD COLUMN payment_reference VARCHAR"))
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
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
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

from app.routers.billing_routes import router as billing_router

app.include_router(billing_router)
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(payment_router)


@app.on_event("startup")
def startup_events():
    from app.config import settings
    from seed_admin import seed_admin
    try:
        seed_admin()
    except Exception as exc:
        logger.warning("seed_admin on startup notice: %s", exc)

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