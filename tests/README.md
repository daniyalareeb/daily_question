# Test Suite

This directory contains comprehensive tests for the Daily Questions application.

## Structure

```
tests/
├── backend/
│   ├── unit/          # Unit tests for backend services and utilities
│   ├── integration/   # Integration tests for API endpoints
│   └── uat/           # User Acceptance Tests for backend features
├── frontend/
│   ├── unit/          # Unit tests for React components and hooks
│   ├── integration/   # Integration tests for frontend flows
│   └── uat/           # User Acceptance Tests for frontend features
└── README.md          # This file
```

## Running Tests

### Backend Tests

#### Run all backend tests:
```bash
cd /home/daniyalareeb/MyProjects/daily_question
PYTHONPATH=/home/daniyalareeb/MyProjects/daily_question/backend python3 -m pytest tests/backend/ -v
```

#### Run specific test categories:
```bash
# Unit tests only
PYTHONPATH=/home/daniyalareeb/MyProjects/daily_question/backend python3 -m pytest tests/backend/unit/ -v

# Integration tests only
PYTHONPATH=/home/daniyalareeb/MyProjects/daily_question/backend python3 -m pytest tests/backend/integration/ -v

# UAT tests only
PYTHONPATH=/home/daniyalareeb/MyProjects/daily_question/backend python3 -m pytest tests/backend/uat/ -v
```

#### Run specific test file:
```bash
PYTHONPATH=/home/daniyalareeb/MyProjects/daily_question/backend python3 -m pytest tests/backend/unit/test_analytics_service.py -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Test Results

### Backend Unit Tests: ✅ 20/20 PASSED

**Test Coverage:**
- ✅ Daily Progress Calculation (5 tests)
- ✅ Daily Sentiment Chart (6 tests)
- ✅ Positivity Score Calculation (4 tests)
- ✅ Weekly Summary (2 tests)
- ✅ Frequency Charts (3 tests)

**Key Test Scenarios:**
- Empty responses handling
- Single and multiple responses
- Streak calculations (consecutive and broken)
- Positive/negative/mixed sentiment detection
- Keyword extraction and ranking
- Weekly aggregation

## Test Types

### Unit Tests
- Test individual functions and components in isolation
- Fast execution
- Mock external dependencies
- **Location:** `backend/unit/`, `frontend/unit/`

### Integration Tests
- Test interactions between components/services
- Test API endpoints with database
- Test frontend-backend communication
- **Location:** `backend/integration/`, `frontend/integration/`

### UAT (User Acceptance Tests)
- Test complete user workflows
- End-to-end scenarios
- Real-world usage patterns
- **Location:** `backend/uat/`, `frontend/uat/`

## Dependencies

### Backend
- `pytest` - Test framework
- `pytest-asyncio` - Async test support
- `httpx` - HTTP client for API testing

### Frontend
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `jest` - Test runner (via react-scripts)

## Writing New Tests

### Backend Test Template
```python
import pytest
from app.services.your_service import your_function

class TestYourFunction:
    def test_basic_case(self):
        result = your_function(input_data)
        assert result == expected_output
    
    def test_edge_case(self):
        result = your_function(edge_case_input)
        assert result is not None
```

### Frontend Test Template
```javascript
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  test('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before deploying to production
