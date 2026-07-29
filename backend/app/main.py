from fastapi import FastAPI
from app.config import settings

app = FastAPI()


@app.get("/")
def root():
    return {
        "database": settings.DATABASE_URL,
        "algorithm": settings.ALGORITHM,
        "expires": settings.ACCESS_TOKEN_EXPIRE_MINUTES
    }