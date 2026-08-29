from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_ISSUER: str = "subscription-management-api"
    JWT_AUDIENCE: str = "subscription-management-frontend"

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "NexFlow"
    SMTP_TIMEOUT_SECONDS: int = 15

    # Frontend base URL — used in password reset links and OAuth redirects
    FRONTEND_URL: str = "http://localhost:3000"

    # Backend base URL — used to build OAuth callback URLs
    BACKEND_URL: str = "http://localhost:8000"
    ENVIRONMENT: str = "development"

    # Mock payment gateway
    PAYMENT_SUCCESS_RATE: float = Field(default=0.80, ge=0.0, le=1.0)
    PAYMENT_WEBHOOK_URL: str = "http://localhost:8000/webhooks/payment"
    PAYMENT_WEBHOOK_TIMEOUT_SECONDS: float = 5.0

    # OTP expiry in minutes
    OTP_EXPIRE_MINUTES: int = 10

    # Password reset token expiry in minutes
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # ---------------------------------------------------------------------------
    # Google OAuth 2.0
    # ---------------------------------------------------------------------------
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # ---------------------------------------------------------------------------
    # Microsoft OAuth 2.0  (Azure AD v2 / Entra ID)
    # ---------------------------------------------------------------------------
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    # Tenant can be "common", "organizations", "consumers", or a specific tenant ID
    MICROSOFT_TENANT: str = "common"

    # ---------------------------------------------------------------------------
    # Apple Sign In
    # ---------------------------------------------------------------------------
    APPLE_CLIENT_ID: str = ""       # Your Services ID (e.g. com.yourapp.signin)
    APPLE_TEAM_ID: str = ""         # 10-char team ID from developer.apple.com
    APPLE_KEY_ID: str = ""          # Key ID of your Sign in with Apple private key
    APPLE_PRIVATE_KEY: str = ""     # Contents of the .p8 file (newlines as \n)

    model_config = SettingsConfigDict(
        # Resolve relative to backend/, not the shell directory used to start Uvicorn.
        env_file=BACKEND_DIR / ".env",
        extra="ignore",
    )


settings = Settings()
