"""
Analytics Service for Daily Questions Dashboard

This module provides comprehensive analytics calculations for user reflection data.
It processes responses to generate insights about:
- Daily progress and streak tracking
- Keyword frequency analysis
- Mood/positivity scoring based on sentiment analysis
- Weekly summary reports
- Trend analysis over time

Key Functions:
- calculate_frequency_charts: Creates keyword frequency data for visualization
- calculate_trend_lines: Generates daily and weekly trend data
- get_dashboard_analytics: Comprehensive analytics with time filtering
- calculate_daily_progress: Tracks days completed and streak statistics
- calculate_positivity_score: Analyzes sentiment using keyword matching
- calculate_weekly_summary: Generates weekly reports with top themes

Dependencies:
- nlp_service.py: Provides keyword extraction and aggregation functions
- Used by: api/dashboard.py for all dashboard analytics endpoints
- Used by: Frontend Dashboard.js component via API calls

Data Flow:
User Responses → Analytics Functions → Dashboard Endpoints → Frontend Charts
"""
from collections import Counter
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.services.nlp_service import aggregate_keywords_across_responses, get_trend_data

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
    
    # Get unique dates from all responses and sort chronologically
    dates = sorted(set([r["date"] for r in responses]))
    
    # Calculate days this month by filtering dates that start with current month prefix
    # Example: "2024-10-01" matches "2024-10"
    now = datetime.now()
    current_month = now.strftime("%Y-%m")
    days_this_month = len([d for d in dates if d.startswith(current_month)])
    
    # Calculate streaks
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    today = now.date()
    
    # Check current streak by going backwards from today
    # This finds consecutive days from today working backwards
    # e.g., if today is Oct 26 and user submitted on Oct 25, 24, 23 -> streak is 3
    for i in range(len(dates) - 1, -1, -1):
        date_str = dates[i]
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # Check if this date matches expected day for streak (today - temp_streak days)
        if date_obj == today - timedelta(days=temp_streak):
            temp_streak += 1
        else:
            break  # Streak broken, stop counting
    
    current_streak = temp_streak
    
    # Calculate longest streak across all time
    # This finds the longest sequence of consecutive days in the entire history
    streak_count = 1
    for i in range(1, len(dates)):
        date1 = datetime.strptime(dates[i-1], "%Y-%m-%d").date()
        date2 = datetime.strptime(dates[i], "%Y-%m-%d").date()
        
        # If consecutive (difference is exactly 1 day), increment streak
        if (date2 - date1).days == 1:
            streak_count += 1
            longest_streak = max(longest_streak, streak_count)
        else:
            streak_count = 1  # Streak broken, reset counter
    
    return {
        "days_this_month": days_this_month,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_days": len(dates)
    }

def calculate_positivity_score(responses: List[Dict]) -> Dict[str, any]:
    """
    Calculate overall mood/positivity score using sentiment analysis.
    
    This function analyzes all user responses to determine their overall emotional state.
    It uses keyword-based sentiment analysis to detect positive and negative emotions.
    
    Process:
    1. Extract all text from all answers across all responses
    2. Search for positive keywords (happy, great, excited, etc.)
    3. Search for negative keywords (sad, worried, stressed, etc.)
    4. Calculate positivity percentage: (positive / (positive + negative)) * 100
    5. Classify trend based on score thresholds
    
    Keyword Lists:
    - Positive: happy, good, great, excited, grateful, positive, confident, proud, joyful,
                satisfied, wonderful, amazing, fantastic, perfect, excellent, love, enjoy,
                calm, peaceful, hopeful
    - Negative: sad, bad, worried, stressed, tired, frustrated, anxious, disappointed, angry,
                confused, terrible, awful, difficult, hard, struggle, problem, hate, upset,
                nervous, annoyed
    
    Scoring Logic:
    - 70-100%: very_positive (happy, optimistic user)
    - 55-69%:  positive (generally positive mood)
    - 45-54%:  neutral (balanced emotions)
    - 0-44%:   negative (more negative emotions)
    
    Word Boundary Matching:
    - Uses regex word boundaries (\b) to match whole words only
    - Prevents partial matches (e.g., "happy" in "unhappy")
    - Case-insensitive matching
    
    Returns:
        Dict with overall_score (0-100), trend, positive_count, negative_count
    
    Used by:
    - api/dashboard.py: /api/dashboard/summary endpoint
    - Frontend Dashboard.js: Displays positivity score and mood indicators
    
    Example:
        Input: [{"answers": [{"text": "I feel happy and excited today"}]}]
        Output: {"overall_score": 100, "trend": "very_positive", "positive_count": 2, "negative_count": 0}
    """
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
    
    # Combine all answer text into one string for analysis
    # Flattens all answers from all responses into single text blob
    all_text = " ".join([" ".join([a.get("text", "") for a in r.get("answers", [])]) for r in responses])
    all_text_lower = all_text.lower()
    
    # Use word boundaries for accurate whole-word matching
    # This prevents partial matches (e.g., "happy" in "unhappy")
    import re
    positive_count = sum(len(re.findall(r'\b' + word + r'\b', all_text_lower)) for word in positive_keywords)
    negative_count = sum(len(re.findall(r'\b' + word + r'\b', all_text_lower)) for word in negative_keywords)
    total_sentiment = positive_count + negative_count
    
    # Calculate positivity score as percentage
    # If no sentiment words found, default to neutral (50%)
    if total_sentiment == 0:
        score = 50  # Neutral if no sentiment words found
    else:
        # Calculate percentage of positive vs total sentiment
        # e.g., if positive=7, negative=3, score = (7/10)*100 = 70%
        score = int((positive_count / total_sentiment) * 100)
    
    # Classify overall trend based on score thresholds
    if score >= 70:
        trend = "very_positive"  # User is very happy and positive
    elif score >= 55:
        trend = "positive"      # Generally positive mood
    elif score >= 45:
        trend = "neutral"       # Balanced emotions
    else:
        trend = "negative"      # More negative emotions present
    
    return {
        "overall_score": score,
        "trend": trend,
        "positive_count": positive_count,
        "negative_count": negative_count
    }

def calculate_weekly_summary(responses: List[Dict]) -> Dict[str, any]:
    """Generate weekly summary report"""
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