/**
 * Comprehensive unit tests for Questions component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Questions from '../../../src/pages/Questions';
import { QuestionsProvider } from '../../../src/contexts/QuestionsContext';
import { AuthProvider } from '../../../src/contexts/AuthContext';

// Mock the questions context
const mockQuestions = [
  { id: 'q1', text: 'How are you feeling today?' },
  { id: 'q2', text: 'What did you accomplish today?' },
  { id: 'q3', text: 'What are you grateful for?' }
];

const mockQuestionsContext = {
  questions: mockQuestions,
  loading: false,
  error: null,
  submitResponses: jest.fn().mockResolvedValue({}),
  getTodayStatus: jest.fn().mockResolvedValue({ submitted: false })
};

jest.mock('../../../src/contexts/QuestionsContext', () => ({
  ...jest.requireActual('../../../src/contexts/QuestionsContext'),
  useQuestions: () => mockQuestionsContext
}));

const renderQuestions = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <QuestionsProvider>
          <Questions />
        </QuestionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Questions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuestionsContext.getTodayStatus.mockResolvedValue({ submitted: false });
  });

  test('renders first question', async () => {
    renderQuestions();
    await waitFor(() => {
      expect(screen.getByText(/How are you feeling today/i)).toBeInTheDocument();
    });
  });

  test('displays question progress', async () => {
    renderQuestions();
    await waitFor(() => {
      expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument();
    });
  });

  test('navigates to next question', async () => {
    renderQuestions();
    await waitFor(() => {
      expect(screen.getByText(/How are you feeling today/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/What did you accomplish today/i)).toBeInTheDocument();
    });
  });

  test('navigates to previous question', async () => {
    renderQuestions();
    await waitFor(() => {
      expect(screen.getByText(/How are you feeling today/i)).toBeInTheDocument();
    });

    // Go to second question first
    const nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/What did you accomplish today/i)).toBeInTheDocument();
    });

    // Then go back
    const prevButton = screen.getByText(/Previous/i);
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/How are you feeling today/i)).toBeInTheDocument();
    });
  });

  test('shows completion screen when already submitted', async () => {
    mockQuestionsContext.getTodayStatus.mockResolvedValue({ submitted: true });
    
    renderQuestions();
    
    await waitFor(() => {
      expect(screen.getByText(/You're Done for Today/i)).toBeInTheDocument();
    });
  });

  test('validates answer before submission', async () => {
    renderQuestions();
    
    await waitFor(() => {
      expect(screen.getByText(/How are you feeling today/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please answer this question/i)).toBeInTheDocument();
    });
  });
});


