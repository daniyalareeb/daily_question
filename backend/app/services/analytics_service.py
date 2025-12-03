# Analytics calculations for dashboard - Choice-based analytics
from collections import Counter, defaultdict
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def get_option_text_from_id(option_id: str, options_map: Dict[str, Dict]) -> str:
    """Get option text from option ID using options map"""
    option = options_map.get(option_id)
    return option.get("option_text", option_id) if option else option_id

def calculate_option_frequency(responses: List[Dict], question_id: Optional[str] = None, sub_question_id: Optional[str] = None, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate frequency of option selections for a question or sub-question"""
    if not responses:
        return {
            "absolute_counts": {},
            "percentages": {},
            "top_options": {},
            "total_selections": 0
        }
    
    option_counter = Counter()
    total_selections = 0
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            # Filter by question_id if provided
            if question_id and str(answer.get("question_id")) != str(question_id):
                continue
            
            # Filter by sub_question_id if provided
            if sub_question_id and str(answer.get("sub_question_id")) != str(sub_question_id):
                continue
            
            # If sub_question_id is provided, only count sub-question answers
            if sub_question_id and not answer.get("sub_question_id"):
                continue
            
            # If question_id is provided but no sub_question_id, only count main question answers
            if question_id and not sub_question_id and answer.get("sub_question_id"):
                continue
            
            option_id = answer.get("selected_option_id")
            if option_id:
                option_text = get_option_text_from_id(str(option_id), options_map or {})
                option_counter[option_text] += 1
                total_selections += 1
    
    # Calculate percentages
    percentages = {
        option: (count / total_selections * 100) if total_selections > 0 else 0
        for option, count in option_counter.items()
    }
    
    # Get top options (limit to 10)
    top_options = dict(option_counter.most_common(10))
    
    return {
        "absolute_counts": dict(option_counter),
        "percentages": percentages,
        "top_options": top_options,
        "total_selections": total_selections
    }

def calculate_option_trends(responses: List[Dict], option_text: str, question_id: Optional[str] = None, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate trend lines for a specific option over time"""
    if not responses:
        return {"daily": [], "weekly": []}
    
    # Build date -> count mapping
    daily_data = defaultdict(int)
    
    for response in responses:
        date = response.get("date")
        if not date:
            continue
        
        answers = response.get("answers", [])
        for answer in answers:
            if question_id and str(answer.get("question_id")) != str(question_id):
                continue
            
            option_id = answer.get("selected_option_id")
            if option_id:
                opt_text = get_option_text_from_id(str(option_id), options_map or {})
                if opt_text == option_text:
                    daily_data[date] += 1
    
    # Convert to list format and sort
    daily_trend = [
        {"date": date, "count": count}
        for date, count in sorted(daily_data.items())
    ]
    
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
    for week_start, data in sorted(weekly_data.items()):
        weekly_trend.append({
            "date": week_start,
            "count": data["count"],
            "avg_per_day": data["count"] / data["days"] if data["days"] > 0 else 0
        })
    
    return {
        "daily": daily_trend,
        "weekly": weekly_trend
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

def calculate_daily_progress(responses: List[Dict]) -> Dict[str, any]:
    """Calculate daily progress metrics including streaks"""
    if not responses:
        return {
            "days_this_month": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "total_days": 0
        }
    
    dates = sorted(set([r["date"] for r in responses]))
    
    now = datetime.now()
    today = now.date()
    yesterday = today - timedelta(days=1)
    current_month = now.strftime("%Y-%m")
    days_this_month = len([d for d in dates if d.startswith(current_month)])
    
    date_objects = [datetime.strptime(d, "%Y-%m-%d").date() for d in dates]
    
    # Find longest streak in history (calculate this first, before checking current streak)
    longest_streak = 0
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
    
    # Count current streak - only if most recent submission is today or yesterday
    # If the streak is broken (most recent submission is >1 day ago), current_streak = 0
    current_streak = 0
    if date_objects:
        most_recent_date = max(date_objects)
        days_since_last_submission = (today - most_recent_date).days
        
        # Streak is only active if last submission was today or yesterday
        if days_since_last_submission <= 1:
            # Count consecutive days backwards from most recent submission date
            temp_streak = 0
            check_date = most_recent_date
            while check_date in date_objects:
                temp_streak += 1
                check_date = check_date - timedelta(days=1)
            current_streak = temp_streak
        else:
            # Streak is broken - most recent submission is more than 1 day ago
            current_streak = 0
    
    return {
        "days_this_month": days_this_month,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_days": len(dates)
    }

def calculate_mood_score(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate mood/feeling score based on Q1 (How are you feeling today?)"""
    if not responses:
        return {
            "overall_score": 50,
            "trend": "neutral",
            "positive_count": 0,
            "negative_count": 0,
            "distribution": {}
        }
    
    # Map feeling options to scores (higher = more positive)
    feeling_scores = {
        "Excited": 100,
        "Happy": 90,
        "Contented": 75,
        "Normal": 50,
        "Low energy": 30,
        "Depressed": 10,
        "Agitated/Stressed": 20
    }
    
    positive_options = ["Excited", "Happy", "Contented"]
    negative_options = ["Depressed", "Agitated/Stressed", "Low energy"]
    
    positive_count = 0
    negative_count = 0
    total_score = 0
    total_responses = 0
    distribution = Counter()
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            if str(answer.get("question_id")) != str(question_id):
                continue
            
            option_id = answer.get("selected_option_id")
            if option_id:
                option_text = get_option_text_from_id(str(option_id), options_map or {})
                distribution[option_text] += 1
                
                score = feeling_scores.get(option_text, 50)
                total_score += score
                total_responses += 1
                
                if option_text in positive_options:
                    positive_count += 1
                elif option_text in negative_options:
                    negative_count += 1
    
    if total_responses == 0:
        overall_score = 50
    else:
        overall_score = int(total_score / total_responses)
    
    if overall_score >= 70:
        trend = "very_positive"
    elif overall_score >= 55:
        trend = "positive"
    elif overall_score >= 45:
        trend = "neutral"
    else:
        trend = "negative"
    
    return {
        "overall_score": overall_score,
        "trend": trend,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "distribution": dict(distribution)
    }

def calculate_daily_mood_chart(responses: List[Dict], question_id: str, days: int = 7, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate daily mood scores for the last N days"""
    if not responses:
        return {}
    
    feeling_scores = {
        "Excited": 100,
        "Happy": 90,
        "Contented": 75,
        "Normal": 50,
        "Low energy": 30,
        "Depressed": 10,
        "Agitated/Stressed": 20
    }
    
    now = datetime.utcnow()
    daily_scores = {}
    responses_by_date = {}
    
    # Group responses by date
    for r in responses:
        date = r.get("date")
        if date:
            if date not in responses_by_date:
                responses_by_date[date] = []
            responses_by_date[date].append(r)
    
    # Calculate score for each day
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        day_responses = responses_by_date.get(date_str, [])
        
        if not day_responses:
            continue
        
        total_score = 0
        count = 0
        
        for response in day_responses:
            answers = response.get("answers", [])
            for answer in answers:
                if str(answer.get("question_id")) == str(question_id):
                    option_id = answer.get("selected_option_id")
                    if option_id:
                        option_text = get_option_text_from_id(str(option_id), options_map or {})
                        score = feeling_scores.get(option_text, 50)
                        total_score += score
                        count += 1
        
        if count > 0:
            daily_scores[date_str] = {
                "score": int(total_score / count),
                "count": count
            }
    
    return daily_scores

def calculate_weekly_summary(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate weekly summary based on responses"""
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    
    weekly_responses = [
        r for r in responses 
        if datetime.strptime(r["date"], "%Y-%m-%d") >= week_ago
    ]
    
    if not weekly_responses:
        return {
            "days_completed": 0,
            "top_selections": [],
            "weekly_trend": "neutral",
            "mood_score": 50
        }
    
    # Get top selections for the week (across all questions)
    all_selections = []
    for response in weekly_responses:
        answers = response.get("answers", [])
        for answer in answers:
            option_id = answer.get("selected_option_id")
            if option_id:
                option_text = get_option_text_from_id(str(option_id), options_map or {})
                all_selections.append(option_text)
    
    selection_counts = Counter(all_selections)
    top_selections = [opt for opt, _ in selection_counts.most_common(5)]
    
    # Calculate mood score for Q1
    mood = calculate_mood_score(weekly_responses, question_id, options_map)
    
    return {
        "days_completed": len(weekly_responses),
        "top_selections": top_selections,
        "weekly_trend": mood["trend"],
        "mood_score": mood["overall_score"]
    }

def get_question_analytics(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Get comprehensive analytics for a specific question"""
    frequency = calculate_option_frequency(responses, question_id=question_id, options_map=options_map)
    
    return {
        "question_id": question_id,
        "frequency": frequency,
        "total_responses": len(responses)
    }

def get_sub_question_analytics(responses: List[Dict], question_id: str, sub_question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Get analytics for a specific sub-question"""
    frequency = calculate_option_frequency(responses, question_id=question_id, sub_question_id=sub_question_id, options_map=options_map)
    
    return {
        "question_id": question_id,
        "sub_question_id": sub_question_id,
        "frequency": frequency,
        "total_responses": len(responses)
    }

# ========== NEW HEALTH & WELLNESS ANALYTICS ==========

def calculate_sleep_quality_trend(responses: List[Dict], question_id: str, days: int = 30, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate sleep quality trend over time (Q6: How Satisfying was your sleep last night?)"""
    if not responses:
        return {}
    
    # Map sleep quality to scores
    sleep_scores = {
        "Excellent": 5,
        "Good": 4,
        "Average": 3,
        "Poor": 2,
        "Very Poor": 1
    }
    
    now = datetime.utcnow()
    daily_scores = {}
    responses_by_date = {}
    
    # Group responses by date
    for r in responses:
        date = r.get("date")
        if date:
            if date not in responses_by_date:
                responses_by_date[date] = []
            responses_by_date[date].append(r)
    
    # Calculate score for each day
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        day_responses = responses_by_date.get(date_str, [])
        
        if not day_responses:
            continue
        
        total_score = 0
        count = 0
        
        for response in day_responses:
            answers = response.get("answers", [])
            for answer in answers:
                if str(answer.get("question_id")) == str(question_id):
                    option_id = answer.get("selected_option_id")
                    if option_id:
                        option_text = get_option_text_from_id(str(option_id), options_map or {})
                        score = sleep_scores.get(option_text, 3)
                        total_score += score
                        count += 1
        
        if count > 0:
            daily_scores[date_str] = {
                "score": round(total_score / count, 2),
                "count": count
            }
    
    return daily_scores

def calculate_sleep_duration_distribution(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate sleep duration distribution (Q8: How many hours of sleep did you get last night?)"""
    if not responses:
        return {
            "distribution": {},
            "percentages": {},
            "total_responses": 0
        }
    
    duration_counter = Counter()
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            if str(answer.get("question_id")) == str(question_id):
                option_id = answer.get("selected_option_id")
                if option_id:
                    option_text = get_option_text_from_id(str(option_id), options_map or {})
                    duration_counter[option_text] += 1
    
    total = sum(duration_counter.values())
    percentages = {
        duration: (count / total * 100) if total > 0 else 0
        for duration, count in duration_counter.items()
    }
    
    return {
        "distribution": dict(duration_counter),
        "percentages": percentages,
        "total_responses": total
    }

def calculate_bedtime_pattern(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate bedtime pattern frequency (Q7: What time did you go to sleep last night?)"""
    if not responses:
        return {
            "frequency": {},
            "percentages": {},
            "total_responses": 0
        }
    
    bedtime_counter = Counter()
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            if str(answer.get("question_id")) == str(question_id):
                option_id = answer.get("selected_option_id")
                if option_id:
                    option_text = get_option_text_from_id(str(option_id), options_map or {})
                    bedtime_counter[option_text] += 1
    
    total = sum(bedtime_counter.values())
    percentages = {
        bedtime: (count / total * 100) if total > 0 else 0
        for bedtime, count in bedtime_counter.items()
    }
    
    return {
        "frequency": dict(bedtime_counter),
        "percentages": percentages,
        "total_responses": total
    }

def calculate_sleep_score(responses: List[Dict], quality_question_id: str, duration_question_id: str, bedtime_question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate composite sleep score (0-100)"""
    if not responses:
        return {
            "score": 0,
            "quality_score": 0,
            "duration_score": 0,
            "consistency_score": 0
        }
    
    # Sleep quality scores (0-100)
    quality_scores = {
        "Excellent": 100,
        "Good": 80,
        "Average": 60,
        "Poor": 40,
        "Very Poor": 20
    }
    
    # Sleep duration scores (0-100)
    duration_scores = {
        "Less than 3 hours": 20,
        "3-4 hours": 40,
        "5-6 hours": 60,
        "7-8 hours": 90,
        "8+ hours": 100
    }
    
    quality_total = 0
    quality_count = 0
    duration_total = 0
    duration_count = 0
    bedtimes = []
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            q_id = str(answer.get("question_id"))
            option_id = answer.get("selected_option_id")
            
            if option_id:
                option_text = get_option_text_from_id(str(option_id), options_map or {})
                
                if q_id == quality_question_id:
                    score = quality_scores.get(option_text, 60)
                    quality_total += score
                    quality_count += 1
                elif q_id == duration_question_id:
                    score = duration_scores.get(option_text, 60)
                    duration_total += score
                    duration_count += 1
                elif q_id == bedtime_question_id:
                    bedtimes.append(option_text)
    
    avg_quality = (quality_total / quality_count) if quality_count > 0 else 60
    avg_duration = (duration_total / duration_count) if duration_count > 0 else 60
    
    # Calculate bedtime consistency (lower variance = higher score)
    if bedtimes:
        # Map bedtimes to numeric values for consistency calculation
        bedtime_values = {"9pm": 21, "10pm": 22, "11pm": 23, "Midnight": 24, "After Midnight": 25}
        numeric_bedtimes = [bedtime_values.get(bt, 23) for bt in bedtimes if bt in bedtime_values]
        if numeric_bedtimes:
            avg_bedtime = sum(numeric_bedtimes) / len(numeric_bedtimes)
            variance = sum((bt - avg_bedtime) ** 2 for bt in numeric_bedtimes) / len(numeric_bedtimes)
            # Convert variance to score (lower variance = higher score, max 100)
            consistency_score = max(0, 100 - (variance * 10))
        else:
            consistency_score = 50
    else:
        consistency_score = 50
    
    # Composite score: 50% quality, 30% duration, 20% consistency
    composite_score = (avg_quality * 0.5) + (avg_duration * 0.3) + (consistency_score * 0.2)
    
    return {
        "score": round(composite_score, 1),
        "quality_score": round(avg_quality, 1),
        "duration_score": round(avg_duration, 1),
        "consistency_score": round(consistency_score, 1)
    }

def calculate_nutrition_ratio(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate healthy vs easy food ratio from nutrition sub-questions"""
    if not responses:
        return {
            "healthy_count": 0,
            "easy_count": 0,
            "total_meals": 0,
            "healthy_percentage": 0,
            "easy_percentage": 0
        }
    
    healthy_count = 0
    easy_count = 0
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            # Check if this is a nutrition sub-question answer
            if str(answer.get("question_id")) == str(question_id) and answer.get("sub_question_id"):
                option_id = answer.get("selected_option_id")
                if option_id:
                    option_text = get_option_text_from_id(str(option_id), options_map or {})
                    if "Healthy" in option_text or "Fruit & Veg" in option_text:
                        healthy_count += 1
                    elif "Easy" in option_text or "Snacks" in option_text:
                        easy_count += 1
    
    total_meals = healthy_count + easy_count
    healthy_percentage = (healthy_count / total_meals * 100) if total_meals > 0 else 0
    easy_percentage = (easy_count / total_meals * 100) if total_meals > 0 else 0
    
    return {
        "healthy_count": healthy_count,
        "easy_count": easy_count,
        "total_meals": total_meals,
        "healthy_percentage": round(healthy_percentage, 1),
        "easy_percentage": round(easy_percentage, 1)
    }

def calculate_meal_frequency(responses: List[Dict], question_id: str, days: int = 30, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate meal frequency over time (Breakfast, Lunch, Dinner)"""
    if not responses:
        return {}
    
    now = datetime.utcnow()
    daily_meals = {}
    responses_by_date = {}
    
    # Group responses by date
    for r in responses:
        date = r.get("date")
        if date:
            if date not in responses_by_date:
                responses_by_date[date] = []
            responses_by_date[date].append(r)
    
    # Calculate meals for each day
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        day_responses = responses_by_date.get(date_str, [])
        
        if not day_responses:
            continue
        
        meals = {"breakfast": 0, "lunch": 0, "dinner": 0}
        
        for response in day_responses:
            answers = response.get("answers", [])
            for answer in answers:
                if str(answer.get("question_id")) == str(question_id):
                    # Check main question options
                    if not answer.get("sub_question_id"):
                        option_id = answer.get("selected_option_id")
                        if option_id:
                            option_text = get_option_text_from_id(str(option_id), options_map or {})
                            if "Breakfast" in option_text:
                                meals["breakfast"] = 1
                            elif "Lunch" in option_text:
                                meals["lunch"] = 1
                            elif "Dinner" in option_text:
                                meals["dinner"] = 1
        
        if sum(meals.values()) > 0:
            daily_meals[date_str] = meals
    
    return daily_meals

def calculate_nutrition_score(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate nutrition score (0-100) based on healthy meal percentage"""
    nutrition_ratio = calculate_nutrition_ratio(responses, question_id, options_map)
    
    score = nutrition_ratio.get("healthy_percentage", 0)
    
    return {
        "score": round(score, 1),
        "healthy_percentage": nutrition_ratio.get("healthy_percentage", 0),
        "total_meals": nutrition_ratio.get("total_meals", 0)
    }

def calculate_exercise_frequency(responses: List[Dict], question_id: str, days: int = 30, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate exercise frequency over time (Q4: Did you exercise today?)"""
    if not responses:
        return {}
    
    now = datetime.utcnow()
    daily_exercise = {}
    responses_by_date = {}
    
    # Group responses by date
    for r in responses:
        date = r.get("date")
        if date:
            if date not in responses_by_date:
                responses_by_date[date] = []
            responses_by_date[date].append(r)
    
    # Calculate exercise for each day
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        day_responses = responses_by_date.get(date_str, [])
        
        if not day_responses:
            continue
        
        exercised = False
        duration = None
        
        for response in day_responses:
            answers = response.get("answers", [])
            for answer in answers:
                if str(answer.get("question_id")) == str(question_id):
                    option_id = answer.get("selected_option_id")
                    if option_id:
                        option_text = get_option_text_from_id(str(option_id), options_map or {})
                        if "didn't exercise" not in option_text.lower():
                            exercised = True
                            if "Less" in option_text or "<" in option_text:
                                duration = "<30min"
                            elif "More" in option_text or ">" in option_text:
                                duration = ">30min"
        
        if exercised:
            daily_exercise[date_str] = {
                "exercised": True,
                "duration": duration
            }
        else:
            daily_exercise[date_str] = {
                "exercised": False,
                "duration": None
            }
    
    return daily_exercise

def calculate_exercise_distribution(responses: List[Dict], question_id: str, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate exercise duration distribution"""
    if not responses:
        return {
            "distribution": {},
            "percentages": {},
            "total_responses": 0
        }
    
    exercise_counter = Counter()
    
    for response in responses:
        answers = response.get("answers", [])
        for answer in answers:
            if str(answer.get("question_id")) == str(question_id):
                option_id = answer.get("selected_option_id")
                if option_id:
                    option_text = get_option_text_from_id(str(option_id), options_map or {})
                    exercise_counter[option_text] += 1
    
    total = sum(exercise_counter.values())
    percentages = {
        exercise: (count / total * 100) if total > 0 else 0
        for exercise, count in exercise_counter.items()
    }
    
    return {
        "distribution": dict(exercise_counter),
        "percentages": percentages,
        "total_responses": total
    }

def calculate_hydration_consistency(responses: List[Dict], question_id: str, days: int = 30, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate hydration consistency (Q3: How was your water Intake today?)"""
    if not responses:
        return {
            "adequate_days": 0,
            "low_days": 0,
            "total_days": 0,
            "adequate_percentage": 0,
            "consistency_score": 0
        }
    
    now = datetime.utcnow()
    adequate_count = 0
    low_count = 0
    responses_by_date = {}
    
    # Group responses by date
    for r in responses:
        date = r.get("date")
        if date:
            if date not in responses_by_date:
                responses_by_date[date] = []
            responses_by_date[date].append(r)
    
    # Count hydration for last N days
    checked_dates = set()
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        
        if date_str in checked_dates:
            continue
        checked_dates.add(date_str)
        
        day_responses = responses_by_date.get(date_str, [])
        if not day_responses:
            continue
        
        for response in day_responses:
            answers = response.get("answers", [])
            for answer in answers:
                if str(answer.get("question_id")) == str(question_id):
                    option_id = answer.get("selected_option_id")
                    if option_id:
                        option_text = get_option_text_from_id(str(option_id), options_map or {})
                        if "Adequate" in option_text or ">" in option_text:
                            adequate_count += 1
                        elif "Low" in option_text or "<" in option_text:
                            low_count += 1
                        break
    
    total_days = adequate_count + low_count
    adequate_percentage = (adequate_count / total_days * 100) if total_days > 0 else 0
    
    return {
        "adequate_days": adequate_count,
        "low_days": low_count,
        "total_days": total_days,
        "adequate_percentage": round(adequate_percentage, 1),
        "consistency_score": round(adequate_percentage, 1)  # Same as percentage
    }

def calculate_hydration_frequency(responses: List[Dict], question_id: str, days: int = 30, options_map: Dict[str, Dict] = None) -> Dict[str, any]:
    """Calculate hydration frequency over time (Q3: How was your water Intake today?)"""
    if not responses:
        return {}
    
    now = datetime.utcnow()
    daily_hydration = {}
    responses_by_date = {}
    
    # Group responses by date
    for r in responses:
        date = r.get("date")
        if date:
            if date not in responses_by_date:
                responses_by_date[date] = []
            responses_by_date[date].append(r)
    
    # Calculate hydration for each day
    for i in range(days):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%Y-%m-%d")
        day_responses = responses_by_date.get(date_str, [])
        
        if not day_responses:
            continue
        
        adequate = False
        score = 0  # 0 = low, 100 = adequate
        
        for response in day_responses:
            answers = response.get("answers", [])
            for answer in answers:
                if str(answer.get("question_id")) == str(question_id):
                    option_id = answer.get("selected_option_id")
                    if option_id:
                        option_text = get_option_text_from_id(str(option_id), options_map or {})
                        if "Adequate" in option_text or ">" in option_text:
                            adequate = True
                            score = 100
                        elif "Low" in option_text or "<" in option_text:
                            adequate = False
                            score = 0
                        break
        
        if adequate or score == 0:  # Only add if we have data
            daily_hydration[date_str] = {
                "adequate": adequate,
                "score": score
            }
    
    return daily_hydration
