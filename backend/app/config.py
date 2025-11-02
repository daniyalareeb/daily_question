from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DBNAME = os.getenv("MONGODB_DBNAME", "daily_questions")

FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")
FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

REMINDER_TIME = os.getenv("REMINDER_TIME", "20:00")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

