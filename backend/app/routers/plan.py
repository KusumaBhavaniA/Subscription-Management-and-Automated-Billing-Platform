from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import get_db
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanRead, PlanUpdate

router = APIRouter(
    prefix="/plans",
    tags=["Plans"]
)


@router.post("/", response_model=PlanRead)
def create_plan(
    plan: PlanCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Plan).filter(
        Plan.name == plan.name,
        Plan.is_deleted == False
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Plan already exists"
        )

    if plan.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0"
        )

    if plan.trial_days < 0:
        raise HTTPException(
            status_code=400,
            detail="Trial days cannot be negative"
        )

    if plan.interval.lower() not in [
        "monthly",
        "yearly"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Interval must be monthly or yearly"
        )

    new_plan = Plan(**plan.model_dump())

    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return new_plan


@router.get("/", response_model=list[PlanRead])
def get_plans(db: Session = Depends(get_db)):

    return db.query(Plan).filter(
    Plan.is_deleted == False
).all()

@router.get("/{plan_id}", response_model=PlanRead)
def get_plan(plan_id: int, db: Session = Depends(get_db)):

    plan = (
        db.query(Plan)
        .filter(
            Plan.id == plan_id,
            Plan.is_deleted == False
        )
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    return plan


@router.put("/{plan_id}", response_model=PlanRead)
def update_plan(
    plan_id: int,
    updated_plan: PlanUpdate,
    db: Session = Depends(get_db)
):

    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    # Duplicate name validation
    if updated_plan.name:

        existing = db.query(Plan).filter(
            Plan.name == updated_plan.name,
            Plan.id != plan_id,
            Plan.is_deleted == False
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Plan name already exists"
            )

    # Price validation
    if updated_plan.price is not None:
        if updated_plan.price <= 0:
            raise HTTPException(
                status_code=400,
                detail="Price must be greater than 0"
            )

    # Trial validation
    if updated_plan.trial_days is not None:
        if updated_plan.trial_days < 0:
            raise HTTPException(
                status_code=400,
                detail="Trial days cannot be negative"
            )

    # Interval validation
    if updated_plan.interval is not None:
        if updated_plan.interval.lower() not in [
            "monthly",
            "yearly"
        ]:
            raise HTTPException(
                status_code=400,
                detail="Interval must be monthly or yearly"
            )

    update_data = updated_plan.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(plan, key, value)

    db.commit()
    db.refresh(plan)

    return plan

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):

    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    plan.is_deleted = True

    db.commit()

    return {
        "message": "Plan deleted successfully"
    }

@router.put("/{plan_id}/activate")
def activate_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):

    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    plan.active = True

    db.commit()

    return {
        "message": "Plan activated successfully"
    }

@router.put("/{plan_id}/deactivate")
def deactivate_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):

    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    plan.active = False

    db.commit()

    return {
        "message": "Plan deactivated successfully"
    }

@router.get("/search/")
def search_plan(
    keyword: str,
    db: Session = Depends(get_db)
):

    plans = db.query(Plan).filter(
        Plan.name.ilike(f"%{keyword}%"),
        Plan.is_deleted == False
    ).all()

    return plans

@router.get("/active/")
def active_plans(
    db: Session = Depends(get_db)
):

    return db.query(Plan).filter(
        Plan.active == True,
        Plan.is_deleted == False
    ).all()

@router.get("/stats")
def plan_statistics(
    db: Session = Depends(get_db)
):

    total = db.query(Plan).filter(
        Plan.is_deleted == False
    ).count()

    active = db.query(Plan).filter(
        Plan.active == True,
        Plan.is_deleted == False
    ).count()

    inactive = db.query(Plan).filter(
        Plan.active == False,
        Plan.is_deleted == False
    ).count()

    return {
        "total_plans": total,
        "active_plans": active,
        "inactive_plans": inactive
    }

@router.get("/page")
def get_plan_page(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):

    skip = (page - 1) * limit

    return db.query(Plan).filter(
        Plan.is_deleted == False
    ).offset(skip).limit(limit).all()

