from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, MONGODB_DBNAME

# Validate MongoDB URI before connecting
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

# Connect with explicit TLS/SSL configuration for better compatibility
# This helps with SSL handshake issues on cloud platforms like Render
client = AsyncIOMotorClient(
    MONGODB_URI,
    tls=True,  # Explicitly enable TLS
    tlsAllowInvalidCertificates=False,  # Use valid certificates
    serverSelectionTimeoutMS=30000,  # 30 seconds timeout
    connectTimeoutMS=30000,
    retryWrites=True
)
db = client[MONGODB_DBNAME]

# collection names

users_collection = db["users"]
questions_collection = db["questions"]
responses_collection = db["responses"]






