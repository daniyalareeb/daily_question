import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const QuestionsContext = createContext();

export function useQuestions() {
  return useContext(QuestionsContext);
}

export function QuestionsProvider({ children }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch questions from API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getQuestions();
      
      if (response && response.data) {
        setQuestions(response.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch questions';
      setError(errorMessage);
      console.error('Error fetching questions:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code
      });
      
      // If it's a network error, provide more helpful message
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check your internet connection and ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get question by ID
  const getQuestionById = async (id) => {
    try {
      const response = await apiService.getQuestionById(id);
      return response.data;
    } catch (err) {
      console.error('Error fetching question:', err);
      throw err;
    }
  };

  // Submit daily responses
  const submitResponses = async (responseData) => {
    try {
      const response = await apiService.submitResponse(responseData);
      return response.data;
    } catch (err) {
      console.error('Error submitting responses:', err);
      throw err;
    }
  };

  // Check today's submission status
  const getTodayStatus = async () => {
    try {
      const response = await apiService.getTodayStatus();
      return response.data;
    } catch (err) {
      console.error('Error checking today status:', err);
      throw err;
    }
  };

  // Get user responses
  const getUserResponses = async (startDate = null, endDate = null) => {
    try {
      const response = await apiService.getUserResponses(startDate, endDate);
      return response.data;
    } catch (err) {
      console.error('Error fetching user responses:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const value = {
    questions,
    loading,
    error,
    fetchQuestions,
    getQuestionById,
    submitResponses,
    getTodayStatus,
    getUserResponses
  };

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  );
}


