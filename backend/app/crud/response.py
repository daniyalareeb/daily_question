# Database operations for user responses
from app.database import responses_collection
from app.models import ResponseInDB
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId


async def create_response(user_id: str, response: ResponseInDB):
    """
    Save a new response to the database.
    Prevents duplicate submissions for the same date.
    """
    # Check if user already submitted for this date
    existing_response = await responses_collection.find_one({
        "userId": user_id, 
        "date": response.date
    })
    
    # If they already submitted, don't allow duplicate
    if existing_response:
        raise HTTPException(
            status_code=400, 
            detail="Response for this date already submitted"
        )

    # Add user ID and timestamp to response
    response.userId = user_id
    response.submittedAt = datetime.utcnow()
    
    # Save to database and return the ID
    result = await responses_collection.insert_one(response.dict())
    return result.inserted_id

async def get_responses(user_id: str, start_date=None, end_date=None):
    """
    Get all responses for a user.
    Can filter by date range if provided.
    Returns newest responses first.
    """
    # Start with query for this user
    query = {"userId": user_id}
    
    # Add date filters if provided
    if start_date:
        query["submittedAt"] = {"$gte": start_date}  # Greater than or equal
    if end_date:
        query["submittedAt"] = {"$lte": end_date}  # Less than or equal
    
    # Get responses sorted by date (newest first)
    cursor = responses_collection.find(query).sort("submittedAt", -1)
    return await cursor.to_list(length=None)

async def get_response_by_id(response_id: str):
    """
    Get one specific response by its ID.
    Returns None if not found or invalid ID.
    """
    try:
        # Convert string ID to MongoDB ObjectId and find the response
        return await responses_collection.find_one({"_id": ObjectId(response_id)})
    except Exception:
        # If ID is invalid, return None instead of crashing
        return None
