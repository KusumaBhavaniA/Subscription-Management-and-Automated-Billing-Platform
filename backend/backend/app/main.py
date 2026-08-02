from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.routers.customer import router as customer_router
from app.routers.plan import router as plan_router

from app.database import engine
from app.base import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Subscription Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(customer_router)
app.include_router(plan_router)

@app.get("/")
def root():
    return {"message": "Backend running"}