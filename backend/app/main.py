from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import questions, responses, dashboard, auth
from app.services.reminder_service import start_reminder_scheduler
import asyncio

# Initialize FastAPI application
# Title appears in auto-generated API documentation at /docs
app = FastAPI(title="Daily Questions")

# CORS Configuration
# Allows the React frontend (localhost:3000) to make API requests
# Without this, browser would block cross-origin requests
origins = [
    "http://localhost:3000",  # React frontend development server
    "http://localhost:8000",  # Backend server (for API docs)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)",  # Vercel and Render deployments
    allow_credentials=True,  # Allows cookies/auth headers
    allow_methods=["*"],      # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],      # Allows all headers (Authorization, Content-Type, etc.)
)

# Include API Routers
# Each router handles a specific domain of endpoints
# Prefix adds /api/<domain> to all routes in that router
# Tags group endpoints in the auto-generated API documentation
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(responses.router, prefix="/api/responses", tags=["responses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.on_event("startup")
async def startup_event():
    """
    Start background tasks when application starts up.
    
    Background Tasks:
    - Reminder Scheduler: Sends daily email reminders to users
      - Checks if user has submitted today
      - Sends reminder via Resend API if not submitted
      - Runs continuously in background using asyncio
    
    This function is called automatically by FastAPI when the server starts.
    Runs asynchronously so it doesn't block the main application.
    """
    # Start the reminder scheduler as a background task
    # This will check daily at the configured time and send reminders
    await start_reminder_scheduler()

@app.get("/")
def health_check():
    """
    Root health check endpoint.
    
    Returns:
        {"status": "ok", "message": "Daily Questions API is running"}
    
    Used by:
    - Monitoring tools to check if server is running
    - Frontend to verify backend connection
    - Load balancers for health checks
    """
    return {"status": "ok", "message": "Daily Questions API is running"}

@app.get("/api/health")
def api_health():
    """
    Detailed health check endpoint with feature list.
    
    Returns:
        Dict with status, version, and list of available features
    
    Features listed:
    - daily_questions: Answer 6 daily reflection questions
    - nlp_analytics: NLP keyword extraction and sentiment analysis
    - dashboard_insights: Comprehensive analytics and insights
    - email_reminders: Automated daily reminder emails
    
    Used by:
    - Monitoring dashboards to verify feature availability
    - Debugging to check which features are enabled
    - Documentation to list API capabilities
    """
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


