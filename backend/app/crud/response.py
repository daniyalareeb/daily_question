# Response database operations using Supabase
from app.supabase_client import supabase
from app.models import ResponseInDB, AnswerSelection
from fastapi import HTTPException
from datetime import datetime
from typing import Optional, Tuple, List, Dict
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

async def create_response(user_id: str, date: str, answers: List[AnswerSelection]) -> str:
    """Create a new response with all answer selections"""
    try:
        # Check if response already exists for this date
        existing_response = supabase.table("responses").select("id").eq("user_id", user_id).eq("date", date).execute()
        
        if existing_response.data:
            raise HTTPException(
                status_code=400,
                detail="Response for this date already submitted"
            )
        
        # Create response record
        response_data = {
            "user_id": user_id,
            "date": date,
            "submitted_at": datetime.utcnow().isoformat()
        }
        
        response_result = supabase.table("responses").insert(response_data).execute()
        
        if not response_result.data:
            raise HTTPException(status_code=500, detail="Failed to create response")
        
        response_id = response_result.data[0]["id"]
        
        # Create answer records
        answer_records = []
        for answer in answers:
            # Main question answer
            if answer.selected_option_ids:
                for option_id in answer.selected_option_ids:
                    answer_records.append({
                        "response_id": str(response_id),
                        "question_id": str(answer.question_id),
                        "sub_question_id": None,
                        "selected_option_id": str(option_id)
                    })
            
            # Sub-question answers
            if answer.sub_question_answers:
                for sub_q_id, option_ids in answer.sub_question_answers.items():
                    for option_id in option_ids:
                        answer_records.append({
                            "response_id": str(response_id),
                            "question_id": str(answer.question_id),
                            "sub_question_id": str(sub_q_id),
                            "selected_option_id": str(option_id)
                        })
        
        # Insert all answer records
        if answer_records:
            supabase.table("response_answers").insert(answer_records).execute()
        
        return str(response_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating response: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create response: {str(e)}")

async def get_responses(
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 1000,
    skip: int = 0
) -> Tuple[List[Dict], int]:
    """Get user responses with pagination"""
    try:
        query = supabase.table("responses").select("*", count="exact").eq("user_id", user_id)
        
        if start_date:
            query = query.gte("submitted_at", start_date.isoformat())
        if end_date:
            query = query.lte("submitted_at", end_date.isoformat())
        
        query = query.order("submitted_at", desc=True).range(skip, skip + limit - 1)
        
        result = query.execute()
        
        responses = result.data if result.data else []
        total_count = result.count if hasattr(result, 'count') else len(responses)
        
        # Fetch answers for each response
        for response in responses:
            response_id = response["id"]
            answers_result = supabase.table("response_answers").select("*").eq("response_id", response_id).execute()
            response["answers"] = answers_result.data if answers_result.data else []
        
        return responses, total_count
    except Exception as e:
        logger.error(f"Error getting responses: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get responses: {str(e)}")

async def get_all_responses_for_analytics(user_id: str, max_responses: int = 2000) -> List[Dict]:
    """Get all user responses for analytics"""
    try:
        # Ensure user_id is a string (UUID format)
        user_id_str = str(user_id)
        
        # Fetch responses - order by date (ascending) for better analytics processing
        result = supabase.table("responses").select("*").eq("user_id", user_id_str).order("date", desc=False).limit(max_responses).execute()
        
        responses = result.data if result.data else []
        
        # Only log warnings if no responses (not every time)
        if len(responses) == 0:
            logger.debug(f"No responses found for user")
        
        # Fetch answers for all responses
        if responses:
            response_ids = [str(r["id"]) for r in responses]
            answers_result = supabase.table("response_answers").select("*").in_("response_id", response_ids).execute()
            answers_data = answers_result.data if answers_result.data else []
            
            # Group answers by response_id
            answers_by_response = {}
            for answer in answers_data:
                resp_id = answer["response_id"]
                if resp_id not in answers_by_response:
                    answers_by_response[resp_id] = []
                answers_by_response[resp_id].append(answer)
            
            # Attach answers to responses
            for response in responses:
                response["answers"] = answers_by_response.get(str(response["id"]), [])
        
        return responses
    except Exception as e:
        logger.error(f"Error getting responses for analytics: {e}")
        return []

async def get_response_by_id(response_id: str) -> Optional[Dict]:
    """Get a single response by ID"""
    try:
        result = supabase.table("responses").select("*").eq("id", response_id).execute()
        
        if not result.data:
            return None
        
        response = result.data[0]
        
        # Fetch answers
        answers_result = supabase.table("response_answers").select("*").eq("response_id", response_id).execute()
        response["answers"] = answers_result.data if answers_result.data else []
        
        return response
    except Exception as e:
        logger.error(f"Error getting response by id: {e}")
        return None
