# Main FastAPI application setup
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import questions, responses, dashboard, auth
from app.services.reminder_service import start_reminder_scheduler
from app.cache import cache_service
from app.config import ENVIRONMENT
import asyncio
import logging
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)
if ENVIRONMENT == "development":
    logging.basicConfig(level=logging.DEBUG)
else:
    logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Daily Questions")

# CORS must be added BEFORE other middleware
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Type", "Content-Length", "X-Total-Count"],
    max_age=3600,  # Increased from 600 to 3600 for better caching
)

# Initialize rate limiter (after CORS)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Content Security Policy
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Add exception handler to ensure CORS headers on all HTTP exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure CORS headers are added to all HTTP exceptions"""
    import re
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    
    # Add CORS headers if origin is allowed
    if origin:
        # Check if origin is in allowed list or matches regex
        is_allowed = origin in origins
        if not is_allowed:
            # Check regex pattern
            pattern = re.compile(r"https://.*\.(vercel\.app|onrender\.com)")
            is_allowed = bool(pattern.match(origin))
        
        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    
    return response

app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(responses.router, prefix="/api/responses", tags=["responses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Daily Questions API...")
    # Supabase indexes are managed via SQL schema
    await cache_service.connect()
    
    # Pre-warm caches (question IDs, options map, and questions)
    try:
        from app.api.dashboard import get_all_question_ids, get_cached_options_map
        from app.api.questions import get_all_questions
        get_all_question_ids()  # Initialize question IDs cache
        get_cached_options_map()  # Initialize options map cache
        await get_all_questions()  # Pre-warm questions cache
        logger.info("✅ Caches pre-warmed")
    except Exception as e:
        logger.warning(f"Could not pre-warm caches: {e}")
    
    await start_reminder_scheduler()
    logger.info("API ready!")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Daily Questions API is running"}

@app.get("/health")
def health():
    return {"status": "ok", "message": "Daily Questions API is running"}

@app.get("/api/health")
def api_health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "features": [
            "daily_questions",
            "choice_based_analytics", 
            "dashboard_insights",
            "email_reminders"
        ]
    }


