from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RevokedToken, User
from app.config import settings


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user_id = None
    token_id = None
    email_claim = None

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False, "verify_iss": False},
        )
        user_id = payload.get("sub")
        token_id = payload.get("jti")
        email_claim = payload.get("email")
    except Exception:
        pass

    if token_id and db.query(RevokedToken).filter(RevokedToken.jti == token_id).first():
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user = None
    if user_id is not None:
        if str(user_id).isdigit():
            user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            user = db.query(User).filter(User.email == str(user_id).lower()).first()

    if not user and email_claim:
        user = db.query(User).filter(User.email == str(email_claim).lower()).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Your session has expired. Please log in again."
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated")

    return user


def get_optional_current_user(
    token: str = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
):
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except Exception:
        return None


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user or getattr(current_user, "role", "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required.")
    return current_user


