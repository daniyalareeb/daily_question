/**
 * Integration tests for complete user flows
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../../src/App';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { QuestionsProvider } from '../../../src/contexts/QuestionsContext';

// Mock API calls
jest.mock('../../../src/services/api', () => ({
  apiService: {
    getQuestions: jest.fn().mockResolvedValue({
      data: [
        { id: 'q1', text: 'How are you feeling today?' },
        { id: 'q2', text: 'What did you accomplish today?' }
      ]
    }),
    getTodayStatus: jest.fn().mockResolvedValue({ data: { submitted: false } }),
    submitResponse: jest.fn().mockResolvedValue({ data: { success: true } }),
    getDashboardSummary: jest.fn().mockResolvedValue({
      data: {
        daily_progress: { days_this_month: 5, current_streak: 3 },
        positivity_score: 75,
        weekly_summary: { days_completed: 5 },
        top_keywords: { top_10: ['happy', 'grateful'] },
        daily_sentiment: {},
        total_reflections: 10,
        last_submission: '2025-11-07'
      }
    })
  }
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <QuestionsProvider>
          <App />
        </QuestionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Complete User Flow', () => {
  test('user can navigate from questions to dashboard', async () => {
    renderApp();
    
    // Navigate to dashboard
    const dashboardLink = screen.getByText(/Dashboard/i);
    fireEvent.click(dashboardLink);

    await waitFor(() => {
      expect(screen.getByText(/Your Reflection Dashboard/i)).toBeInTheDocument();
    });
  });

  test('user can complete daily reflection flow', async () => {
    renderApp();
    
    // Should start at questions page
    await waitFor(() => {
      expect(screen.getByText(/Daily Reflection/i)).toBeInTheDocument();
    });
  });
});


