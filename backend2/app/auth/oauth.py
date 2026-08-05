import json
import secrets
import logging
import time
from urllib.parse import urlencode

import httpx
import jwt as pyjwt                          # PyJWT — for Apple client_secret
from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import RedirectResponse, JSONResponse
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.auth.jwt import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["OAuth"])

# ---------------------------------------------------------------------------
# CSRF state cookie
# ---------------------------------------------------------------------------

_signer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="oauth-state")
_STATE_COOKIE  = "oauth_state"
_STATE_MAX_AGE = 600  # 10 minutes


def _set_state_cookie(response: RedirectResponse, state: str) -> None:
    response.set_cookie(
        key=_STATE_COOKIE,
        value=_signer.dumps(state),
        max_age=_STATE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=settings.BACKEND_URL.startswith("https://"),
        path="/auth",
    )


def _clear_state_cookie(response: RedirectResponse) -> None:
    response.delete_cookie(key=_STATE_COOKIE, path="/auth")


def _validate_state(request: Request, returned_state: str) -> None:
    cookie_val = request.cookies.get(_STATE_COOKIE)
    if not cookie_val:
        raise HTTPException(status_code=400, detail="OAuth state cookie missing.")
    try:
        original_state = _signer.loads(cookie_val, max_age=_STATE_MAX_AGE)
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="OAuth state expired. Please try again.")
    except BadSignature:
        raise HTTPException(status_code=400, detail="OAuth state invalid.")
    if not secrets.compare_digest(original_state, returned_state):
        raise HTTPException(status_code=400, detail="OAuth state mismatch.")


# ---------------------------------------------------------------------------
# User upsert — shared by all three providers
# ---------------------------------------------------------------------------

def _upsert_oauth_user(
    db: Session,
    *,
    provider: str,        # "google" | "microsoft" | "apple"
    provider_id: str,
    email: str,
    first_name: str,
    last_name: str,
) -> User:
    id_field = f"{provider}_id"   # google_id / microsoft_id / apple_id

    # 1. Match by provider ID (most reliable)
    user = db.query(User).filter(getattr(User, id_field) == provider_id).first()
    if user:
        return user

    # 2. Match by email — link provider to existing account
    user = db.query(User).filter(User.email == email).first()
    if user:
        setattr(user, id_field, provider_id)
        user.is_verified = True
        db.commit()
        db.refresh(user)
        return user

    # 3. Create new verified Customer account
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        hashed_password=None,
        role="Customer",
        is_verified=True,
        is_active=True,
    )
    setattr(user, id_field, provider_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _frontend_redirect(user: User, provider: str) -> RedirectResponse:
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    # Kept for compatibility with the current frontend. Replace this query-string
    # token with a one-time code or HttpOnly session cookie before production.
    url = f"{settings.FRONTEND_URL}/auth/callback?{urlencode({'token': token, 'provider': provider})}"
    response = RedirectResponse(url=url, status_code=302)
    response.headers["Referrer-Policy"] = "no-referrer"
    _clear_state_cookie(response)
    return response


# ===========================================================================
# Google OAuth 2.0
# ===========================================================================

_GOOGLE_AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL    = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google/login", summary="Redirect to Google OAuth")
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")

    state = secrets.token_urlsafe(32)
    params = urlencode({
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  f"{settings.BACKEND_URL}/auth/google/callback",
        "response_type": "code",
        "scope":         "openid email profile",
        "state":         state,
        "access_type":   "online",
        "prompt":        "select_account",
    })
    response = RedirectResponse(url=f"{_GOOGLE_AUTH_URL}?{params}", status_code=302)
    _set_state_cookie(response, state)
    return response


@router.get("/google/callback", summary="Google OAuth callback")
def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_denied")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state from Google.")

    _validate_state(request, state)

    with httpx.Client(timeout=10.0) as client:
        token_resp = client.post(_GOOGLE_TOKEN_URL, data={
            "code":          code,
            "client_id":     settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri":  f"{settings.BACKEND_URL}/auth/google/callback",
            "grant_type":    "authorization_code",
        })

    if token_resp.status_code != 200:
        logger.error("Google token exchange failed: %s", token_resp.text)
        raise HTTPException(status_code=400, detail="Failed to exchange Google auth code.")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token from Google.")

    with httpx.Client(timeout=10.0) as client:
        profile_resp = client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if profile_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Google profile.")

    profile    = profile_resp.json()
    google_id  = profile.get("sub")
    email      = profile.get("email")
    first_name = profile.get("given_name") or (profile.get("name", "User").split()[0])
    last_name  = profile.get("family_name") or (
        profile.get("name", "").split()[-1] if " " in profile.get("name", "") else ""
    )

    if not google_id or not email or not profile.get("email_verified"):
        raise HTTPException(status_code=400, detail="Google profile missing required fields.")

    user = _upsert_oauth_user(
        db, provider="google", provider_id=google_id,
        email=email, first_name=first_name, last_name=last_name,
    )
    return _frontend_redirect(user, "Google")


# ===========================================================================
# Microsoft OAuth 2.0  (Azure AD / Entra ID)
# ===========================================================================

_MS_GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me"
# Space-separated scopes — urlencode handles the encoding
_MS_SCOPES = "openid email profile User.Read"


def _ms_base_url() -> str:
    return f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT}/oauth2/v2.0"


@router.get("/microsoft/login", summary="Redirect to Microsoft OAuth")
def microsoft_login():
    if not settings.MICROSOFT_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Microsoft OAuth is not configured.")

    state = secrets.token_urlsafe(32)
    params = urlencode({
        "client_id":     settings.MICROSOFT_CLIENT_ID,
        "redirect_uri":  f"{settings.BACKEND_URL}/auth/microsoft/callback",
        "response_type": "code",
        "scope":         _MS_SCOPES,
        "state":         state,
        "response_mode": "query",
    })
    response = RedirectResponse(url=f"{_ms_base_url()}/authorize?{params}")
    _set_state_cookie(response, state)
    return response


@router.get("/microsoft/callback", summary="Microsoft OAuth callback")
def microsoft_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: Session = Depends(get_db),
):
    if error:
        logger.warning("Microsoft OAuth error: %s — %s", error, error_description)
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=microsoft_denied")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state from Microsoft.")

    _validate_state(request, state)

    with httpx.Client(timeout=10.0) as client:
        token_resp = client.post(
            f"{_ms_base_url()}/token",
            data={
                "code":          code,
                "client_id":     settings.MICROSOFT_CLIENT_ID,
                "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                "redirect_uri":  f"{settings.BACKEND_URL}/auth/microsoft/callback",
                "grant_type":    "authorization_code",
                "scope":         _MS_SCOPES,
            },
        )

    if token_resp.status_code != 200:
        logger.error("Microsoft token exchange failed: %s", token_resp.text)
        raise HTTPException(status_code=400, detail="Failed to exchange Microsoft auth code.")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token from Microsoft.")

    with httpx.Client(timeout=10.0) as client:
        profile_resp = client.get(
            _MS_GRAPH_ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if profile_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Microsoft profile.")

    profile      = profile_resp.json()
    microsoft_id = profile.get("id")
    email        = profile.get("mail") or profile.get("userPrincipalName") or ""
    first_name   = profile.get("givenName") or profile.get("displayName", "User").split()[0]
    last_name    = profile.get("surname") or (
        profile.get("displayName", "").split()[-1]
        if " " in profile.get("displayName", "") else ""
    )

    if not microsoft_id or "@" not in email:
        raise HTTPException(status_code=400, detail="Microsoft profile missing required fields.")

    user = _upsert_oauth_user(
        db, provider="microsoft", provider_id=microsoft_id,
        email=email, first_name=first_name, last_name=last_name,
    )
    return _frontend_redirect(user, "Microsoft")


# ===========================================================================
# Apple Sign In
# https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api
#
# Key differences from Google/Microsoft:
#   - client_secret is a short-lived JWT you sign with your .p8 EC private key
#   - Apple POSTs the callback (response_mode=form_post), not a GET redirect
#   - User name is only provided on the VERY FIRST authorization; read from
#     the "user" form field (JSON string) or fall back to id_token claims
#   - The "sub" in the id_token is the stable Apple User ID
# ===========================================================================

_APPLE_AUTH_URL  = "https://appleid.apple.com/auth/authorize"
_APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
_APPLE_JWKS_URL  = "https://appleid.apple.com/auth/keys"


def _make_apple_client_secret() -> str:
    """
    Apple requires a signed JWT as the client_secret.
    It must be signed with your .p8 EC private key using ES256.
    Expires in max 6 months — we generate a fresh one per request (5 min TTL).
    """
    if not all([
        settings.APPLE_CLIENT_ID,
        settings.APPLE_TEAM_ID,
        settings.APPLE_KEY_ID,
        settings.APPLE_PRIVATE_KEY,
    ]):
        raise HTTPException(status_code=501, detail="Apple Sign In is not configured.")

    now = int(time.time())
    # Replace literal \n in env var with real newlines
    private_key = settings.APPLE_PRIVATE_KEY.replace("\\n", "\n")

    payload = {
        "iss": settings.APPLE_TEAM_ID,
        "iat": now,
        "exp": now + 300,            # 5-minute TTL
        "aud": "https://appleid.apple.com",
        "sub": settings.APPLE_CLIENT_ID,
    }
    headers = {"kid": settings.APPLE_KEY_ID}

    return pyjwt.encode(payload, private_key, algorithm="ES256", headers=headers)


def _verify_apple_id_token(id_token: str) -> dict:
    """Verify the Apple-issued ID token against Apple's current JWKS."""
    try:
        header = pyjwt.get_unverified_header(id_token)
        key_id = header.get("kid")
        if header.get("alg") != "RS256" or not key_id:
            raise ValueError("Unexpected Apple ID token header")

        with httpx.Client(timeout=10.0) as client:
            jwks_response = client.get(_APPLE_JWKS_URL)
        jwks_response.raise_for_status()
        jwk = next(
            (key for key in jwks_response.json().get("keys", []) if key.get("kid") == key_id),
            None,
        )
        if not jwk:
            raise ValueError("Apple signing key was not found")

        signing_key = pyjwt.PyJWK.from_dict(jwk).key
        return pyjwt.decode(
            id_token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com",
        )
    except Exception as exc:
        logger.error("Apple id_token verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid Apple identity token.") from exc


@router.get("/apple/login", summary="Redirect to Apple Sign In")
def apple_login():
    if not settings.APPLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Apple Sign In is not configured.")

    state = secrets.token_urlsafe(32)
    # Apple requires response_mode=form_post for web flows
    params = urlencode({
        "client_id":     settings.APPLE_CLIENT_ID,
        "redirect_uri":  f"{settings.BACKEND_URL}/auth/apple/callback",
        "response_type": "code id_token",
        "scope":         "name email",
        "state":         state,
        "response_mode": "form_post",
    })
    response = RedirectResponse(url=f"{_APPLE_AUTH_URL}?{params}")
    _set_state_cookie(response, state)
    return response


@router.post("/apple/callback", summary="Apple Sign In callback (form_post)")
async def apple_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Apple POSTs back with application/x-www-form-urlencoded containing:
      code, id_token, state, user (JSON, first login only)
    """
    form  = await request.form()
    code  = form.get("code")
    state = form.get("state")
    error = form.get("error")

    if error:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=apple_denied")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state from Apple.")

    _validate_state(request, str(state))

    client_secret = _make_apple_client_secret()

    with httpx.Client(timeout=10.0) as client:
        token_resp = client.post(
            _APPLE_TOKEN_URL,
            data={
                "code":                 code,
                "client_id":            settings.APPLE_CLIENT_ID,
                "client_secret":        client_secret,
                "redirect_uri":         f"{settings.BACKEND_URL}/auth/apple/callback",
                "grant_type":           "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if token_resp.status_code != 200:
        logger.error("Apple token exchange failed: %s", token_resp.text)
        raise HTTPException(status_code=400, detail="Failed to exchange Apple auth code.")

    token_data = token_resp.json()
    id_token   = token_data.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="No id_token from Apple.")

    claims = _verify_apple_id_token(id_token)

    apple_id = claims.get("sub")
    email    = claims.get("email")

    if not apple_id:
        raise HTTPException(status_code=400, detail="Apple id_token missing sub claim.")

    # Apple provides name only on FIRST authorization (in the form "user" field)
    first_name = "Apple"
    last_name  = "User"
    user_json_str = form.get("user")
    if user_json_str:
        try:
            user_info  = json.loads(str(user_json_str))
            name       = user_info.get("name", {})
            first_name = name.get("firstName") or first_name
            last_name  = name.get("lastName")  or last_name
        except (json.JSONDecodeError, AttributeError):
            pass

    # email can be a private relay address (e.g. abc123@privaterelay.appleid.com) — that's fine
    if not email:
        # No email in token — this is rare but possible for very old Apple accounts
        raise HTTPException(
            status_code=400,
            detail="Apple did not provide an email address. "
                   "Please check your Apple ID privacy settings.",
        )

    user = _upsert_oauth_user(
        db, provider="apple", provider_id=apple_id,
        email=email, first_name=first_name, last_name=last_name,
    )
    return _frontend_redirect(user, "Apple")


# ===========================================================================
# POST fallback endpoints
# The frontend tries HEAD /auth/{provider}/login first, then falls back to
# POST /auth/{provider}. These handle that fallback gracefully.
# ===========================================================================

@router.post("/google", summary="Fallback: start Google OAuth")
def google_post_fallback():
    if not settings.GOOGLE_CLIENT_ID:
        return JSONResponse(
            status_code=501,
            content={"success": False, "message": "Google OAuth is not configured on this server."},
        )
    return RedirectResponse(url="/auth/google/login", status_code=302)


@router.post("/microsoft", summary="Fallback: start Microsoft OAuth")
def microsoft_post_fallback():
    if not settings.MICROSOFT_CLIENT_ID:
        return JSONResponse(
            status_code=501,
            content={"success": False, "message": "Microsoft OAuth is not configured on this server."},
        )
    return RedirectResponse(url="/auth/microsoft/login", status_code=302)


@router.post("/apple", summary="Fallback: start Apple Sign In")
def apple_post_fallback():
    if not settings.APPLE_CLIENT_ID:
        return JSONResponse(
            status_code=501,
            content={"success": False, "message": "Apple Sign In is not configured on this server."},
        )
    return RedirectResponse(url="/auth/apple/login", status_code=302)
