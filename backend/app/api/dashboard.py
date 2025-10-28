from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.auth import get_current_user
from app.crud.response import get_responses
from app.services.analytics_service import (
    get_dashboard_analytics, 
    get_keyword_trends,
    calculate_frequency_charts,
    calculate_trend_lines,
    calculate_daily_progress,
    calculate_positivity_score,
    calculate_weekly_summary
)
from typing import Optional

router = APIRouter()

@router.get("/analytics")
async def get_dashboard_data(
    time_filter: str = Query("recent", description="Time filter: recent, last_week, last_month, all"),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard analytics"""
    user_id = current_user["uid"]
    
    # Validate time filter
    valid_filters = ["recent", "last_week", "last_month", "all"]
    if time_filter not in valid_filters:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid time filter. Must be one of: {', '.join(valid_filters)}"
        )
    
    # Get user responses
    responses = await get_responses(user_id)
    
    # Convert ObjectId to string for JSON serialization
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    # Get analytics
    analytics = get_dashboard_analytics(responses, time_filter)
    
    return analytics

@router.get("/frequency-chart")
async def get_frequency_chart(
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    time_filter: str = Query("recent", description="Time filter"),
    current_user: dict = Depends(get_current_user)
):
    """Get frequency chart data for keywords"""
    user_id = current_user["uid"]
    
    # Get user responses
    responses = await get_responses(user_id)
    
    # Convert ObjectId to string
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    # Calculate frequency chart
    frequency_data = calculate_frequency_charts(responses, question_id)
    
    return {
        "question_id": question_id,
        "time_filter": time_filter,
        "data": frequency_data
    }

@router.get("/trend-line/{keyword}")
async def get_trend_line(
    keyword: str,
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    current_user: dict = Depends(get_current_user)
):
    """Get trend line data for a specific keyword"""
    user_id = current_user["uid"]
    
    # Get user responses
    responses = await get_responses(user_id)
    
    # Convert ObjectId to string
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    # Get trend data
    trend_data = get_keyword_trends(responses, keyword, question_id)
    
    return {
        "keyword": keyword,
        "question_id": question_id,
        "data": trend_data
    }


@router.get("/insights")
async def get_insights(
    keyword: Optional[str] = Query(None, description="Specific keyword to analyze"),
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    current_user: dict = Depends(get_current_user)
):
    """Get AI-generated insights based on user data"""
    user_id = current_user["uid"]
    
    # Get user responses
    responses = await get_responses(user_id)
    
    # Convert ObjectId to string
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    insights = []
    
    if keyword:
        # Get insights for specific keyword
        trend_data = get_keyword_trends(responses, keyword, question_id)
        insights.extend(trend_data["insights"])
    else:
        # Get general insights
        recent_analytics = get_dashboard_analytics(responses, "recent")
        week_analytics = get_dashboard_analytics(responses, "last_week")
        
        # Compare recent vs last week
        recent_keywords = set(recent_analytics["overall"].get("top_keywords", {}).keys())
        week_keywords = set(week_analytics["overall"].get("top_keywords", {}).keys())
        
        new_keywords = recent_keywords - week_keywords
        if new_keywords:
            insights.append(f"New themes emerging: {', '.join(list(new_keywords)[:3])}")
        
        # Check for trends
        for keyword in recent_keywords:
            if keyword in week_keywords:
                recent_count = recent_analytics["overall"].get("absolute_counts", {}).get(keyword, 0)
                week_count = week_analytics["overall"].get("absolute_counts", {}).get(keyword, 0)
                
                if recent_count > week_count * 1.5:
                    insights.append(f"You've been thinking more about '{keyword}' recently")
                elif recent_count < week_count * 0.5:
                    insights.append(f"You've been thinking less about '{keyword}' recently")
    
    return {
        "insights": insights,
        "keyword": keyword,
        "question_id": question_id,
        "total_responses": len(responses)
    }

@router.get("/summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard summary with all new features"""
    user_id = current_user["uid"]
    
    # Get user responses
    responses = await get_responses(user_id)
    
    # Convert ObjectId to string
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    # Calculate all metrics
    daily_progress = calculate_daily_progress(responses)
    positivity = calculate_positivity_score(responses)
    weekly_summary = calculate_weekly_summary(responses)
    top_keywords = calculate_frequency_charts(responses)
    
    return {
        "daily_progress": {
            "days_this_month": daily_progress["days_this_month"],
            "current_streak": daily_progress["current_streak"],
            "longest_streak": daily_progress["longest_streak"],
            "total_days": daily_progress["total_days"]
        },
        "positivity_score": positivity,
        "weekly_summary": weekly_summary,
        "top_keywords": {
            "top_10": list(top_keywords["top_keywords"].keys())[:10],
            "counts": dict(list(top_keywords["top_keywords"].items())[:10])
        },
        "total_reflections": len(responses),
        "last_submission": responses[-1]["date"] if responses else None
    }

