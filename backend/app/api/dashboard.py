# Dashboard analytics API endpoints
# 
# Performance Optimizations:
# - Unified /health-wellness endpoint batches all health & wellness queries (1 request instead of 10)
# - Question IDs and options map are cached in memory (pre-warmed on startup)
# - Response data is cached per user (5 minute TTL)
# - All endpoints use cached options_map instead of rebuilding it
#
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.api.auth import get_current_user
from app.crud.response import get_all_responses_for_analytics
from app.services.analytics_service import (
    calculate_option_frequency,
    calculate_option_trends,
    calculate_daily_progress,
    calculate_mood_score,
    calculate_daily_mood_chart,
    calculate_weekly_summary,
    filter_responses_by_time,
    get_question_analytics,
    get_sub_question_analytics,
    calculate_sleep_quality_trend,
    calculate_sleep_duration_distribution,
    calculate_bedtime_pattern,
    calculate_sleep_score,
    calculate_nutrition_ratio,
    calculate_meal_frequency,
    calculate_nutrition_score,
    calculate_exercise_frequency,
    calculate_exercise_distribution,
    calculate_hydration_consistency
)
from app.supabase_client import supabase
from app.cache import cache_service
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def build_options_map() -> Dict[str, Dict]:
    """Build a map of option_id -> option_data for quick lookup"""
    try:
        # Fetch all question options
        q_options_result = supabase.table("question_options").select("*").execute()
        q_options = q_options_result.data if q_options_result.data else []
        
        # Fetch all sub-question options
        sq_options_result = supabase.table("sub_question_options").select("*").execute()
        sq_options = sq_options_result.data if sq_options_result.data else []
        
        options_map = {}
        for opt in q_options + sq_options:
            options_map[str(opt["id"])] = {
                "option_text": opt["option_text"],
                "option_value": opt["option_value"]
            }
        
        return options_map
    except Exception as e:
        logger.error(f"Error building options map: {e}")
        return {}

# Cache for question IDs and options map (in-memory cache, refreshed on startup)
_question_ids_cache = {}
_options_map_cache = None

def get_all_question_ids() -> Dict[int, str]:
    """Get all question IDs by order number (cached)"""
    global _question_ids_cache
    if not _question_ids_cache:
        try:
            questions_result = supabase.table("questions").select("id,order").execute()
            _question_ids_cache = {
                q.get("order"): str(q["id"])
                for q in (questions_result.data or [])
                if q.get("order") is not None
            }
            logger.info(f"Cached {len(_question_ids_cache)} question IDs")
        except Exception as e:
            logger.error(f"Error getting question IDs: {e}")
            _question_ids_cache = {}
    return _question_ids_cache

def get_question_id_by_order(order: int) -> Optional[str]:
    """Get question ID by order number (uses cache)"""
    question_ids = get_all_question_ids()
    return question_ids.get(order)

def get_cached_options_map() -> Dict[str, Dict]:
    """Get options map (cached)"""
    global _options_map_cache
    if _options_map_cache is None:
        _options_map_cache = build_options_map()
        logger.info("Cached options map")
    return _options_map_cache

@router.get("/summary")
@limiter.limit("30/minute")
async def get_dashboard_summary(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard summary"""
    user_id = current_user["uid"]
    
    cache_key = cache_service._make_key("dashboard_summary", user_id)
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        logger.info(f"Returning cached dashboard summary for user {user_id}, total_reflections: {cached_result.get('total_reflections', 0)}")
        return cached_result
    
    logger.info(f"Fetching fresh dashboard data for user {user_id}")
    responses = await get_all_responses_for_analytics(user_id)
    logger.info(f"Found {len(responses)} responses for user {user_id}")
    
    # Build options map for analytics (cached)
    options_map = get_cached_options_map()
    
    # Get Q1 ID for mood calculations (cached)
    question_ids = get_all_question_ids()
    q1_id = question_ids.get(1)
    
    # Calculate metrics
    daily_progress = calculate_daily_progress(responses)
    mood_score = calculate_mood_score(responses, q1_id, options_map) if q1_id else {
        "overall_score": 50,
        "trend": "neutral",
        "positive_count": 0,
        "negative_count": 0
    }
    weekly_summary = calculate_weekly_summary(responses, q1_id, options_map) if q1_id else {
        "days_completed": 0,
        "top_selections": [],
        "weekly_trend": "neutral",
        "mood_score": 50
    }
    
    # Get top selections across all questions
    top_selections = calculate_option_frequency(responses, options_map=options_map)
    
    # Get daily mood chart
    daily_mood = calculate_daily_mood_chart(responses, q1_id, days=7, options_map=options_map) if q1_id else {}
    
    # Get last submission date
    last_submission_date = None
    if responses:
        dates = sorted([r["date"] for r in responses], reverse=True)
        last_submission_date = dates[0] if dates else None
    
    result = {
        "daily_progress": {
            "days_this_month": daily_progress["days_this_month"],
            "current_streak": daily_progress["current_streak"],
            "longest_streak": daily_progress["longest_streak"],
            "total_days": daily_progress["total_days"]
        },
        "mood_score": {
            "overall_score": mood_score["overall_score"],
            "trend": mood_score["trend"],
            "positive_count": mood_score["positive_count"],
            "negative_count": mood_score["negative_count"]
        },
        "weekly_summary": weekly_summary,
        "top_selections": {
            "top_10": list(top_selections["top_options"].keys())[:10],
            "counts": dict(list(top_selections["top_options"].items())[:10])
        },
        "daily_mood": daily_mood,
        "total_reflections": len(responses),
        "last_submission": last_submission_date
    }
    
    await cache_service.set(cache_key, result, ttl_seconds=300)
    return result

@router.get("/frequency-chart")
@limiter.limit("30/minute")
async def get_frequency_chart(
    request: Request,
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    sub_question_id: Optional[str] = Query(None, description="Sub-question ID to filter by"),
    time_filter: str = Query("recent", description="Time filter"),
    current_user: dict = Depends(get_current_user)
):
    """Get frequency chart for question or sub-question options"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    # Filter by time
    filtered_responses = filter_responses_by_time(responses, time_filter)
    
    # Build options map
    options_map = get_cached_options_map()
    
    # Calculate frequency
    frequency_data = calculate_option_frequency(
        filtered_responses,
        question_id=question_id,
        sub_question_id=sub_question_id,
        options_map=options_map
    )
    
    return {
        "question_id": question_id,
        "sub_question_id": sub_question_id,
        "time_filter": time_filter,
        "data": frequency_data
    }

@router.get("/trend-line/{option_text}")
@limiter.limit("30/minute")
async def get_trend_line(
    request: Request,
    option_text: str,
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    current_user: dict = Depends(get_current_user)
):
    """Get trend data for a specific option"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    # Build options map
    options_map = get_cached_options_map()
    
    # Get trend data
    trend_data = calculate_option_trends(responses, option_text, question_id, options_map)
    
    return {
        "option_text": option_text,
        "question_id": question_id,
        "data": trend_data
    }

@router.get("/question-analytics/{question_id}")
@limiter.limit("30/minute")
async def get_question_analytics_endpoint(
    request: Request,
    question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics for a specific question"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    options_map = get_cached_options_map()
    analytics = get_question_analytics(responses, question_id, options_map)
    
    return analytics

@router.get("/sub-question-analytics/{question_id}/{sub_question_id}")
@limiter.limit("30/minute")
async def get_sub_question_analytics_endpoint(
    request: Request,
    question_id: str,
    sub_question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics for a specific sub-question"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    options_map = get_cached_options_map()
    analytics = get_sub_question_analytics(responses, question_id, sub_question_id, options_map)
    
    return analytics

@router.get("/weekly-mood")
@limiter.limit("30/minute")
async def get_weekly_mood(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get weekly mood chart data"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    # Get Q1 ID (cached)
    question_ids = get_all_question_ids()
    q1_id = question_ids.get(1)
    
    if not q1_id:
        return {"daily_mood": {}}
    
    options_map = get_cached_options_map()
    daily_mood = calculate_daily_mood_chart(responses, q1_id, days=7, options_map=options_map)
    
    return {
        "daily_mood": daily_mood
    }

# ========== NEW HEALTH & WELLNESS ENDPOINTS ==========

@router.get("/sleep/quality-trend")
@limiter.limit("30/minute")
async def get_sleep_quality_trend(
    request: Request,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """Get sleep quality trend over time"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q6_id = get_question_id_by_order(6)  # Sleep quality question
    if not q6_id:
        return {"trend": {}}
    
    options_map = get_cached_options_map()
    trend = calculate_sleep_quality_trend(responses, q6_id, days=days, options_map=options_map)
    
    return {"trend": trend}

@router.get("/sleep/duration-distribution")
@limiter.limit("30/minute")
async def get_sleep_duration_distribution(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get sleep duration distribution"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q8_id = get_question_id_by_order(8)  # Sleep duration question
    if not q8_id:
        return {"distribution": {}, "percentages": {}, "total_responses": 0}
    
    options_map = get_cached_options_map()
    distribution = calculate_sleep_duration_distribution(responses, q8_id, options_map=options_map)
    
    return distribution

@router.get("/sleep/bedtime-pattern")
@limiter.limit("30/minute")
async def get_bedtime_pattern(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get bedtime pattern frequency"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q7_id = get_question_id_by_order(7)  # Bedtime question
    if not q7_id:
        return {"frequency": {}, "percentages": {}, "total_responses": 0}
    
    options_map = get_cached_options_map()
    pattern = calculate_bedtime_pattern(responses, q7_id, options_map=options_map)
    
    return pattern

@router.get("/sleep/score")
@limiter.limit("30/minute")
async def get_sleep_score(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get composite sleep score"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q6_id = get_question_id_by_order(6)  # Sleep quality
    q7_id = get_question_id_by_order(7)  # Bedtime
    q8_id = get_question_id_by_order(8)  # Sleep duration
    
    if not all([q6_id, q7_id, q8_id]):
        return {"score": 0, "quality_score": 0, "duration_score": 0, "consistency_score": 0}
    
    options_map = get_cached_options_map()
    score = calculate_sleep_score(responses, q6_id, q8_id, q7_id, options_map=options_map)
    
    return score

@router.get("/nutrition/ratio")
@limiter.limit("30/minute")
async def get_nutrition_ratio(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get healthy vs easy food ratio"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q2_id = get_question_id_by_order(2)  # Nutrition question
    if not q2_id:
        return {"healthy_count": 0, "easy_count": 0, "total_meals": 0, "healthy_percentage": 0, "easy_percentage": 0}
    
    options_map = get_cached_options_map()
    ratio = calculate_nutrition_ratio(responses, q2_id, options_map=options_map)
    
    return ratio

@router.get("/nutrition/meal-frequency")
@limiter.limit("30/minute")
async def get_meal_frequency(
    request: Request,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """Get meal frequency over time"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q2_id = get_question_id_by_order(2)  # Nutrition question
    if not q2_id:
        return {}
    
    options_map = get_cached_options_map()
    frequency = calculate_meal_frequency(responses, q2_id, days=days, options_map=options_map)
    
    return {"frequency": frequency}

@router.get("/nutrition/score")
@limiter.limit("30/minute")
async def get_nutrition_score(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get nutrition score"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q2_id = get_question_id_by_order(2)  # Nutrition question
    if not q2_id:
        return {"score": 0, "healthy_percentage": 0, "total_meals": 0}
    
    options_map = get_cached_options_map()
    score = calculate_nutrition_score(responses, q2_id, options_map=options_map)
    
    return score

@router.get("/exercise/frequency")
@limiter.limit("30/minute")
async def get_exercise_frequency(
    request: Request,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """Get exercise frequency over time"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q4_id = get_question_id_by_order(4)  # Exercise question
    if not q4_id:
        return {}
    
    options_map = get_cached_options_map()
    frequency = calculate_exercise_frequency(responses, q4_id, days=days, options_map=options_map)
    
    return {"frequency": frequency}

@router.get("/exercise/distribution")
@limiter.limit("30/minute")
async def get_exercise_distribution(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get exercise duration distribution"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q4_id = get_question_id_by_order(4)  # Exercise question
    if not q4_id:
        return {"distribution": {}, "percentages": {}, "total_responses": 0}
    
    options_map = get_cached_options_map()
    distribution = calculate_exercise_distribution(responses, q4_id, options_map=options_map)
    
    return distribution

@router.get("/hydration/consistency")
@limiter.limit("30/minute")
async def get_hydration_consistency(
    request: Request,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """Get hydration consistency metrics"""
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    q3_id = get_question_id_by_order(3)  # Hydration question
    if not q3_id:
        return {"adequate_days": 0, "low_days": 0, "total_days": 0, "adequate_percentage": 0, "consistency_score": 0}
    
    options_map = get_cached_options_map()
    consistency = calculate_hydration_consistency(responses, q3_id, days=days, options_map=options_map)
    
    return consistency

# ========== OPTIMIZED UNIFIED HEALTH & WELLNESS ENDPOINT ==========

@router.get("/health-wellness")
@limiter.limit("30/minute")
async def get_health_wellness_all(
    request: Request,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """Get all health & wellness data in a single optimized request"""
    user_id = current_user["uid"]
    
    # Check cache first
    cache_key = cache_service._make_key("health_wellness", user_id, days)
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        logger.info(f"Returning cached health & wellness data for user {user_id}")
        return cached_result
    
    logger.info(f"Fetching fresh health & wellness data for user {user_id}")
    
    # Fetch responses ONCE (this is the expensive operation)
    responses = await get_all_responses_for_analytics(user_id)
    logger.info(f"Found {len(responses)} responses for user {user_id}")
    
    # Get all question IDs ONCE (cached)
    question_ids = get_all_question_ids()
    q2_id = question_ids.get(2)  # Nutrition
    q3_id = question_ids.get(3)  # Hydration
    q4_id = question_ids.get(4)  # Exercise
    q6_id = question_ids.get(6)  # Sleep quality
    q7_id = question_ids.get(7)  # Bedtime
    q8_id = question_ids.get(8)  # Sleep duration
    
    # Get options map ONCE (cached)
    options_map = get_cached_options_map()
    
    # Calculate all metrics (synchronous, but all done in one request)
    # Sleep metrics
    sleep_quality_trend = calculate_sleep_quality_trend(responses, q6_id, days, options_map) if q6_id else {}
    sleep_duration_dist = calculate_sleep_duration_distribution(responses, q8_id, options_map) if q8_id else {"distribution": {}, "percentages": {}, "total_responses": 0}
    bedtime_pattern = calculate_bedtime_pattern(responses, q7_id, options_map) if q7_id else {"frequency": {}, "percentages": {}, "total_responses": 0}
    sleep_score = calculate_sleep_score(responses, q6_id, q8_id, q7_id, options_map) if all([q6_id, q7_id, q8_id]) else {"score": 0, "quality_score": 0, "duration_score": 0, "consistency_score": 0}
    
    # Nutrition metrics
    nutrition_ratio = calculate_nutrition_ratio(responses, q2_id, options_map) if q2_id else {"healthy_count": 0, "easy_count": 0, "total_meals": 0, "healthy_percentage": 0, "easy_percentage": 0}
    meal_frequency = calculate_meal_frequency(responses, q2_id, days, options_map) if q2_id else {}
    nutrition_score = calculate_nutrition_score(responses, q2_id, options_map) if q2_id else {"score": 0, "healthy_percentage": 0, "total_meals": 0}
    
    # Exercise metrics
    exercise_frequency = calculate_exercise_frequency(responses, q4_id, days, options_map) if q4_id else {}
    exercise_distribution = calculate_exercise_distribution(responses, q4_id, options_map) if q4_id else {"distribution": {}, "percentages": {}, "total_responses": 0}
    
    # Hydration metrics
    hydration_consistency = calculate_hydration_consistency(responses, q3_id, days, options_map) if q3_id else {"adequate_days": 0, "low_days": 0, "total_days": 0, "adequate_percentage": 0, "consistency_score": 0}
    
    result = {
        "sleep": {
            "quality_trend": sleep_quality_trend,
            "duration_distribution": sleep_duration_dist,
            "bedtime_pattern": bedtime_pattern,
            "score": sleep_score,
        },
        "nutrition": {
            "ratio": nutrition_ratio,
            "meal_frequency": meal_frequency,
            "score": nutrition_score,
        },
        "exercise": {
            "frequency": exercise_frequency,
            "distribution": exercise_distribution,
        },
        "hydration": {
            "consistency": hydration_consistency,
        },
    }
    
    # Cache for 5 minutes
    await cache_service.set(cache_key, result, ttl_seconds=300)
    logger.info(f"Health & wellness data calculated and cached for user {user_id}")
    
    return result
