# Questions API endpoints
# 
# Performance Optimizations:
# - Questions data is cached (static data, changes infrequently)
# - Single cache for all questions (shared across all users)
# - Cache invalidated on server restart or manual clear
#
from fastapi import APIRouter, HTTPException
from app.supabase_client import supabase
from app.models import Question, QuestionOption, SubQuestion, SubQuestionOption
from app.cache import cache_service
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory cache for questions (static data)
_questions_cache: Optional[List[dict]] = None

def build_question_tree(question_data: dict, options_data: List[dict], sub_questions_data: List[dict], sub_question_options_data: List[dict]) -> dict:
    """Build complete question structure with options and sub-questions"""
    question = {
        "id": str(question_data["id"]),
        "order": question_data["order"],
        "text": question_data["text"],
        "type": question_data["type"],
        "required": question_data.get("required", True),
        "options": [],
        "sub_questions": []
    }
    
    # Add options for this question
    question_options = [opt for opt in options_data if str(opt["question_id"]) == str(question_data["id"])]
    question["options"] = [
        {
            "id": str(opt["id"]),
            "question_id": str(opt["question_id"]),
            "option_text": opt["option_text"],
            "option_value": opt["option_value"],
            "order": opt["order"]
        }
        for opt in sorted(question_options, key=lambda x: x["order"])
    ]
    
    # Add sub-questions if this question has them
    if question_data["type"] == "with_sub_questions":
        sub_questions = [sq for sq in sub_questions_data if str(sq["parent_question_id"]) == str(question_data["id"])]
        for sub_q in sorted(sub_questions, key=lambda x: x["order"]):
            sub_question = {
                "id": str(sub_q["id"]),
                "parent_question_id": str(sub_q["parent_question_id"]),
                "sub_question_text": sub_q["sub_question_text"],
                "type": sub_q["type"],
                "order": sub_q["order"],
                "triggering_option_value": sub_q.get("triggering_option_value"),
                "options": []
            }
            
            # Add options for this sub-question
            sub_q_options = [opt for opt in sub_question_options_data if str(opt["sub_question_id"]) == str(sub_q["id"])]
            sub_question["options"] = [
                {
                    "id": str(opt["id"]),
                    "sub_question_id": str(opt["sub_question_id"]),
                    "option_text": opt["option_text"],
                    "option_value": opt["option_value"],
                    "order": opt["order"]
                }
                for opt in sorted(sub_q_options, key=lambda x: x["order"])
            ]
            
            question["sub_questions"].append(sub_question)
    
    return question

async def _fetch_and_build_questions() -> List[dict]:
    """Fetch and build questions tree from database"""
    try:
        # Fetch all questions
        questions_response = supabase.table("questions").select("*").order("order").execute()
        questions_data = questions_response.data if questions_response.data else []
        
        if not questions_data:
            return []
        
        # Fetch all question options
        options_response = supabase.table("question_options").select("*").execute()
        options_data = options_response.data if options_response.data else []
        
        # Fetch all sub-questions
        sub_questions_response = supabase.table("sub_questions").select("*").execute()
        sub_questions_data = sub_questions_response.data if sub_questions_response.data else []
        
        # Fetch all sub-question options
        sub_question_options_response = supabase.table("sub_question_options").select("*").execute()
        sub_question_options_data = sub_question_options_response.data if sub_question_options_response.data else []
        
        # Build complete question tree
        questions = []
        for q_data in questions_data:
            question = build_question_tree(q_data, options_data, sub_questions_data, sub_question_options_data)
            questions.append(question)
        
        return questions
    except Exception as e:
        logger.error(f"Error fetching questions: {e}", exc_info=True)
        raise

@router.get("/")
async def get_all_questions():
    """Get all questions with their options and sub-questions (cached)"""
    global _questions_cache
    
    # Check in-memory cache first (fastest)
    if _questions_cache is not None:
        return _questions_cache
    
    # Check Redis cache (with error handling)
    cache_key = "questions:all"
    try:
        cached_result = await cache_service.get(cache_key)
        if cached_result:
            _questions_cache = cached_result  # Also store in memory
            return cached_result
    except Exception:
        pass  # Silently fall through to database fetch
    
    # Fetch from database
    try:
        questions = await _fetch_and_build_questions()
        
        # Cache in both memory and Redis (with error handling)
        _questions_cache = questions
        try:
            await cache_service.set(cache_key, questions, ttl_seconds=3600)  # Cache for 1 hour
        except Exception:
            pass  # Silently continue if cache fails
        
        return questions
    except Exception as e:
        logger.error(f"Error fetching questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")

@router.get("/{question_id}")
async def get_question_by_id(question_id: str):
    """Get a specific question by ID with all options and sub-questions (uses cache)"""
    try:
        # Get all questions from cache (more efficient than individual query)
        all_questions = await get_all_questions()
        
        # Find the specific question
        question = next((q for q in all_questions if str(q["id"]) == str(question_id)), None)
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching question: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch question: {str(e)}")

@router.post("/clear-cache")
async def clear_questions_cache():
    """Clear questions cache (admin endpoint - for testing/debugging)"""
    global _questions_cache
    _questions_cache = None
    await cache_service.delete("questions:all")
    return {"message": "Questions cache cleared"}
