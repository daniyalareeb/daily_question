/**
 * Comprehensive unit tests for Dashboard component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../../src/pages/Dashboard';
import { QuestionsProvider } from '../../../src/contexts/QuestionsContext';
import { AuthProvider } from '../../../src/contexts/AuthContext';

// Mock the dashboard data hook
jest.mock('../../../src/hooks/useDashboardData', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    todaySubmitted: false,
    daily_progress: {
      days_this_month: 15,
      current_streak: 5,
      longest_streak: 10,
      total_days: 30
    },
    positivity_score: 75,
    weekly_summary: {
      days_completed: 5,
      positivity_score: 70,
      top_themes: ['gratitude', 'growth', 'happiness']
    },
    top_keywords: {
      top_10: ['happy', 'grateful', 'excited'],
      counts: { happy: 10, grateful: 8, excited: 5 }
    },
    daily_sentiment: {
      '2025-11-07': { score: 72, positive: 8, negative: 3 },
      '2025-11-06': { score: 65, positive: 5, negative: 2 }
    },
    total_reflections: 30,
    last_submission: '2025-11-07'
  })
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <QuestionsProvider>
          <Dashboard />
        </QuestionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  test('renders dashboard title', () => {
    renderDashboard();
    expect(screen.getByText(/Your Reflection Dashboard/i)).toBeInTheDocument();
  });

  test('displays daily progress stats', () => {
    renderDashboard();
    expect(screen.getByText(/Days This Month/i)).toBeInTheDocument();
    expect(screen.getByText(/15/i)).toBeInTheDocument();
  });

  test('displays streak information', () => {
    renderDashboard();
    expect(screen.getByText(/Current Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });

  test('displays positivity score', () => {
    renderDashboard();
    expect(screen.getByText(/75%/i)).toBeInTheDocument();
  });

  test('displays weekly summary', () => {
    renderDashboard();
    expect(screen.getByText(/Days completed this week/i)).toBeInTheDocument();
    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });

  test('displays top themes', () => {
    renderDashboard();
    expect(screen.getByText(/Top Themes This Week/i)).toBeInTheDocument();
    expect(screen.getByText(/gratitude/i)).toBeInTheDocument();
  });

  test('displays sentiment chart', () => {
    renderDashboard();
    expect(screen.getByText(/Daily Sentiment Trends/i)).toBeInTheDocument();
  });

  test('displays keywords chart', () => {
    renderDashboard();
    expect(screen.getByText(/Top Keywords/i)).toBeInTheDocument();
  });
});

describe('Dashboard Loading State', () => {
  test('shows loading state', () => {
    jest.resetModules();
    jest.mock('../../../src/hooks/useDashboardData', () => ({
      __esModule: true,
      default: () => ({ loading: true, error: null })
    }));

    const Dashboard = require('../../../src/pages/Dashboard').default;
    render(
      <BrowserRouter>
        <AuthProvider>
          <QuestionsProvider>
            <Dashboard />
          </QuestionsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe('Dashboard Error State', () => {
  test('shows error message', () => {
    jest.resetModules();
    jest.mock('../../../src/hooks/useDashboardData', () => ({
      __esModule: true,
      default: () => ({ loading: false, error: 'Failed to load data' })
    }));

    const Dashboard = require('../../../src/pages/Dashboard').default;
    render(
      <BrowserRouter>
        <AuthProvider>
          <QuestionsProvider>
            <Dashboard />
          </QuestionsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
  });
});
