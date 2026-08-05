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


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )

        user_id = payload.get("sub")
        token_id = payload.get("jti")

        if user_id is None or token_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


    if db.query(RevokedToken).filter(RevokedToken.jti == token_id).first():
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()


    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated")

    return user
