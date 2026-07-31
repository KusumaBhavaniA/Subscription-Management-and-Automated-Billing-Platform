from fastapi import FastAPI

from app.routers import customer, plan
from app.database import engine
from app.base import Base
from app.models.plan import Plan

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(customer.router)
app.include_router(plan.router)