# Dashboard analytics API endpoints
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.api.auth import get_current_user
from app.crud.response import get_responses, get_all_responses_for_analytics
from app.services.analytics_service import (
    get_dashboard_analytics, 
    get_keyword_trends,
    calculate_frequency_charts,
    calculate_trend_lines,
    calculate_daily_progress,
    calculate_positivity_score,
    calculate_weekly_summary,
    calculate_daily_sentiment_chart
)
from app.cache import cache_service
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
from datetime import datetime

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.get("/analytics")
@limiter.limit("30/minute")
async def get_dashboard_data(
    request: Request,
    time_filter: str = Query("recent", description="Time filter: recent, last_week, last_month, all"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
    
    valid_filters = ["recent", "last_week", "last_month", "all"]
    if time_filter not in valid_filters:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid time filter. Must be one of: {', '.join(valid_filters)}"
        )
    
    cache_key = cache_service._make_key("dashboard_analytics", user_id, time_filter)
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        return cached_result
    
    responses = await get_all_responses_for_analytics(user_id)
    
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    analytics = get_dashboard_analytics(responses, time_filter)
    await cache_service.set(cache_key, analytics, ttl_seconds=300)
    
    return analytics

@router.get("/frequency-chart")
@limiter.limit("30/minute")
async def get_frequency_chart(
    request: Request,
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    time_filter: str = Query("recent", description="Time filter"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
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
@limiter.limit("30/minute")
async def get_trend_line(
    request: Request,
    keyword: str,
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
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
@limiter.limit("30/minute")
async def get_insights(
    request: Request,
    keyword: Optional[str] = Query(None, description="Specific keyword to analyze"),
    question_id: Optional[str] = Query(None, description="Question ID to filter by"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    insights = []
    
    if keyword:
        trend_data = get_keyword_trends(responses, keyword, question_id)
        insights.extend(trend_data["insights"])
    else:
        recent_analytics = get_dashboard_analytics(responses, "recent")
        week_analytics = get_dashboard_analytics(responses, "last_week")
        
        recent_keywords = set(recent_analytics["overall"].get("top_keywords", {}).keys())
        week_keywords = set(week_analytics["overall"].get("top_keywords", {}).keys())
        
        new_keywords = recent_keywords - week_keywords
        if new_keywords:
            insights.append(f"New themes emerging: {', '.join(list(new_keywords)[:3])}")
        
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
@limiter.limit("30/minute")
async def get_dashboard_summary(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
    
    cache_key = cache_service._make_key("dashboard_summary", user_id)
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        return cached_result
    
    responses = await get_all_responses_for_analytics(user_id)
    
    for response in responses:
        response["_id"] = str(response["_id"])
        if "date" in response and not isinstance(response["date"], str):
            if hasattr(response["date"], 'strftime'):
                response["date"] = response["date"].strftime("%Y-%m-%d")
            else:
                response["date"] = str(response["date"])
    
    daily_progress = calculate_daily_progress(responses)
    positivity = calculate_positivity_score(responses)
    weekly_summary = calculate_weekly_summary(responses)
    top_keywords = calculate_frequency_charts(responses)
    
    try:
        daily_sentiment = calculate_daily_sentiment_chart(responses, days=7)
        if daily_sentiment is None:
            daily_sentiment = {}
    except Exception as e:
        daily_sentiment = {}
    
    last_submission_date = None
    if responses:
        submission_timestamps = []
        for r in responses:
            submitted_at = r.get("submittedAt")
            if submitted_at:
                submission_timestamps.append(submitted_at)
        
        if submission_timestamps:
            try:
                timestamp_objects = []
                for ts in submission_timestamps:
                    if isinstance(ts, str):
                        try:
                            if '+' in ts or ts.endswith('Z'):
                                dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                            else:
                                if '.' in ts:
                                    parts = ts.split('.')
                                    dt = datetime.strptime(parts[0], "%Y-%m-%dT%H:%M:%S")
                                else:
                                    dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S")
                        except Exception:
                            continue
                        timestamp_objects.append((dt, dt.date()))
                    elif hasattr(ts, 'date') and hasattr(ts, 'year') and hasattr(ts, 'hour'):
                        timestamp_objects.append((ts, ts.date()))
                    elif hasattr(ts, 'strftime') and not hasattr(ts, 'hour'):
                        dt = datetime.combine(ts, datetime.min.time())
                        timestamp_objects.append((dt, ts))
                
                if timestamp_objects:
                    latest = max(timestamp_objects, key=lambda x: x[0])
                    last_submission_date = latest[1].strftime("%Y-%m-%d")
            except Exception:
                response_dates = [r.get("date") for r in responses if r.get("date")]
                if response_dates:
                    try:
                        date_objects = []
                        for d in response_dates:
                            if isinstance(d, str):
                                date_str = d.split('T')[0].split(' ')[0]
                                date_objects.append((datetime.strptime(date_str, "%Y-%m-%d"), d))
                            elif hasattr(d, 'strftime'):
                                date_objects.append((d, d.strftime("%Y-%m-%d")))
                        if date_objects:
                            last_submission_date = max(date_objects, key=lambda x: x[0])[1]
                    except Exception:
                        last_submission_date = response_dates[0] if response_dates else None
    
    # Convert submittedAt to ISO format for JSON serialization (after we've used it for last_submission)
    for response in responses:
        if "submittedAt" in response and hasattr(response["submittedAt"], 'isoformat'):
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    result = {
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
        "daily_sentiment": daily_sentiment if daily_sentiment is not None else {},
        "total_reflections": len(responses),
        "last_submission": last_submission_date
    }
    
    # Cache the result for 5 minutes
    await cache_service.set(cache_key, result, ttl_seconds=300)
    return result

@router.get("/weekly-sentiment")
@limiter.limit("30/minute")
async def get_weekly_sentiment(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
    responses = await get_all_responses_for_analytics(user_id)
    
    for response in responses:
        response["_id"] = str(response["_id"])
        if "submittedAt" in response:
            response["submittedAt"] = response["submittedAt"].isoformat()
    
    daily_sentiment = calculate_daily_sentiment_chart(responses, days=7)
    
    return {
        "daily_sentiment": daily_sentiment
    }

