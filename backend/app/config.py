from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DBNAME = os.getenv("MONGODB_DBNAME", "daily_questions")

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

# Firebase Service Account (for Render deployment)
# Store the full JSON content as an environment variable
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")

# Email Service
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# App Settings
REMINDER_TIME = os.getenv("REMINDER_TIME", "20:00")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")



