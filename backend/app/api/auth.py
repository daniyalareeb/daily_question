# Authentication and user management API using Supabase
from fastapi import Depends, HTTPException, APIRouter, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.supabase_client import supabase
from typing import Optional, Dict
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)

# Account lockout tracking (in-memory, should use Redis in production)
_failed_login_attempts: Dict[str, Dict] = {}  # {email: {count: int, locked_until: datetime}}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

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

class UpdateProfileRequest(BaseModel):
    full_name: str

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
            
            # Fetch full_name from user_profiles table
            full_name = None
            try:
                profile_result = supabase.table("user_profiles").select("full_name").eq("user_id", user_id).execute()
                if profile_result.data and len(profile_result.data) > 0:
                    full_name = profile_result.data[0].get("full_name")
                    logger.debug(f"Fetched full_name '{full_name}' for user {user_id}")
                else:
                    logger.warning(f"No user profile found for user {user_id} - table may not exist or profile not created")
            except Exception as profile_error:
                logger.error(f"Failed to fetch user profile for user {user_id}: {profile_error}")
                # Continue without full_name if profile doesn't exist yet
            
            return {
                "uid": user_id,
                "email": email or "",
                "full_name": full_name,
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
        user_id = str(user.id)
        
        # Create user profile in user_profiles table
        try:
            supabase.table("user_profiles").insert({
                "user_id": user_id,
                "full_name": user_data.full_name,
                "pref_reminder": True
            }).execute()
            logger.info(f"User profile created successfully for user {user_id}")
        except Exception as profile_error:
            logger.error(f"Failed to create user profile for user {user_id}: {profile_error}")
            # Continue even if profile creation fails (user can update later)
            # The full_name will still be returned in the response
        
        # Return session token if available, otherwise user needs to verify email
        access_token = response.session.access_token if response.session else None
        
        if not access_token:
            # User needs to verify email first
            return {
                "access_token": "",
                "token_type": "bearer",
                "user": {
                    "uid": user_id,
                    "email": user.email,
                    "full_name": user_data.full_name,
                    "email_verified": False
                },
                "message": "Please check your email to verify your account"
            }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "uid": user_id,
                "email": user.email,
                "full_name": user_data.full_name,
                "email_verified": user.email_confirmed_at is not None
            }
        }
    except Exception as e:
        error_msg = str(e)
        # Generic error message to prevent user enumeration
        if "already registered" in error_msg.lower() or "user already exists" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Registration failed. Please try again or use forgot password.")
        logger.error(f"Registration error: {e}")
        # Don't expose internal error details
        raise HTTPException(status_code=500, detail="Registration failed. Please try again later.")

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, user_data: LoginRequest):
    """Login user with Supabase Auth - Optimized for speed"""
    email_lower = user_data.email.lower()
    
    # Check for account lockout (quick check)
    if email_lower in _failed_login_attempts:
        attempt_data = _failed_login_attempts[email_lower]
        if attempt_data.get('locked_until'):
            if datetime.utcnow() < attempt_data['locked_until']:
                remaining = (attempt_data['locked_until'] - datetime.utcnow()).seconds // 60
                raise HTTPException(
                    status_code=429,
                    detail=f"Account temporarily locked. Please try again in {remaining} minutes."
                )
            else:
                # Lockout expired, reset
                _failed_login_attempts[email_lower] = {'count': 0, 'locked_until': None}
    
    try:
        # Sign in with Supabase - this is the main operation (should be fast)
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if not response.user or not response.session:
            # Increment failed attempts
            if email_lower not in _failed_login_attempts:
                _failed_login_attempts[email_lower] = {'count': 0, 'locked_until': None}
            
            _failed_login_attempts[email_lower]['count'] += 1
            
            if _failed_login_attempts[email_lower]['count'] >= MAX_LOGIN_ATTEMPTS:
                _failed_login_attempts[email_lower]['locked_until'] = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many failed login attempts. Account locked for {LOCKOUT_DURATION_MINUTES} minutes."
                )
            
            # Generic error to prevent user enumeration
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Successful login - reset failed attempts immediately
        if email_lower in _failed_login_attempts:
            _failed_login_attempts[email_lower] = {'count': 0, 'locked_until': None}
        
        user = response.user
        user_id = str(user.id)
        
        # Return immediately - don't wait for database queries
        # full_name will be fetched on dashboard load (non-blocking)
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "uid": user_id,
                "email": user.email,
                "full_name": None,  # Fetched asynchronously on dashboard
                "email_verified": user.email_confirmed_at is not None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Increment failed attempts on any error
        if email_lower not in _failed_login_attempts:
            _failed_login_attempts[email_lower] = {'count': 0, 'locked_until': None}
        _failed_login_attempts[email_lower]['count'] += 1
        
        if _failed_login_attempts[email_lower]['count'] >= MAX_LOGIN_ATTEMPTS:
            _failed_login_attempts[email_lower]['locked_until'] = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed login attempts. Account locked for {LOCKOUT_DURATION_MINUTES} minutes."
            )
        
        # Generic error message
        if "invalid" in error_msg.lower() or "wrong" in error_msg.lower() or "401" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again later.")

@router.get("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify if token is valid"""
    return {
        "valid": True,
        "user": current_user
    }

@router.get("/user")
@limiter.limit("30/minute")
async def get_user_info(request: Request, current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user_id = current_user["uid"]
    
    # Get registration date from user_profiles.created_at or first response date
    registration_date = None
    try:
        # Try to get from user_profiles first
        profile_result = supabase.table("user_profiles").select("created_at").eq("user_id", user_id).execute()
        if profile_result.data and len(profile_result.data) > 0:
            registration_date = profile_result.data[0].get("created_at")
            logger.info(f"Found registration date from user_profiles for user {user_id}: {registration_date}")
        else:
            # Fallback: use the first response date as a proxy for registration
            first_response = supabase.table("responses").select("date").eq("user_id", user_id).order("date", desc=False).limit(1).execute()
            if first_response.data and len(first_response.data) > 0:
                registration_date = first_response.data[0].get("date")
                logger.info(f"Using first response date as registration date for user {user_id}: {registration_date}")
            else:
                # If no profile and no responses, use today's date (user just registered)
                from datetime import datetime
                registration_date = datetime.utcnow().date().isoformat()
                logger.info(f"No profile or responses found, using today as registration date for user {user_id}: {registration_date}")
    except Exception as e:
        logger.error(f"Could not fetch registration date for user {user_id}: {e}")
        # Fallback to today if all else fails
        from datetime import datetime
        registration_date = datetime.utcnow().date().isoformat()
    
    return {
        "uid": current_user["uid"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name"),
        "email_verified": current_user.get("email_verified", False),
        "registration_date": registration_date
    }

@router.put("/user/profile")
async def update_user_profile(
    profile_data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        user_id = current_user["uid"]
        
        # Check if profile exists
        existing_profile = supabase.table("user_profiles").select("id").eq("user_id", user_id).execute()
        
        if existing_profile.data and len(existing_profile.data) > 0:
            # Update existing profile
            result = supabase.table("user_profiles").update({
                "full_name": profile_data.full_name,
                "updated_at": "now()"
            }).eq("user_id", user_id).execute()
        else:
            # Create new profile if it doesn't exist
            result = supabase.table("user_profiles").insert({
                "user_id": user_id,
                "full_name": profile_data.full_name,
                "pref_reminder": True
            }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update profile")
        
        return {
            "message": "Profile updated successfully",
            "full_name": profile_data.full_name
        }
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, forgot_request: ForgotPasswordRequest):
    """Send password reset email"""
    try:
        from app.utils.security import validate_redirect_url
        
        # Validate redirect URL if provided
        if forgot_request.redirect_url:
            if not validate_redirect_url(forgot_request.redirect_url):
                raise HTTPException(status_code=400, detail="Invalid redirect URL")
            redirect_url = forgot_request.redirect_url
        else:
            # Default to frontend URL from environment or localhost
            from app.config import ENVIRONMENT
            if ENVIRONMENT == "production":
                redirect_url = os.getenv("FRONTEND_URL", "https://your-domain.vercel.app/reset-password")
            else:
                redirect_url = "http://localhost:3000/reset-password"
        
        response = supabase.auth.reset_password_for_email(
            forgot_request.email,
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
                    json={"password": reset_request.password}
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
                "password": change_request.new_password
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
