"""
Responses API Router

This router handles submission and retrieval of daily reflection responses.
All endpoints require Firebase authentication via get_current_user dependency.

Key Features:
- Submit daily responses (one per day per user)
- Extract keywords using NLP for analytics
- Store responses in MongoDB
- Retrieve user's historical responses
- Check submission status for today

Dependencies:
- auth.py: Provides get_current_user for Firebase authentication
- models.py: Defines ResponseCreate and ResponseInDB Pydantic models
- crud/response.py: Handles database operations
- services/nlp_service.py: Provides keyword extraction for text analysis

Data Flow:
Frontend Submission → NLP Keyword Extraction → MongoDB Storage → Dashboard Analytics

Critical: Each user can only submit ONCE per day to prevent duplicate entries.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.models import ResponseCreate, ResponseInDB, Answer
from app.crud.response import create_response, get_responses, get_response_by_id
from app.api.auth import get_current_user
from app.services.nlp_service import extract_keywords_from_response
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId

router = APIRouter()

@router.post("/")
async def submit_response(
    response_data: ResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit daily responses to the reflection questions.
    
    This endpoint:
    1. Validates that all 6 questions are answered
    2. Extracts keywords from each answer using NLP
    3. Saves response to MongoDB with user ID and timestamp
    4. Prevents duplicate submissions for the same date
    
    Process:
    - Extracts keywords from each answer using NLTK
    - Aggregates all keywords for overall analysis
    - Checks for duplicate date submission in crud layer
    - Saves to responses collection in MongoDB
    
    Request Body:
        {
            "date": "2024-10-25",
            "answers": [
                {"questionId": "q_1", "text": "I feel great about AI"},
                ... (6 total)
            ]
        }
    
    Returns:
        {"message": "Response submitted successfully", "response_id": "...", "date": "..."}
    
    Errors:
        - 400: Must answer all 6 questions
        - 400: Response for this date already submitted (prevent duplicates)
        - 500: Database or processing error
    
    Used by:
    - Frontend Questions.js: Submits user responses
    - Frontend auto-checks for duplicates before allowing submission
    
    Database Impact:
    - Creates new document in responses collection
    - Stores: date, userId, answers (with keywords), submittedAt timestamp
    """
    user_id = current_user["uid"]
    
    # Validate that all 6 questions are answered
    # Prevents partial submissions that would break analytics
    if len(response_data.answers) != 6:
        raise HTTPException(
            status_code=400, 
            detail="Must answer all 6 questions"
        )
    
    # Extract keywords for each answer using NLP
    # This processes the raw text and identifies key themes/words
    # Used later for keyword frequency analysis in dashboard
    processed_answers = []
    all_keywords = []
    
    for answer in response_data.answers:
        # Call NLP service to extract meaningful keywords from text
        # Returns list like: ["happy", "excited", "learning"]
        keywords = await extract_keywords_from_response(answer.text)
        processed_answer = Answer(
            questionId=answer.questionId,
            text=answer.text,
            keywords=keywords  # Store extracted keywords for analytics
        )
        processed_answers.append(processed_answer)
        all_keywords.extend(keywords)
    
    # Create response with processed data and required fields
    # userId: Links response to user (from Firebase auth)
    # submittedAt: Timestamp for tracking submission time
    # keywords_agg: All unique keywords across all 6 answers
    response_in_db = ResponseInDB(
        date=response_data.date,
        answers=processed_answers,
        keywords_agg=list(set(all_keywords)),  # Remove duplicates
        userId=user_id,
        submittedAt=datetime.now()
    )
    
    try:
        response_id = await create_response(user_id, response_in_db)
        return {
            "message": "Response submitted successfully",
            "response_id": str(response_id),
            "date": response_data.date
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_user_responses(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's responses with optional date filtering"""
    user_id = current_user["uid"]
    
    # Convert string dates to datetime objects if provided
    start_dt = None
    end_dt = None
    
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    responses = await get_responses(user_id, start_dt, end_dt)
    
    # Convert ObjectId to string for JSON serialization
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    return responses

@router.get("/{response_id}")
async def get_single_response(
    response_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific response by ID"""
    user_id = current_user["uid"]
    
    try:
        response = await get_response_by_id(response_id)
        if not response:
            raise HTTPException(status_code=404, detail="Response not found")
        
        # Check if response belongs to current user
        if response["userId"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Convert ObjectId to string
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today/status")
async def check_today_status(current_user: dict = Depends(get_current_user)):
    """Check if user has already submitted responses for today"""
    user_id = current_user["uid"]
    today = date.today().strftime("%Y-%m-%d")
    
    responses = await get_responses(user_id)
    today_response = next(
        (r for r in responses if r["date"] == today), 
        None
    )
    
    return {
        "date": today,
        "submitted": today_response is not None,
        "response_id": str(today_response["_id"]) if today_response else None
    }
