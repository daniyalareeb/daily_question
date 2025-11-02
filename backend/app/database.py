from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, MONGODB_DBNAME

if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

client = AsyncIOMotorClient(
    MONGODB_URI,
    tls=True,
    tlsAllowInvalidCertificates=False,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    retryWrites=True
)

db = client[MONGODB_DBNAME]

users_collection = db["users"]
questions_collection = db["questions"]
responses_collection = db["responses"]






