# Analytics calculations for dashboard
from collections import Counter
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.services.nlp_service import aggregate_keywords_across_responses, get_trend_data
import logging

logger = logging.getLogger(__name__)

def calculate_frequency_charts(responses: List[Dict], question_id: Optional[str] = None) -> Dict[str, any]:
    """Calculate frequency charts for keywords"""
    if not responses:
        return {
            "absolute_counts": {},
            "percentages": {},
            "top_keywords": {},
            "total_responses": 0
        }
    
    # Get keyword frequencies
    keyword_freq = aggregate_keywords_across_responses(responses, question_id)
    
    # Calculate percentages
    total_keywords = sum(keyword_freq.values())
    keyword_percentages = {
        keyword: (count / total_keywords * 100) if total_keywords > 0 else 0
        for keyword, count in keyword_freq.items()
    }
    
    # Get top keywords (limit to 10)
    top_keywords = dict(Counter(keyword_freq).most_common(10))
    
    return {
        "absolute_counts": keyword_freq,
        "percentages": keyword_percentages,
        "top_keywords": top_keywords,
        "total_responses": len(responses)
    }

def calculate_trend_lines(responses: List[Dict], keyword: str, question_id: Optional[str] = None) -> Dict[str, any]:
    """Calculate trend lines for a specific keyword"""
    if not responses:
        return {"daily": [], "weekly": []}
    
    # Get daily trend data
    daily_trend = get_trend_data(responses, keyword, question_id)
    
    # Calculate weekly aggregation
    weekly_trend = []
    weekly_data = {}
    
    for data_point in daily_trend:
        date_obj = datetime.strptime(data_point["date"], "%Y-%m-%d")
        week_start = date_obj - timedelta(days=date_obj.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weekly_data:
            weekly_data[week_key] = {"count": 0, "days": 0}
        
        weekly_data[week_key]["count"] += data_point["count"]
        weekly_data[week_key]["days"] += 1
    
    # Convert to list format
    for week_start, data in weekly_data.items():
        weekly_trend.append({
            "date": week_start,
            "count": data["count"],
            "avg_per_day": data["count"] / data["days"] if data["days"] > 0 else 0
        })
    
    weekly_trend.sort(key=lambda x: x["date"])
    
    return {
        "daily": daily_trend,
        "weekly": weekly_trend
    }

def get_dashboard_analytics(responses: List[Dict], time_filter: str = "recent") -> Dict[str, any]:
    """Get comprehensive dashboard analytics"""
    if not responses:
        return {
            "summary": {
                "total_responses": 0,
                "date_range": {"start": None, "end": None},
                "most_frequent_keywords": []
            },
            "per_question": {},
            "overall": {}
        }
    
    # Filter responses based on time filter
    filtered_responses = filter_responses_by_time(responses, time_filter)
    
    # Overall analytics
    overall_analytics = calculate_frequency_charts(filtered_responses)
    
    # Per-question analytics
    per_question_analytics = {}
    question_ids = ["q_1", "q_2", "q_3", "q_4", "q_5", "q_6"]
    
    for q_id in question_ids:
        per_question_analytics[q_id] = calculate_frequency_charts(filtered_responses, q_id)
    
    # Summary statistics
    summary = {
        "total_responses": len(filtered_responses),
        "date_range": {
            "start": min([r["date"] for r in filtered_responses]) if filtered_responses else None,
            "end": max([r["date"] for r in filtered_responses]) if filtered_responses else None
        },
        "most_frequent_keywords": list(overall_analytics["top_keywords"].keys())[:5]
    }
    
    return {
        "summary": summary,
        "per_question": per_question_analytics,
        "overall": overall_analytics,
        "time_filter": time_filter
    }

def filter_responses_by_time(responses: List[Dict], time_filter: str) -> List[Dict]:
    """Filter responses based on time period"""
    if not responses:
        return []
    
    now = datetime.now()
    
    if time_filter == "last_week":
        week_ago = now - timedelta(days=7)
        return [r for r in responses if datetime.strptime(r["date"], "%Y-%m-%d") >= week_ago]
    
    elif time_filter == "last_month":
        month_ago = now - timedelta(days=30)
        return [r for r in responses if datetime.strptime(r["date"], "%Y-%m-%d") >= month_ago]
    
    elif time_filter == "recent":
        # Return last 14 days
        two_weeks_ago = now - timedelta(days=14)
        return [r for r in responses if datetime.strptime(r["date"], "%Y-%m-%d") >= two_weeks_ago]
    
    else:
        # Return all responses
        return responses

def get_keyword_trends(responses: List[Dict], keyword: str, question_id: Optional[str] = None) -> Dict[str, any]:
    """Get detailed trend analysis for a specific keyword"""
    if not responses:
        return {"trends": {}, "insights": []}
    
    # Calculate trends
    trends = calculate_trend_lines(responses, keyword, question_id)
    
    # Generate insights
    insights = []
    
    if trends["daily"]:
        recent_count = trends["daily"][-1]["count"] if trends["daily"] else 0
        older_count = trends["daily"][0]["count"] if len(trends["daily"]) > 1 else 0
        
        if recent_count > older_count:
            insights.append(f"'{keyword}' mentions have increased recently")
        elif recent_count < older_count:
            insights.append(f"'{keyword}' mentions have decreased recently")
        else:
            insights.append(f"'{keyword}' mentions have remained stable")
    
    if trends["weekly"] and len(trends["weekly"]) > 1:
        recent_week = trends["weekly"][-1]["avg_per_day"]
        previous_week = trends["weekly"][-2]["avg_per_day"]
        
        if recent_week > previous_week:
            insights.append(f"Weekly average for '{keyword}' is trending upward")
        elif recent_week < previous_week:
            insights.append(f"Weekly average for '{keyword}' is trending downward")
    
    return {
        "trends": trends,
        "insights": insights,
        "keyword": keyword,
        "question_id": question_id
    }

def calculate_daily_progress(responses: List[Dict]) -> Dict[str, any]:

    if not responses:
        return {
            "days_this_month": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "total_days": 0
        }
    
    dates = sorted(set([r["date"] for r in responses]))
    
    now = datetime.now()
    current_month = now.strftime("%Y-%m")
    days_this_month = len([d for d in dates if d.startswith(current_month)])
    
    current_streak = 0
    longest_streak = 0
    
    today = now.date()
    
    date_objects = [datetime.strptime(d, "%Y-%m-%d").date() for d in dates]
    
    # Count consecutive days backwards from today
    temp_streak = 0
    check_date = today
    while check_date in date_objects:
        temp_streak += 1
        check_date = check_date - timedelta(days=1)
    current_streak = temp_streak
    
    # Find longest streak in history
    sorted_date_objects = sorted(date_objects)
    if len(sorted_date_objects) > 0:
        streak_count = 1
        longest_streak = 1
        for i in range(1, len(sorted_date_objects)):
            date1 = sorted_date_objects[i-1]
            date2 = sorted_date_objects[i]
            if (date2 - date1).days == 1:
                streak_count += 1
                longest_streak = max(longest_streak, streak_count)
            else:
                streak_count = 1
    else:
        longest_streak = 0
    
    return {
        "days_this_month": days_this_month,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_days": len(dates)
    }

def calculate_positivity_score(responses: List[Dict]) -> Dict[str, any]:
    # Calculate mood score from positive/negative keywords
    # Define sentiment keywords
    positive_keywords = [
        "happy", "good", "great", "excited", "grateful", "positive", "confident", 
        "proud", "joyful", "satisfied", "wonderful", "amazing", "fantastic", 
        "perfect", "excellent", "love", "enjoy", "calm", "peaceful", "hopeful"
    ]
    negative_keywords = [
        "sad", "bad", "worried", "stressed", "tired", "frustrated", "anxious", 
        "disappointed", "angry", "confused", "terrible", "awful", "difficult",
        "hard", "struggle", "problem", "hate", "upset", "nervous", "annoyed"
    ]
    
    if not responses:
        return {
            "overall_score": 0,
            "trend": "neutral",
            "positive_count": 0,
            "negative_count": 0
        }
    
    all_text = " ".join([" ".join([a.get("text", "") for a in r.get("answers", [])]) for r in responses])
    all_text_lower = all_text.lower()
    
    import re
    positive_count = sum(len(re.findall(r'\b' + word + r'\b', all_text_lower)) for word in positive_keywords)
    negative_count = sum(len(re.findall(r'\b' + word + r'\b', all_text_lower)) for word in negative_keywords)
    total_sentiment = positive_count + negative_count
    
    if total_sentiment == 0:
        score = 50
    else:
        score = int((positive_count / total_sentiment) * 100)
    
    if score >= 70:
        trend = "very_positive"
    elif score >= 55:
        trend = "positive"
    elif score >= 45:
        trend = "neutral"
    else:
        trend = "negative"
    
    return {
        "overall_score": score,
        "trend": trend,
        "positive_count": positive_count,
        "negative_count": negative_count
    }

def calculate_daily_sentiment_chart(responses: List[Dict], days: int = 7) -> Dict[str, any]:
    # Calculate sentiment for last N days using submittedAt timestamps
    if not responses:
        return {}
    
    positive_keywords = [
        "happy", "good", "great", "excited", "grateful", "positive", "confident", 
        "proud", "joyful", "satisfied", "wonderful", "amazing", "fantastic", 
        "perfect", "excellent", "love", "enjoy", "calm", "peaceful", "hopeful"
    ]
    negative_keywords = [
        "sad", "bad", "worried", "stressed", "tired", "frustrated", "anxious", 
        "disappointed", "angry", "confused", "terrible", "awful", "difficult",
        "hard", "struggle", "problem", "hate", "upset", "nervous", "annoyed"
    ]
    
    import re
    from datetime import date as date_type
    
    now = datetime.utcnow()
    daily_scores = {}
    responses_by_date = {}
    for r in responses:
        submitted_at = r.get("submittedAt")
        if not submitted_at:
            submitted_at = r.get("date")
        
        submission_date = None
        if isinstance(submitted_at, str):
            try:
                if 'T' in submitted_at:
                    dt = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
                else:
                    dt = datetime.strptime(submitted_at, "%Y-%m-%d")
                submission_date = dt.date()
            except Exception as e:
                date_part = submitted_at.split('T')[0].split(' ')[0]
                try:
                    submission_date = datetime.strptime(date_part, "%Y-%m-%d").date()
                except Exception as e2:
                    logger.warning(f"Failed to parse submittedAt date '{submitted_at}': {e}, fallback also failed: {e2}")
        elif hasattr(submitted_at, 'date'):
            submission_date = submitted_at.date()
        elif hasattr(submitted_at, 'strftime') and not hasattr(submitted_at, 'hour'):
            submission_date = submitted_at
        
        if submission_date:
            date_str = submission_date.strftime("%Y-%m-%d")
            if date_str not in responses_by_date:
                responses_by_date[date_str] = []
            responses_by_date[date_str].append(r)
    
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        day_responses = responses_by_date.get(date_str, [])
        
        if not day_responses:
            continue
        
        all_text = " ".join([" ".join([a.get("text", "") for a in r.get("answers", [])]) for r in day_responses])
        all_text_lower = all_text.lower()
        
        positive_count = sum(len(re.findall(r'\b' + word + r'\b', all_text_lower)) for word in positive_keywords)
        negative_count = sum(len(re.findall(r'\b' + word + r'\b', all_text_lower)) for word in negative_keywords)
        total_sentiment = positive_count + negative_count
        
        if total_sentiment == 0:
            score = 50
        else:
            score = int((positive_count / total_sentiment) * 100)
        
        daily_scores[date_str] = {
            "score": int(score) if score is not None else 50,
            "positive": int(positive_count) if positive_count is not None else 0,
            "negative": int(negative_count) if negative_count is not None else 0
        }
    
    return daily_scores

def calculate_weekly_summary(responses: List[Dict]) -> Dict[str, any]:
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    
    weekly_responses = [
        r for r in responses 
        if datetime.strptime(r["date"], "%Y-%m-%d") >= week_ago
    ]
    
    if not weekly_responses:
        return {
            "days_completed": 0,
            "top_themes": [],
            "weekly_trend": "neutral"
        }
    
    # Extract all keywords
    all_keywords = []
    for response in weekly_responses:
        for answer in response.get("answers", []):
            all_keywords.extend(answer.get("keywords", []))
    
    # Get top 5 keywords
    keyword_counts = Counter(all_keywords)
    top_themes = [word for word, _ in keyword_counts.most_common(5)]
    
    # Calculate weekly mood
    positivity = calculate_positivity_score(weekly_responses)
    weekly_trend = positivity["trend"]
    
    return {
        "days_completed": len(weekly_responses),
        "top_themes": top_themes,
        "weekly_trend": weekly_trend,
        "positivity_score": positivity["overall_score"]
    }