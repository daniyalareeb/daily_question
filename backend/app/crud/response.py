# Response database operations
from app.database import responses_collection
from app.models import ResponseInDB
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId
from typing import Optional, Tuple

async def create_response(user_id: str, response: ResponseInDB):
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

async def get_responses(
    user_id: str, 
    start_date=None, 
    end_date=None,
    limit: int = 1000,
    skip: int = 0
) -> Tuple[list, int]:
    query = {"userId": user_id}
    
    if start_date:
        query["submittedAt"] = {"$gte": start_date}
    if end_date:
        query["submittedAt"] = {"$lte": end_date}
    
    total_count = await responses_collection.count_documents(query)
    
    cursor = (
        responses_collection
        .find(query)
        .sort("submittedAt", -1)
        .skip(skip)
        .limit(limit)
    )
    
    responses = await cursor.to_list(length=limit)
    return responses, total_count

async def get_all_responses_for_analytics(user_id: str, max_responses: int = 2000):
    """
    Get user responses for analytics with memory limit.
    
    Limits to most recent 2000 responses (~5.5 years of daily data).
    This prevents memory issues while providing comprehensive analytics.
    """
    query = {"userId": user_id}
    cursor = (
        responses_collection
        .find(query)
        .sort("submittedAt", -1)
        .limit(max_responses)
    )
    return await cursor.to_list(length=max_responses)

async def get_response_by_id(response_id: str):
    try:
        return await responses_collection.find_one({"_id": ObjectId(response_id)})
    except Exception:
        return None
