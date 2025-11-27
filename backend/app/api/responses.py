# User responses API endpoints
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.models import ResponseCreate, AnswerSelection
from app.crud.response import create_response, get_responses, get_response_by_id, get_all_responses_for_analytics
from app.api.auth import get_current_user
from app.supabase_client import supabase
from app.cache import cache_service
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List, Optional
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

async def validate_answer_selection(answer: AnswerSelection, question_id: str):
    """Validate that answer selection matches question type"""
    try:
        # Fetch question to check type
        question_result = supabase.table("questions").select("type").eq("id", question_id).execute()
        if not question_result.data:
            raise HTTPException(status_code=400, detail=f"Question {question_id} not found")
        
        question_type = question_result.data[0]["type"]
        
        # Validate single-select
        if question_type == "single_select":
            if len(answer.selected_option_ids) != 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question {question_id} requires exactly one selection"
                )
        
        # Validate multi-select (at least one selection)
        elif question_type == "multi_select":
            if len(answer.selected_option_ids) == 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question {question_id} requires at least one selection"
                )
        
        # Validate sub-questions if present
        if answer.sub_question_answers:
            # Fetch sub-questions for this question with triggering_option_value
            sub_questions_result = supabase.table("sub_questions").select("id, type, triggering_option_value").eq("parent_question_id", question_id).execute()
            sub_questions = {str(sq["id"]): sq for sq in (sub_questions_result.data or [])}
            
            # For questions with conditional sub-questions, check if main options were selected
            question_options_result = supabase.table("question_options").select("id, option_value").eq("question_id", question_id).execute()
            question_options = {str(opt["id"]): opt["option_value"] for opt in (question_options_result.data or [])}
            
            for sub_q_id, option_ids in answer.sub_question_answers.items():
                # Skip empty sub-question answers
                if not option_ids or len(option_ids) == 0:
                    continue
                
                if sub_q_id not in sub_questions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Sub-question {sub_q_id} not found for question {question_id}"
                    )
                
                sub_q = sub_questions[sub_q_id]
                sub_q_type = sub_q["type"]
                
                # If sub-question has a triggering_option_value, verify the main option was selected
                if sub_q.get("triggering_option_value"):
                    # Find if the triggering main option was selected
                    triggering_value = sub_q["triggering_option_value"]
                    main_option_selected = any(
                        question_options.get(str(opt_id)) == triggering_value 
                        for opt_id in answer.selected_option_ids
                    )
                    
                    if not main_option_selected:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Sub-question {sub_q_id} cannot be answered without selecting its corresponding main option"
                        )
                
                # Validate sub-question answer format
                if sub_q_type == "single_select" and len(option_ids) != 1:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Sub-question {sub_q_id} requires exactly one selection"
                    )
                elif sub_q_type == "multi_select" and len(option_ids) == 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Sub-question {sub_q_id} requires at least one selection"
                    )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Validation failed: {str(e)}")

@router.post("/")
@limiter.limit("10/minute")
async def submit_response(
    request: Request,
    response_data: ResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit daily responses"""
    user_id = current_user["uid"]
    
    if not response_data.answers:
        raise HTTPException(
            status_code=400,
            detail="Must provide at least one answer"
        )
    
    logger.info(f"Submitting response for user {user_id} with {len(response_data.answers)} answers")
    
    # Validate all answers
    for answer in response_data.answers:
        try:
            await validate_answer_selection(answer, str(answer.question_id))
        except HTTPException as e:
            logger.error(f"Validation failed for question {answer.question_id}: {e.detail}")
            raise e
        except Exception as e:
            logger.error(f"Validation error for question {answer.question_id}: {e}")
            raise HTTPException(status_code=400, detail=f"Validation failed for question {answer.question_id}: {str(e)}")
    
    try:
        response_id = await create_response(user_id, response_data.date, response_data.answers)
        
        await cache_service.invalidate_user_cache(user_id)
        
        logger.info(f"Response {response_id} submitted successfully for user {user_id}")
        
        return {
            "message": "Response submitted successfully",
            "response_id": response_id,
            "date": response_data.date
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error submitting response: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
@limiter.limit("60/minute")
async def get_user_responses(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """Get user responses with pagination"""
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
    
    skip = (page - 1) * page_size
    responses, total_count = await get_responses(user_id, start_dt, end_dt, limit=page_size, skip=skip)
    
    # Convert datetime to ISO format strings
    for response in responses:
        if "submitted_at" in response and response["submitted_at"]:
            if isinstance(response["submitted_at"], str):
                pass  # Already a string
            else:
                response["submitted_at"] = response["submitted_at"].isoformat()
    
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
    
    return {
        "data": responses,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@router.get("/{response_id}")
async def get_single_response(
    response_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single response by ID"""
    user_id = current_user["uid"]
    
    try:
        response = await get_response_by_id(response_id)
        if not response:
            raise HTTPException(status_code=404, detail="Response not found")
        
        if str(response["user_id"]) != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Convert datetime to ISO format
        if "submitted_at" in response and response["submitted_at"]:
            if not isinstance(response["submitted_at"], str):
                response["submitted_at"] = response["submitted_at"].isoformat()
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today/status")
@limiter.limit("30/minute")
async def check_today_status(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Check if user has submitted responses for today"""
    user_id = current_user["uid"]
    today = date.today().strftime("%Y-%m-%d")
    
    try:
        result = supabase.table("responses").select("id").eq("user_id", user_id).eq("date", today).execute()
        
        today_response = result.data[0] if result.data else None
        
        return {
            "date": today,
            "submitted": today_response is not None,
            "response_id": str(today_response["id"]) if today_response else None
        }
    except Exception as e:
        logger.error(f"Error checking today status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
