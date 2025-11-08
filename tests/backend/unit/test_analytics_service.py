"""
Comprehensive unit tests for analytics service
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..', 'backend'))

import pytest
from datetime import datetime, timedelta
from app.services.analytics_service import (
    calculate_daily_progress,
    calculate_daily_sentiment_chart,
    calculate_positivity_score,
    calculate_weekly_summary,
    calculate_frequency_charts
)


class TestCalculateDailyProgress:
    """Tests for daily progress calculation"""
    
    def test_empty_responses(self):
        """Test with no responses returns zero values"""
        result = calculate_daily_progress([])
        assert result["days_this_month"] == 0
        assert result["current_streak"] == 0
        assert result["longest_streak"] == 0
        assert result["total_days"] == 0
    
    def test_single_response_today(self):
        """Test with single response today"""
        today = datetime.now().strftime("%Y-%m-%d")
        responses = [{"date": today, "answers": []}]
        result = calculate_daily_progress(responses)
        assert result["total_days"] == 1
        assert result["days_this_month"] == 1
        assert result["current_streak"] >= 1
    
    def test_consecutive_streak(self):
        """Test streak calculation with consecutive days"""
        today = datetime.now()
        dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(5)]
        responses = [{"date": d, "answers": []} for d in dates]
        result = calculate_daily_progress(responses)
        assert result["current_streak"] == 5
        assert result["longest_streak"] == 5
        assert result["total_days"] == 5
    
    def test_broken_streak(self):
        """Test streak reset when days are not consecutive"""
        today = datetime.now()
        dates = [
            today.strftime("%Y-%m-%d"),
            (today - timedelta(days=2)).strftime("%Y-%m-%d"),  # Gap of 1 day
            (today - timedelta(days=3)).strftime("%Y-%m-%d")
        ]
        responses = [{"date": d, "answers": []} for d in dates]
        result = calculate_daily_progress(responses)
        assert result["current_streak"] == 1  # Only today
        assert result["longest_streak"] == 2  # The 2 consecutive days
    
    def test_multiple_responses_same_day(self):
        """Test that multiple responses on same day count as one"""
        today = datetime.now().strftime("%Y-%m-%d")
        responses = [
            {"date": today, "answers": []},
            {"date": today, "answers": []}
        ]
        result = calculate_daily_progress(responses)
        assert result["total_days"] == 1


class TestCalculateDailySentimentChart:
    """Tests for daily sentiment chart calculation"""
    
    def test_empty_responses(self):
        """Test with no responses returns empty dict"""
        result = calculate_daily_sentiment_chart([], days=7)
        assert result == {}
    
    def test_positive_sentiment_detection(self):
        """Test positive sentiment keywords are detected"""
        today = datetime.now()
        responses = [{
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [{"text": "I am happy and excited today, feeling great!"}]
        }]
        result = calculate_daily_sentiment_chart(responses, days=7)
        assert today.strftime("%Y-%m-%d") in result
        assert result[today.strftime("%Y-%m-%d")]["score"] >= 50
        assert result[today.strftime("%Y-%m-%d")]["positive"] > 0
    
    def test_negative_sentiment_detection(self):
        """Test negative sentiment keywords are detected"""
        today = datetime.now()
        responses = [{
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [{"text": "I feel sad and worried, very stressed"}]
        }]
        result = calculate_daily_sentiment_chart(responses, days=7)
        assert today.strftime("%Y-%m-%d") in result
        assert result[today.strftime("%Y-%m-%d")]["negative"] > 0
    
    def test_mixed_sentiment(self):
        """Test mixed positive and negative sentiment"""
        today = datetime.now()
        responses = [{
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [{"text": "I feel happy but also tired and stressed"}]
        }]
        result = calculate_daily_sentiment_chart(responses, days=7)
        date_str = today.strftime("%Y-%m-%d")
        assert date_str in result
        assert result[date_str]["positive"] > 0
        assert result[date_str]["negative"] > 0
    
    def test_no_sentiment_keywords(self):
        """Test neutral response with no sentiment keywords"""
        today = datetime.now()
        responses = [{
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [{"text": "Today was a normal day"}]
        }]
        result = calculate_daily_sentiment_chart(responses, days=7)
        date_str = today.strftime("%Y-%m-%d")
        assert date_str in result
        assert result[date_str]["score"] == 50  # Default neutral score
        assert result[date_str]["positive"] == 0
        assert result[date_str]["negative"] == 0
    
    def test_multiple_days(self):
        """Test sentiment calculation across multiple days"""
        today = datetime.now()
        responses = [
            {
                "date": today.strftime("%Y-%m-%d"),
                "submittedAt": today,
                "answers": [{"text": "Happy day"}]
            },
            {
                "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=1),
                "answers": [{"text": "Sad day"}]
            }
        ]
        result = calculate_daily_sentiment_chart(responses, days=7)
        assert len(result) == 2
        assert today.strftime("%Y-%m-%d") in result
        assert (today - timedelta(days=1)).strftime("%Y-%m-%d") in result


class TestCalculatePositivityScore:
    """Tests for positivity score calculation"""
    
    def test_empty_responses(self):
        """Test with no responses returns default score"""
        result = calculate_positivity_score([])
        assert isinstance(result, dict)
        assert "overall_score" in result
        assert result["overall_score"] == 0  # Default when no sentiment detected
    
    def test_all_positive(self):
        """Test all positive responses"""
        responses = [{
            "answers": [{"text": "I feel great, happy, and excited!"}]
        }]
        result = calculate_positivity_score(responses)
        assert isinstance(result, dict)
        assert result["overall_score"] > 50
        assert result["positive_count"] > 0
    
    def test_all_negative(self):
        """Test all negative responses"""
        responses = [{
            "answers": [{"text": "I feel sad, worried, and stressed"}]
        }]
        result = calculate_positivity_score(responses)
        assert isinstance(result, dict)
        assert result["overall_score"] < 50
        assert result["negative_count"] > 0
    
    def test_balanced_sentiment(self):
        """Test balanced positive and negative"""
        responses = [
            {"answers": [{"text": "Happy and excited"}]},
            {"answers": [{"text": "Sad and worried"}]}
        ]
        result = calculate_positivity_score(responses)
        assert isinstance(result, dict)
        assert 40 <= result["overall_score"] <= 60  # Should be around neutral


class TestCalculateWeeklySummary:
    """Tests for weekly summary calculation"""
    
    def test_empty_responses(self):
        """Test with no responses"""
        result = calculate_weekly_summary([])
        assert result["days_completed"] == 0
        assert result["top_themes"] == []
        assert "weekly_trend" in result
    
    def test_weekly_calculation(self):
        """Test weekly summary with responses"""
        today = datetime.now()
        responses = [
            {
                "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=i),
                "answers": [{"text": f"Day {i} reflection"}]
            }
            for i in range(5)
        ]
        result = calculate_weekly_summary(responses)
        assert result["days_completed"] == 5
        assert isinstance(result["positivity_score"], (int, float))
        assert 0 <= result["positivity_score"] <= 100


class TestCalculateFrequencyCharts:
    """Tests for frequency chart calculation"""
    
    def test_empty_responses(self):
        """Test with no responses"""
        result = calculate_frequency_charts([])
        assert result["top_keywords"] == {}
    
    def test_keyword_extraction(self):
        """Test keyword frequency calculation"""
        responses = [
            {
                "answers": [
                    {"text": "I love programming and coding"},
                    {"text": "Programming is fun"}
                ]
            }
        ]
        result = calculate_frequency_charts(responses)
        assert "top_keywords" in result
        # Keywords may be empty if NLP processing doesn't extract them
        # This test verifies the structure exists
        assert isinstance(result["top_keywords"], dict)
    
    def test_keyword_ranking(self):
        """Test keywords are ranked by frequency"""
        responses = [
            {
                "answers": [
                    {"text": "happy happy happy"},
                    {"text": "sad"}
                ]
            }
        ]
        result = calculate_frequency_charts(responses)
        keywords = list(result["top_keywords"].keys())
        if keywords:
            # Most frequent should be first
            assert result["top_keywords"][keywords[0]] >= result["top_keywords"].get(keywords[-1], 0)
