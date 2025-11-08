# MongoDB connection and database setup
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, MONGODB_DBNAME, ENVIRONMENT
import asyncio
import logging

logger = logging.getLogger(__name__)

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

async def ensure_indexes():
    try:
        await responses_collection.create_index(
            [("userId", 1), ("submittedAt", -1)],
            name="user_submitted_idx",
            background=True
        )
        await responses_collection.create_index(
            [("userId", 1), ("date", 1)],
            name="user_date_idx",
            background=True
        )
        try:
            await responses_collection.create_index(
                [("userId", 1), ("date", 1)],
                unique=True,
                name="user_date_unique_idx",
                background=True
            )
        except Exception as e:
            logger.warning(f"Failed to create unique index user_date_unique_idx (may already exist): {e}")
        
        try:
            await users_collection.create_index(
                [("uid", 1)],
                unique=True,
                name="uid_unique_idx",
                background=True
            )
        except Exception as e:
            logger.warning(f"Failed to create unique index uid_unique_idx (may already exist): {e}")
        
        await users_collection.create_index(
            [("pref_reminder", 1)],
            name="reminder_pref_idx",
            background=True
        )
        
        await questions_collection.create_index(
            [("order", 1)],
            name="question_order_idx",
            background=True
        )
    except Exception as e:
        logger.warning(f"Index creation note: {e}")






