# Authentication and user management API using Supabase
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.supabase_client import supabase
from typing import Optional
import logging

logger = logging.getLogger(__name__)

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    redirect_url: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: Optional[str] = None
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT token and return user info"""
    token = credentials.credentials
    try:
        # Use Supabase REST API to verify the token
        from app.config import SUPABASE_URL, SUPABASE_KEY
        import httpx
        
        # Verify token by calling Supabase Auth API
        verify_url = f"{SUPABASE_URL}/auth/v1/user"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(verify_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Token verification failed: {response.status_code} - {response.text}")
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            
            user_data = response.json()
            user_id = user_data.get("id")
            email = user_data.get("email")
            email_verified = user_data.get("email_confirmed_at") is not None
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            
            return {
                "uid": user_id,
                "email": email or "",
                "email_verified": email_verified
            }
        
    except HTTPException:
        raise
    except httpx.TimeoutException:
        logger.error("Token verification timeout")
        raise HTTPException(status_code=401, detail="Token verification timeout")
    except Exception as e:
        logger.error(f"Token verification failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register", response_model=TokenResponse)
async def register(user_data: RegisterRequest):
    """Register a new user with Supabase Auth"""
    try:
        # Create user with Supabase
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "email_redirect_to": None  # Can be set to frontend URL for email verification
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Registration failed")
        
        user = response.user
        
        # Return session token if available, otherwise user needs to verify email
        access_token = response.session.access_token if response.session else None
        
        if not access_token:
            # User needs to verify email first
            return {
                "access_token": "",
                "token_type": "bearer",
                "user": {
                    "uid": str(user.id),
                    "email": user.email,
                    "email_verified": False
                },
                "message": "Please check your email to verify your account"
            }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "uid": str(user.id),
                "email": user.email,
                "email_verified": user.email_confirmed_at is not None
            }
        }
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "user already exists" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {error_msg}")

@router.post("/login", response_model=TokenResponse)
async def login(user_data: LoginRequest):
    """Login user with Supabase Auth"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = response.user
        
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "uid": str(user.id),
                "email": user.email,
                "email_verified": user.email_confirmed_at is not None
            }
        }
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower() or "wrong" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password")
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {error_msg}")

@router.get("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify if token is valid"""
    return {
        "valid": True,
        "user": current_user
    }

@router.get("/user")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "uid": current_user["uid"],
        "email": current_user["email"],
        "email_verified": current_user.get("email_verified", False)
    }

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email"""
    try:
        redirect_url = request.redirect_url or "http://localhost:3000/reset-password"
        
        response = supabase.auth.reset_password_for_email(
            request.email,
            {
                "redirect_to": redirect_url
            }
        )
        
        # Supabase doesn't return error if email doesn't exist (security)
        return {
            "message": "If an account exists with this email, a password reset link has been sent."
        }
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send reset email: {str(e)}")

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token from email"""
    try:
        if not request.token:
            raise HTTPException(status_code=400, detail="Reset token is required")
        
        # The token from Supabase password reset email is an access_token
        # We'll use it to verify the user, then update password via Admin API
        try:
            from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY
            import httpx
            
            # Step 1: Verify the token and get user info
            verify_url = f"{SUPABASE_URL}/auth/v1/user"
            verify_headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {request.token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                verify_response = await client.get(verify_url, headers=verify_headers)
                
                if verify_response.status_code != 200:
                    logger.error(f"Token verification failed: {verify_response.status_code} - {verify_response.text}")
                    raise HTTPException(status_code=400, detail="Invalid or expired reset token")
                
                user_data = verify_response.json()
                user_id = user_data.get("id")
                
                if not user_id:
                    logger.error(f"No user ID in token response: {user_data}")
                    raise HTTPException(status_code=400, detail="Invalid or expired reset token")
                
                logger.info(f"Password reset requested for user: {user_id}")
                
                # Step 2: Update password using Admin API
                admin_url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
                admin_headers = {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                }
                
                update_response = await client.put(
                    admin_url,
                    headers=admin_headers,
                    json={"password": request.password}
                )
                
                if update_response.status_code not in [200, 201]:
                    error_detail = update_response.text
                    logger.error(f"Password update failed: {update_response.status_code} - {error_detail}")
                    raise HTTPException(status_code=400, detail="Failed to update password. Please try again.")
                
                logger.info(f"Password successfully reset for user: {user_id}")
            
            return {
                "message": "Password reset successfully"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token validation or password update error: {e}", exc_info=True)
            # Check if it's a token error
            error_msg = str(e).lower()
            if "token" in error_msg or "expired" in error_msg or "invalid" in error_msg or "unauthorized" in error_msg:
                raise HTTPException(status_code=400, detail="Invalid or expired reset token")
            raise HTTPException(status_code=400, detail=f"Failed to reset password: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to reset password: {str(e)}")

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change password for authenticated user"""
    try:
        # Verify current password by attempting to sign in
        try:
            verify_response = supabase.auth.sign_in_with_password({
                "email": current_user["email"],
                "password": request.current_password
            })
            
            if not verify_response.user:
                raise HTTPException(status_code=400, detail="Current password is incorrect")
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password using Supabase auth
        try:
            update_response = supabase.auth.update_user({
                "password": request.new_password
            })
            
            if not update_response.user:
                raise HTTPException(status_code=400, detail="Failed to update password")
            
            return {
                "message": "Password changed successfully"
            }
        except Exception as e:
            logger.error(f"Password update error: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to update password: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")

@router.post("/verify-email")
async def resend_verification_email(current_user: dict = Depends(get_current_user)):
    """Resend email verification"""
    try:
        # Supabase handles email verification automatically on signup
        # This endpoint can trigger a resend if needed
        response = supabase.auth.resend({
            "type": "signup",
            "email": current_user["email"]
        })
        
        return {
            "message": "Verification email sent"
        }
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")

@router.get("/config-check")
async def check_supabase_config():
    """Check Supabase configuration status"""
    from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY
    
    config_status = {
        "supabase_url": "✅ Configured" if SUPABASE_URL else "❌ Missing",
        "supabase_key": "✅ Configured" if SUPABASE_KEY else "❌ Missing",
        "supabase_service_key": "✅ Configured" if SUPABASE_SERVICE_KEY else "❌ Missing",
        "can_send_emails": bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)
    }
    return config_status
