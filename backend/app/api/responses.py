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
    user_id = current_user["uid"]
    
    if len(response_data.answers) != 6:
        raise HTTPException(
            status_code=400, 
            detail="Must answer all 6 questions"
        )
    
    processed_answers = []
    all_keywords = []
    
    for answer in response_data.answers:
        if not answer.text or not answer.text.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Answer for question {answer.questionId} cannot be empty"
            )
        
        keywords = await extract_keywords_from_response(answer.text)
        
        processed_answer = Answer(
            questionId=answer.questionId,
            text=answer.text,
            keywords=keywords
        )
        processed_answers.append(processed_answer)
        all_keywords.extend(keywords)
    
    response_in_db = ResponseInDB(
        date=response_data.date,
        answers=processed_answers,
        keywords_agg=list(set(all_keywords)),
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
    user_id = current_user["uid"]
    
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
    user_id = current_user["uid"]
    
    try:
        response = await get_response_by_id(response_id)
        if not response:
            raise HTTPException(status_code=404, detail="Response not found")
        
        if response["userId"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
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
