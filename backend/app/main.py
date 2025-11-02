from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import questions, responses, dashboard, auth
from app.services.reminder_service import start_reminder_scheduler
import asyncio

app = FastAPI(title="Daily Questions")

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
    await start_reminder_scheduler()

@app.get("/")
def health_check():
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


