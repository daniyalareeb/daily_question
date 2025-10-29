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
    JWT_EXPIRATION_HOURS
)
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import json
import os

# Initialize Firebase Admin SDK
try:
    # Check if Firebase app is already initialized
    if not firebase_admin._apps:
        # Try to use environment variable (for Render deployment)
        if FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
        # Fallback to file path (for local development)
        elif FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        # Try to find credentials file in app directory
        elif os.path.exists("app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json"):
            cred = credentials.Certificate("app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json")
        else:
            raise Exception("No Firebase credentials provided")
        firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"Firebase initialization error: {e}")
    # Continue without Firebase for development

router = APIRouter()
security = HTTPBearer()

# Pydantic models for request/response
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
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token"""
    token = credentials.credentials
    try:
        # Verify JWT token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        uid = payload.get("sub")
        email = payload.get("email")
        
        if uid is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Optionally verify user still exists in Firebase (optional check)
        try:
            firebase_user = firebase_auth.get_user(uid)
            return {"uid": uid, "email": email}
        except:
            # If user doesn't exist in Firebase, still trust JWT if valid
            return {"uid": uid, "email": email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=TokenResponse)
async def register(user_data: RegisterRequest):
    """Register a new user via Firebase Admin SDK"""
    try:
        # Create user in Firebase
        user_record = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        # Create JWT token
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
    """Login user via Firebase REST API and return JWT token"""
    import requests
    
    # Validate Firebase Web API Key is configured
    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Firebase Web API Key not configured. Please set FIREBASE_WEB_API_KEY environment variable."
        )
    
    try:
        # Verify credentials using Firebase REST API
        # This is secure because the API key is server-side only
        verify_response = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
            params={"key": FIREBASE_WEB_API_KEY},
            json={
                "email": user_data.email,
                "password": user_data.password,
                "returnSecureToken": True
            },
            timeout=10  # Prevent hanging requests
        )
        
        if verify_response.status_code != 200:
            error_data = verify_response.json().get("error", {})
            error_message = error_data.get("message", "Invalid email or password")
            
            # Provide generic error message for security (don't reveal if email exists)
            if "INVALID_PASSWORD" in error_message or "EMAIL_NOT_FOUND" in error_message:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            else:
                raise HTTPException(status_code=401, detail=error_message)
        
        verify_data = verify_response.json()
        uid = verify_data.get("localId")
        email = verify_data.get("email")
        
        if not uid or not email:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify user exists in Firebase Admin (optional, for extra validation)
        try:
            firebase_auth.get_user(uid)
        except firebase_auth.UserNotFoundError:
            raise HTTPException(status_code=401, detail="User not found")
        except Exception:
            # If Admin SDK check fails, still proceed with REST API verified user
            pass
        
        # Create JWT token for our backend
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
    """Verify if JWT token is valid"""
    return {
        "valid": True,
        "user": current_user
    }

@router.get("/user")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "uid": current_user["uid"],
        "email": current_user["email"]
    }