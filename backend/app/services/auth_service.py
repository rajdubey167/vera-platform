import os

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.utils.security import hash_password, verify_password
from app.utils.logger import logger


def register_user(data: RegisterRequest, db: Session) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Role is always "user" — admin is granted only if the email matches
    # the ADMIN_EMAIL environment variable set by the server operator.
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    role = "admin" if (admin_email and data.email.lower() == admin_email) else "user"

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered: {user.email} (role={user.role})")
    return user


def authenticate_user(email: str, password: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        logger.warning(f"Failed login attempt for: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")
    logger.info(f"User logged in: {user.email}")
    return user
