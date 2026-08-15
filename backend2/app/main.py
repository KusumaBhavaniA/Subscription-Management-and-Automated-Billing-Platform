from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.auth.oauth import router as oauth_router
from app.billing.routes import router as billing_router
from app.billing import models as billing_models  # noqa: F401 — registers tables with Base

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

app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(billing_router)


@app.on_event("startup")
def seed_demo_plans() -> None:
    """
    Seed a few demo plans if none exist yet, so the billing demo works
    out of the box without requiring a separate admin setup step.

    Wrapped defensively: if migrations haven't been run yet (billing
    tables don't exist), we log a warning instead of crashing the whole
    app on startup — auth and everything else should still come up.
    """
    import logging
    from decimal import Decimal

    from app.billing.models import Plan
    from app.database import SessionLocal

    logger = logging.getLogger(__name__)
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


@app.get("/")
def root():
    return {"message": "Backend running"}