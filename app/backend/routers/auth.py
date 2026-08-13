"""Auth routes: /api/auth/*"""
import os
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from db import get_db
from models import RegisterInput, LoginInput, ForgotInput, ResetInput, ChangePasswordInput, VerifyOTPInput
from sql_models import User, LoginAttempt, PasswordResetToken
from security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

LOCK_ATTEMPTS = 5
LOCK_WINDOW_MIN = 15

def _sanitize(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "role": user.role or "customer",
        "phone": user.phone or "",
    }

@router.post("/register")
async def register(payload: RegisterInput, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role="customer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access = create_access_token(str(user.id), email, "customer")
    refresh = create_refresh_token(str(user.id))
    set_auth_cookies(response, access, refresh)
    return _sanitize(user)

@router.post("/login")
async def login(payload: LoginInput, request: Request, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    now = datetime.now(timezone.utc)
    attempt = db.query(LoginAttempt).filter(LoginAttempt.identifier == identifier).first()
    
    if attempt and attempt.count >= LOCK_ATTEMPTS:
        if attempt.last_at.tzinfo is None:
            last = attempt.last_at.replace(tzinfo=timezone.utc)
        else:
            last = attempt.last_at
        if last > now - timedelta(minutes=LOCK_WINDOW_MIN):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        if not attempt:
            attempt = LoginAttempt(identifier=identifier, count=1)
            db.add(attempt)
        else:
            attempt.count += 1
            attempt.last_at = now
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if attempt:
        db.delete(attempt)
        db.commit()
        
    access = create_access_token(str(user.id), email, user.role)
    refresh = create_refresh_token(str(user.id))
    set_auth_cookies(response, access, refresh)
    return _sanitize(user)

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"success": True}

@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@router.post("/forgot-password")
async def forgot(payload: ForgotInput, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Generate 6-digit OTP
        otp = str(secrets.randbelow(1000000)).zfill(6)
        token_record = PasswordResetToken(
            token=otp,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
        )
        db.add(token_record)
        db.commit()
        
        # Dispatch email
        from email_utils import send_otp_email
        send_otp_email(user.email, otp)
        
    return {"message": "If that email exists, an OTP has been sent."}

@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTPInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    rec = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.token == payload.otp,
        PasswordResetToken.used == False
    ).order_by(PasswordResetToken.id.desc()).first()
    
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    exp = rec.expires_at.replace(tzinfo=timezone.utc) if rec.expires_at.tzinfo is None else rec.expires_at
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    return {"message": "OTP is valid"}

@router.post("/reset-password")
async def reset_password(payload: ResetInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    rec = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.token == payload.otp, 
        PasswordResetToken.used == False
    ).order_by(PasswordResetToken.id.desc()).first()
    
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    exp = rec.expires_at.replace(tzinfo=timezone.utc) if rec.expires_at.tzinfo is None else rec.expires_at
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    user.password_hash = hash_password(payload.password)
    rec.used = True
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/change-password")
async def change_password(payload: ChangePasswordInput, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(User).filter(User.id == int(user["id"])).first()
    if not doc or not verify_password(payload.current_password, doc.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    doc.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed"}

@router.delete("/me/account")
async def delete_account(response: Response, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(User).filter(User.id == int(user["id"])).first()
    if doc:
        db.delete(doc)
        db.commit()
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Account deleted successfully"}