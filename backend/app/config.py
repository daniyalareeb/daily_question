# Environment configuration
from dotenv import load_dotenv
import os

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Anon key for client-side
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service role key for server-side

# Email Service (Resend)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

REMINDER_TIME = os.getenv("REMINDER_TIME", "20:00")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

