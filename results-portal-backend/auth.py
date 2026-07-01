"""
Admin authentication helpers: password hashing (bcrypt) and JWT issuing /
verification. Kept deliberately separate from the student-facing flow -
students never touch this module, they only ever go through the hall
ticket search.
"""

import os
import time

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models.admin import Admin

# In production, set ADMIN_SECRET_KEY to a long random value, e.g.:
#   export ADMIN_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')"
SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
TOKEN_TTL_SECONDS = 8 * 60 * 60  # 8 hour admin session

# Shared "invite code" required to self-register a new admin account via
# POST /api/auth/register. This keeps registration open (no existing admin
# has to manually create accounts) while still stopping random visitors on
# the public internet from signing themselves up as an admin - only people
# who were given this code by an existing admin can do so.
#
# CHANGE THIS in production:
#   export ADMIN_REGISTRATION_CODE="some-long-secret-only-staff-know"
ADMIN_REGISTRATION_CODE = os.getenv("ADMIN_REGISTRATION_CODE", "RESULTS-ADMIN-2026")

# Tells FastAPI's auto-docs where to send the "Authorize" button, and lets us
# pull the bearer token out of the Authorization header on protected routes.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(username: str) -> str:
    now = int(time.time())
    payload = {"sub": username, "iat": now, "exp": now + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> str:
    """Returns the username encoded in the token, or raises HTTPException."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired admin session. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise credentials_error
    username = payload.get("sub")
    if not username:
        raise credentials_error
    return username


def get_current_admin(
    token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Admin:
    """FastAPI dependency: require a valid admin Bearer token. Attach this to
    every /api/admin/* route so students (who never have a token) get a 401."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = _decode_token(token)
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found.")
    return admin
