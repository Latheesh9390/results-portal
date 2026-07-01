from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_admin, hash_password, verify_password
from database import get_db
from models.admin import Admin
from schemas.auth import LoginRequest, RegisterRequest, TokenOut

router = APIRouter()


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    existing = db.query(Admin).filter(Admin.username == payload.username).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="That username is already taken.")

    admin = Admin(username=payload.username, hashed_password=hash_password(payload.password))
    db.add(admin)
    db.commit()

    token = create_access_token(admin.username)
    return TokenOut(access_token=token, username=admin.username)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == payload.username).first()
    if admin is None or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password.")

    token = create_access_token(admin.username)
    return TokenOut(access_token=token, username=admin.username)


@router.get("/me")
def me(admin: Admin = Depends(get_current_admin)):
    return {"username": admin.username}
