# Main FastAPI application setup
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import questions, responses, dashboard, auth
from app.services.reminder_service import start_reminder_scheduler
from app.cache import cache_service
from app.database import ensure_indexes
from app.config import ENVIRONMENT
import asyncio
import logging

logger = logging.getLogger(__name__)
if ENVIRONMENT == "development":
    logging.basicConfig(level=logging.DEBUG)
else:
    logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Daily Questions")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(responses.router, prefix="/api/responses", tags=["responses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Daily Questions API...")
    await ensure_indexes()
    logger.info("Database indexes ready")
    await cache_service.connect()
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
            "nlp_analytics", 
            "dashboard_insights",
            "email_reminders"
        ]
    }


