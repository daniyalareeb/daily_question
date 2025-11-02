# This file connects to MongoDB database
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, MONGODB_DBNAME

# Check if MongoDB connection string is set
# If not, the app can't run so we raise an error
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

# Connect to MongoDB with secure settings
# These settings help the connection work on cloud platforms like Render
client = AsyncIOMotorClient(
    MONGODB_URI,
    tls=True,  # Use secure connection
    tlsAllowInvalidCertificates=False,  # Only accept valid certificates
    serverSelectionTimeoutMS=30000,  # Wait up to 30 seconds to connect
    connectTimeoutMS=30000,  # Connection timeout
    retryWrites=True  # Retry writes if they fail
)

# Get the database we want to use
db = client[MONGODB_DBNAME]

# Create references to our collections (like tables in SQL)
# These are what we use to save and read data
users_collection = db["users"]  # Stores user profiles
questions_collection = db["questions"]  # Stores the 6 reflection questions
responses_collection = db["responses"]  # Stores user answers






