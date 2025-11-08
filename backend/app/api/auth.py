# Authentication and user management API
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.config import (
    FIREBASE_CREDENTIALS_PATH, 
    FIREBASE_CREDENTIALS_JSON,
    FIREBASE_WEB_API_KEY,
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_EXPIRATION_HOURS,
    ENVIRONMENT
)
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import json
import os
import logging

logger = logging.getLogger(__name__)

try:
    if not firebase_admin._apps:
        if FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
        elif FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        elif os.path.exists("app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json"):
            cred = credentials.Certificate("app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json")
        else:
            raise Exception("No Firebase credentials provided")
        firebase_admin.initialize_app(cred)
except Exception as e:
    logger.error(f"Firebase initialization error: {e}")

router = APIRouter()
security = HTTPBearer()
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        uid = payload.get("sub")
        email = payload.get("email")
        
        if uid is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        try:
            firebase_user = firebase_auth.get_user(uid)
            return {"uid": uid, "email": email}
        except Exception as e:
            logger.warning(f"Firebase user verification failed for uid {uid}: {e}")
            return {"uid": uid, "email": email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=TokenResponse)
async def register(user_data: RegisterRequest):
    try:
        user_record = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        access_token_expires = timedelta(hours=JWT_EXPIRATION_HOURS)
        access_token = create_access_token(
            data={"sub": user_record.uid, "email": user_data.email},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "uid": user_record.uid,
                "email": user_record.email
            }
        }
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=TokenResponse)
async def login(user_data: LoginRequest):
    import requests
    
    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Firebase Web API Key not configured. Please set FIREBASE_WEB_API_KEY environment variable."
        )
    
    try:
        verify_response = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
            params={"key": FIREBASE_WEB_API_KEY},
            json={
                "email": user_data.email,
                "password": user_data.password,
                "returnSecureToken": True
            },
            timeout=10
        )
        
        if verify_response.status_code != 200:
            error_data = verify_response.json().get("error", {})
            error_message = error_data.get("message", "Invalid email or password")
            
            if "INVALID_PASSWORD" in error_message or "EMAIL_NOT_FOUND" in error_message:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            else:
                raise HTTPException(status_code=401, detail=error_message)
        
        verify_data = verify_response.json()
        uid = verify_data.get("localId")
        email = verify_data.get("email")
        
        if not uid or not email:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        try:
            firebase_auth.get_user(uid)
        except firebase_auth.UserNotFoundError:
            raise HTTPException(status_code=401, detail="User not found")
        except Exception as e:
            logger.warning(f"Firebase user lookup failed for uid {uid}: {e}")
        
        access_token_expires = timedelta(hours=JWT_EXPIRATION_HOURS)
        access_token = create_access_token(
            data={"sub": uid, "email": email},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "uid": uid,
                "email": email
            }
        }
    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Authentication service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    return {
        "valid": True,
        "user": current_user
    }

@router.get("/user")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "uid": current_user["uid"],
        "email": current_user["email"]
    }

@router.get("/config-check")
async def check_firebase_config():
    config_status = {
        "firebase_web_api_key": "✅ Configured" if FIREBASE_WEB_API_KEY else "❌ Missing",
        "firebase_credentials": "✅ Configured" if (FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH) else "❌ Missing",
        "can_send_reset_emails": bool(FIREBASE_WEB_API_KEY)
    }
    return config_status

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    continueUrl: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    oobCode: str
    newPassword: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    import requests
    
    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Firebase Web API Key not configured"
        )
    
    try:
        request_body = {
            "requestType": "PASSWORD_RESET",
            "email": request.email
        }
        
        if request.continueUrl:
            continue_url = request.continueUrl.strip()
            if continue_url.endswith('/'):
                continue_url = continue_url.rstrip('/')
            request_body["continueUrl"] = continue_url
        
        response = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode",
            params={"key": FIREBASE_WEB_API_KEY},
            json=request_body,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("Password reset email sent successfully")
            return {
                "message": "If an account exists with this email, a password reset link has been sent."
            }
        else:
            try:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Failed to send password reset email")
                error_code = error_data.get("error", {}).get("code", response.status_code)
                logger.warning(f"Password reset failed: {error_message} (Code: {error_code})")
                
                if "EMAIL_NOT_FOUND" in error_message:
                    return {
                        "message": "If an account exists with this email, a password reset link has been sent."
                    }
                else:
                    raise HTTPException(
                        status_code=response.status_code if response.status_code < 500 else 400,
                        detail=f"Failed to send reset email: {error_message}"
                    )
            except ValueError:
                logger.error(f"Non-JSON error response from Firebase")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to send reset email"
                )
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Request exception in password reset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send reset email: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in password reset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Password reset failed: {str(e)}")

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    import requests
    
    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Firebase Web API Key not configured"
        )
    
    try:
        response = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:resetPassword",
            params={"key": FIREBASE_WEB_API_KEY},
            json={
                "oobCode": request.oobCode,
                "newPassword": request.newPassword
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "message": "Password reset successfully",
                "email": data.get("email")
            }
        else:
            error_data = response.json().get("error", {})
            error_message = error_data.get("message", "Failed to reset password")
            
            if "INVALID_OOB_CODE" in error_message or "EXPIRED_OOB_CODE" in error_message:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid or expired reset code. Please request a new password reset."
                )
            else:
                raise HTTPException(status_code=400, detail=error_message)
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset password: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset failed: {str(e)}")