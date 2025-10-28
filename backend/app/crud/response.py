from app.database import responses_collection
from app.models import ResponseInDB
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId


async def create_response(user_id: str, response: ResponseInDB):
    """Create a new response, checking for duplicates"""
    existing_response = await responses_collection.find_one({
        "userId": user_id, 
        "date": response.date
    })
    if existing_response:
        raise HTTPException(
            status_code=400, 
            detail="Response for this date already submitted"
        )

    response.userId = user_id
    response.submittedAt = datetime.utcnow()
    result = await responses_collection.insert_one(response.dict())
    return result.inserted_id

async def get_responses(user_id: str, start_date=None, end_date=None):
    """Get user responses with optional date filtering"""
    query = {"userId": user_id}
    if start_date:
        query["submittedAt"] = {"$gte": start_date}
    if end_date:
        query["submittedAt"] = {"$lte": end_date}
    cursor = responses_collection.find(query).sort("submittedAt", -1)
    return await cursor.to_list(length=None)

async def get_response_by_id(response_id: str):
    """Get a specific response by ID"""
    try:
        return await responses_collection.find_one({"_id": ObjectId(response_id)})
    except Exception:
        return None
