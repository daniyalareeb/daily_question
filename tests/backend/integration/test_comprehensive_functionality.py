"""
Comprehensive Integration Test
Tests all major functionality of the Daily Questions application
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..', 'backend'))

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, Mock, AsyncMock
from app.services.analytics_service import (
    calculate_daily_progress,
    calculate_daily_sentiment_chart,
    calculate_positivity_score,
    calculate_weekly_summary,
    calculate_frequency_charts
)
from app.services.nlp_service import aggregate_keywords_across_responses, extract_keywords_from_text


class TestComprehensiveFunctionality:
    """Comprehensive test suite covering all major features"""
    
    def test_complete_user_journey(self):
        """Test complete user journey: submit responses, track progress, view analytics"""
        # Simulate user submitting responses for 7 consecutive days
        today = datetime.now()
        responses = []
        
        for i in range(7):
            response = {
                "_id": f"resp_{i}",
                "userId": "test_user_123",
                "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=i),
                "answers": [
                    {
                        "questionId": "q1",
                        "text": f"I feel happy and excited on day {i}. I accomplished my goals and I'm grateful for my family."
                    },
                    {
                        "questionId": "q2",
                        "text": f"Today I learned something new about programming and technology."
                    }
                ]
            }
            responses.append(response)
        
        # Test 1: Daily Progress Calculation
        progress = calculate_daily_progress(responses)
        assert progress["total_days"] == 7
        assert progress["current_streak"] == 7  # 7 consecutive days
        assert progress["longest_streak"] == 7
        assert progress["days_this_month"] == 7  # All in current month
        
        # Test 2: Sentiment Analysis
        sentiment = calculate_daily_sentiment_chart(responses, days=7)
        assert len(sentiment) == 7  # Should have sentiment for all 7 days
        
        # Check that all days have positive sentiment (contains "happy", "excited", "grateful")
        for date_str, data in sentiment.items():
            assert data["score"] > 50  # Positive sentiment
            assert data["positive"] > 0  # Has positive keywords
            assert "score" in data
            assert "positive" in data
            assert "negative" in data
        
        # Test 3: Positivity Score
        positivity = calculate_positivity_score(responses)
        assert isinstance(positivity, dict)
        assert "overall_score" in positivity
        assert positivity["overall_score"] > 50  # Should be positive
        assert positivity["positive_count"] > 0
        assert positivity["trend"] in ["very_positive", "positive"]
        
        # Test 4: Weekly Summary
        weekly = calculate_weekly_summary(responses)
        assert weekly["days_completed"] == 7
        assert "positivity_score" in weekly or "weekly_trend" in weekly
        assert isinstance(weekly["top_themes"], list)
        
        # Test 5: Keyword Extraction and Frequency
        keywords = calculate_frequency_charts(responses)
        assert "top_keywords" in keywords
        assert isinstance(keywords["top_keywords"], dict)
        assert keywords["total_responses"] == 7
        
        # Keywords should be extracted from text
        assert len(keywords["top_keywords"]) > 0  # Should have extracted keywords
    
    def test_user_breaks_streak_and_recovers(self):
        """Test user breaks streak, then recovers"""
        today = datetime.now()
        
        # Create responses with a gap (missing 2 days in the middle)
        responses = []
        for i in [0, 1, 2, 5, 6]:  # Missing days 3 and 4
            response = {
                "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=i),
                "answers": [{"text": f"Day {i} reflection"}]
            }
            responses.append(response)
        
        progress = calculate_daily_progress(responses)
        
        # Current streak should be 3 (today, yesterday, 2 days ago - consecutive)
        assert progress["current_streak"] == 3
        
        # Longest streak should be at least 2 (the consecutive days at the end)
        assert progress["longest_streak"] >= 2
        
        # Total days should be 5
        assert progress["total_days"] == 5
    
    def test_mixed_sentiment_tracking(self):
        """Test tracking mixed positive and negative sentiment"""
        today = datetime.now()
        responses = [
            {
                "date": today.strftime("%Y-%m-%d"),
                "submittedAt": today,
                "answers": [{"text": "I feel happy, excited, and grateful today!"}]
            },
            {
                "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=1),
                "answers": [{"text": "I feel sad, worried, and stressed today"}]
            },
            {
                "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=2),
                "answers": [{"text": "I feel happy but also tired and stressed"}]
            }
        ]
        
        sentiment = calculate_daily_sentiment_chart(responses, days=7)
        assert len(sentiment) == 3
        
        # First day should be very positive
        today_data = sentiment[today.strftime("%Y-%m-%d")]
        assert today_data["score"] > 70
        assert today_data["positive"] > 0
        assert today_data["negative"] == 0
        
        # Second day should be negative
        yesterday_data = sentiment[(today - timedelta(days=1)).strftime("%Y-%m-%d")]
        assert yesterday_data["score"] < 50
        assert yesterday_data["negative"] > 0
        
        # Third day should be mixed
        two_days_ago_data = sentiment[(today - timedelta(days=2)).strftime("%Y-%m-%d")]
        assert two_days_ago_data["positive"] > 0
        assert two_days_ago_data["negative"] > 0
    
    def test_keyword_extraction_from_text(self):
        """Test automatic keyword extraction from text when keywords field is missing"""
        responses = [
            {
                "answers": [
                    {
                        "text": "I love programming and coding. Technology is my passion.",
                        # No "keywords" field - should be extracted automatically
                    }
                ]
            },
            {
                "answers": [
                    {
                        "text": "Programming is fun and I enjoy learning new technologies",
                        # No "keywords" field
                    }
                ]
            }
        ]
        
        # This should automatically extract keywords from text
        keywords = aggregate_keywords_across_responses(responses)
        
        # Should have extracted some keywords
        assert len(keywords) > 0
        
        # Check that common words from the text are present (may be grouped)
        keyword_text = " ".join(keywords.keys()).lower()
        assert "program" in keyword_text or "technolog" in keyword_text or "learn" in keyword_text
    
    def test_empty_data_handling(self):
        """Test all functions handle empty data gracefully"""
        empty_responses = []
        
        # All functions should handle empty data without errors
        progress = calculate_daily_progress(empty_responses)
        assert progress["total_days"] == 0
        assert progress["current_streak"] == 0
        assert progress["longest_streak"] == 0
        
        sentiment = calculate_daily_sentiment_chart(empty_responses, days=7)
        assert sentiment == {}
        
        positivity = calculate_positivity_score(empty_responses)
        assert isinstance(positivity, dict)
        assert positivity["overall_score"] == 0
        
        weekly = calculate_weekly_summary(empty_responses)
        assert weekly["days_completed"] == 0
        assert weekly["top_themes"] == []
        
        keywords = calculate_frequency_charts(empty_responses)
        assert keywords["top_keywords"] == {}
        assert keywords["total_responses"] == 0
    
    def test_single_response_handling(self):
        """Test handling of single response"""
        today = datetime.now()
        single_response = [{
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [{"text": "I feel great today!"}]
        }]
        
        progress = calculate_daily_progress(single_response)
        assert progress["total_days"] == 1
        assert progress["current_streak"] >= 1
        
        sentiment = calculate_daily_sentiment_chart(single_response, days=7)
        assert today.strftime("%Y-%m-%d") in sentiment
        assert sentiment[today.strftime("%Y-%m-%d")]["score"] > 50
    
    def test_multiple_responses_same_day(self):
        """Test that multiple responses on same day count as one"""
        today = datetime.now()
        responses = [
            {
                "date": today.strftime("%Y-%m-%d"),
                "submittedAt": today,
                "answers": [{"text": "First response"}]
            },
            {
                "date": today.strftime("%Y-%m-%d"),
                "submittedAt": today,
                "answers": [{"text": "Second response"}]
            }
        ]
        
        progress = calculate_daily_progress(responses)
        # Should count as 1 day, not 2
        assert progress["total_days"] == 1
    
    def test_keyword_ranking(self):
        """Test that keywords are ranked by frequency"""
        responses = [
            {
                "answers": [
                    {"text": "happy happy happy"},  # "happy" appears 3 times
                    {"text": "sad"}  # "sad" appears 1 time
                ]
            }
        ]
        
        keywords = calculate_frequency_charts(responses)
        
        if len(keywords["top_keywords"]) > 0:
            # Get the most frequent keyword
            top_keyword = max(keywords["top_keywords"].items(), key=lambda x: x[1])
            # Should have some frequency
            assert top_keyword[1] > 0
    
    def test_monthly_progress_calculation(self):
        """Test monthly progress only counts current month"""
        today = datetime.now()
        current_month = today.strftime("%Y-%m")
        
        # Create responses spanning current month only
        responses = []
        for i in range(5):
            date = today - timedelta(days=i)
            if date.strftime("%Y-%m") == current_month:
                responses.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "submittedAt": date,
                    "answers": [{"text": "Reflection"}]
                })
        
        progress = calculate_daily_progress(responses)
        # All should be in current month
        assert progress["days_this_month"] == len(responses)
    
    def test_weekly_summary_with_keywords(self):
        """Test weekly summary includes keyword-based themes"""
        today = datetime.now()
        responses = []
        
        for i in range(5):
            responses.append({
                "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=i),
                "answers": [
                    {
                        "text": "I love programming and technology",
                        "keywords": ["technology", "programming"]  # Pre-extracted keywords
                    }
                ]
            })
        
        weekly = calculate_weekly_summary(responses)
        assert weekly["days_completed"] == 5
        assert isinstance(weekly["top_themes"], list)
    
    def test_sentiment_score_calculation(self):
        """Test sentiment score calculation accuracy"""
        # Test with known positive keywords
        responses = [{
            "answers": [{"text": "happy happy happy excited grateful"}]
        }]
        
        positivity = calculate_positivity_score(responses)
        assert positivity["overall_score"] > 80  # Should be very positive
        assert positivity["positive_count"] >= 3  # At least 3 positive keywords
        assert positivity["negative_count"] == 0
        
        # Test with known negative keywords
        negative_responses = [{
            "answers": [{"text": "sad worried stressed tired"}]
        }]
        
        negative_positivity = calculate_positivity_score(negative_responses)
        assert negative_positivity["overall_score"] < 50  # Should be negative
        assert negative_positivity["negative_count"] >= 2  # At least 2 negative keywords
    
    def test_all_functions_with_realistic_data(self):
        """Test all functions with realistic user data"""
        today = datetime.now()
        
        # Simulate realistic user data over 2 weeks
        realistic_responses = []
        for i in range(14):
            # Mix of positive and neutral days
            if i % 3 == 0:
                text = "I feel sad and worried today"
            elif i % 2 == 0:
                text = "I feel happy and excited! Grateful for everything."
            else:
                text = "Today was a normal day, nothing special"
            
            realistic_responses.append({
                "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
                "submittedAt": today - timedelta(days=i),
                "answers": [
                    {"questionId": "q1", "text": text},
                    {"questionId": "q2", "text": f"Day {i} accomplishments"}
                ]
            })
        
        # Test all analytics functions
        progress = calculate_daily_progress(realistic_responses)
        assert progress["total_days"] == 14
        
        sentiment = calculate_daily_sentiment_chart(realistic_responses, days=14)
        assert len(sentiment) <= 14  # May have fewer if some days have no sentiment keywords
        
        positivity = calculate_positivity_score(realistic_responses)
        assert 0 <= positivity["overall_score"] <= 100
        
        weekly = calculate_weekly_summary(realistic_responses)
        assert weekly["days_completed"] <= 14
        
        keywords = calculate_frequency_charts(realistic_responses)
        assert keywords["total_responses"] == 14


