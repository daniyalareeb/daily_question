from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, MONGODB_DBNAME

# Validate MongoDB URI before connecting
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DBNAME]

# collection names

users_collection = db["users"]
questions_collection = db["questions"]
responses_collection = db["responses"]






