from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, MONGODB_DBNAME

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DBNAME]

# collection names

users_collection = db["users"]
questions_collection = db["questions"]
responses_collection = db["responses"]






