from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, require_admin
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models import LoginHistory, User
from app.schemas import GoogleAuthRequest, Token, UserCreate, UserResponse
from app.services.audit_service import log_activity
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])


def _record_login(db: Session, user: User, request: Request, success: bool) -> None:
    db.add(LoginHistory(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        success=success,
    ))


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        full_name=user_in.full_name,
    )
    db.add(user)
    log_activity(db, user=current_user, action="register", entity_type="user", entity_id=None, details={"email": user_in.email})
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")
    _record_login(db, user, request, True)
    log_activity(db, user=user, action="login", entity_type="user", entity_id=user.id)
    db.commit()
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


@router.post("/google", response_model=Token)
def google_login(
    payload: GoogleAuthRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    """Google OAuth — validates credential when GOOGLE_CLIENT_ID is configured."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google login not configured")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(payload.credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except ImportError:
        raise HTTPException(status_code=501, detail="Install google-auth for Google login")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    email = idinfo.get("email")
    google_id = idinfo.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(google_id),
            google_id=google_id,
            full_name=idinfo.get("name"),
        )
        db.add(user)
        db.flush()
    elif not user.google_id:
        user.google_id = google_id

    _record_login(db, user, request, True)
    db.commit()
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
