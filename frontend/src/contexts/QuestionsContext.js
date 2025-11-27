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
      setQuestions(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch questions');
      console.error('Error fetching questions:', err);
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


