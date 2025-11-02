# This file loads all environment variables from .env file
from dotenv import load_dotenv
import os

# Load variables from .env file into the environment
load_dotenv()

# MongoDB database connection settings
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DBNAME = os.getenv("MONGODB_DBNAME", "daily_questions")  # Default database name

# Firebase settings for authentication
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")  # Path to credentials file
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")  # Or use JSON string for cloud deployment
FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")  # Needed for password reset emails

# JWT token settings for user sessions
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"  # Algorithm used to sign tokens
JWT_EXPIRATION_HOURS = 24 * 7  # Tokens expire after 7 days

# Email service for sending reminders
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# App configuration
REMINDER_TIME = os.getenv("REMINDER_TIME", "20:00")  # When to send daily reminders
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # development or production

