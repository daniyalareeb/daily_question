"""
Integration tests for dashboard API endpoints
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..', 'backend'))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, Mock


@pytest.fixture
def client():
    """Create test client - using FastAPI's TestClient which handles version compatibility"""
    # FastAPI's TestClient is a wrapper that handles httpx version differences
    return TestClient(app)


@pytest.fixture
def mock_auth():
    """Mock authentication"""
    def get_current_user():
        return {"uid": "test_user_123", "email": "test@example.com"}
    return get_current_user


@pytest.fixture
def mock_responses():
    """Mock database responses"""
    from datetime import datetime, timedelta
    today = datetime.now()
    return [
        {
            "_id": "resp1",
            "userId": "test_user_123",
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [
                {"questionId": "q1", "text": "I feel happy today"},
                {"questionId": "q2", "text": "Accomplished my goals"}
            ]
        },
        {
            "_id": "resp2",
            "userId": "test_user_123",
            "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            "submittedAt": today - timedelta(days=1),
            "answers": [
                {"questionId": "q1", "text": "Feeling good"},
                {"questionId": "q2", "text": "Had a productive day"}
            ]
        }
    ]


class TestDashboardSummary:
    """Tests for /api/dashboard/summary endpoint"""
    
    @patch('app.api.dashboard.get_current_user')
    @patch('app.api.dashboard.get_responses')
    def test_get_summary_success(self, mock_get_responses, mock_get_user, client, mock_responses, mock_auth):
        """Test successful dashboard summary retrieval"""
        mock_get_user.return_value = mock_auth()
        mock_get_responses.return_value = mock_responses
        
        response = client.get("/api/dashboard/summary", headers={"Authorization": "Bearer test_token"})
        
        assert response.status_code == 200
        data = response.json()
        assert "daily_progress" in data
        assert "positivity_score" in data
        assert "weekly_summary" in data
        assert "top_keywords" in data
        assert "daily_sentiment" in data
        assert "total_reflections" in data
        assert "last_submission" in data
    
    @patch('app.api.dashboard.get_current_user')
    def test_get_summary_unauthorized(self, mock_get_user, client):
        """Test unauthorized access"""
        mock_get_user.side_effect = Exception("Unauthorized")
        
        response = client.get("/api/dashboard/summary")
        
        assert response.status_code in [401, 403, 422]
    
    @patch('app.api.dashboard.get_current_user')
    @patch('app.api.dashboard.get_responses')
    def test_get_summary_empty_data(self, mock_get_responses, mock_get_user, client, mock_auth):
        """Test dashboard summary with no responses"""
        mock_get_user.return_value = mock_auth()
        mock_get_responses.return_value = []
        
        response = client.get("/api/dashboard/summary", headers={"Authorization": "Bearer test_token"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_reflections"] == 0
        assert data["daily_progress"]["total_days"] == 0


class TestWeeklySentiment:
    """Tests for /api/dashboard/weekly-sentiment endpoint"""
    
    @patch('app.api.dashboard.get_current_user')
    @patch('app.api.dashboard.get_responses')
    def test_get_weekly_sentiment(self, mock_get_responses, mock_get_user, client, mock_responses, mock_auth):
        """Test weekly sentiment retrieval"""
        mock_get_user.return_value = mock_auth()
        mock_get_responses.return_value = mock_responses
        
        response = client.get("/api/dashboard/weekly-sentiment", headers={"Authorization": "Bearer test_token"})
        
        assert response.status_code == 200
        data = response.json()
        assert "daily_sentiment" in data
        assert isinstance(data["daily_sentiment"], dict)


class TestDashboardAnalytics:
    """Tests for /api/dashboard/analytics endpoint"""
    
    @patch('app.api.dashboard.get_current_user')
    @patch('app.api.dashboard.get_responses')
    def test_get_analytics(self, mock_get_responses, mock_get_user, client, mock_responses, mock_auth):
        """Test analytics retrieval"""
        mock_get_user.return_value = mock_auth()
        mock_get_responses.return_value = mock_responses
        
        response = client.get("/api/dashboard/analytics?time_filter=recent", headers={"Authorization": "Bearer test_token"})
        
        assert response.status_code == 200
        data = response.json()
        assert "analytics" in data or "data" in data
    
    @patch('app.api.dashboard.get_current_user')
    def test_get_analytics_invalid_filter(self, mock_get_user, client, mock_auth):
        """Test analytics with invalid time filter"""
        mock_get_user.return_value = mock_auth()
        
        response = client.get("/api/dashboard/analytics?time_filter=invalid", headers={"Authorization": "Bearer test_token"})
        
        assert response.status_code == 400

