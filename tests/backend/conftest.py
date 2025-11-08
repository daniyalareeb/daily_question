"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict
from unittest.mock import Mock, AsyncMock


@pytest.fixture
def sample_responses() -> List[Dict]:
    """Sample response data for testing"""
    today = datetime.now()
    return [
        {
            "_id": "response1",
            "userId": "user123",
            "date": today.strftime("%Y-%m-%d"),
            "submittedAt": today,
            "answers": [
                {"questionId": "q1", "text": "I feel happy and excited today"},
                {"questionId": "q2", "text": "I accomplished my goals"}
            ]
        },
        {
            "_id": "response2",
            "userId": "user123",
            "date": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            "submittedAt": today - timedelta(days=1),
            "answers": [
                {"questionId": "q1", "text": "I was tired and stressed"},
                {"questionId": "q2", "text": "Had some challenges"}
            ]
        },
        {
            "_id": "response3",
            "userId": "user123",
            "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
            "submittedAt": today - timedelta(days=2),
            "answers": [
                {"questionId": "q1", "text": "Feeling great and positive"},
                {"questionId": "q2", "text": "Everything went well"}
            ]
        }
    ]


@pytest.fixture
def sample_questions() -> List[Dict]:
    """Sample question data for testing"""
    return [
        {"_id": "q1", "text": "How are you feeling today?", "category": "emotions"},
        {"_id": "q2", "text": "What did you accomplish today?", "category": "achievements"},
        {"_id": "q3", "text": "What are you grateful for?", "category": "gratitude"}
    ]


@pytest.fixture
def mock_user() -> Dict:
    """Mock user data"""
    return {
        "uid": "user123",
        "email": "test@example.com"
    }


@pytest.fixture
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


