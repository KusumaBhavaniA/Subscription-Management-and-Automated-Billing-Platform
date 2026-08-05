from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.auth.oauth import router as oauth_router

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


@app.get("/")
def root():
    return {"message": "Backend running"}