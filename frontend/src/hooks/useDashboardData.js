// Custom hook for managing dashboard data fetching and state
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { DEFAULT_VALUES } from '../config/dashboardConfig';
import { normalizeDailySentiment } from '../utils/dashboardUtils';

const useDashboardData = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todaySubmitted, setTodaySubmitted] = useState(false);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.getDashboardSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkTodayStatus = useCallback(async () => {
    try {
      const status = await apiService.getTodayStatus();
      setTodaySubmitted(status.data.submitted);
    } catch (err) {
      console.error('Status check error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
    checkTodayStatus();
  }, [fetchDashboardSummary, checkTodayStatus]);

  // Extract and normalize data with defaults
  const {
    daily_progress = DEFAULT_VALUES.daily_progress,
    positivity_score = DEFAULT_VALUES.positivity_score,
    weekly_summary = DEFAULT_VALUES.weekly_summary,
    top_keywords = DEFAULT_VALUES.top_keywords,
    daily_sentiment: raw_daily_sentiment = DEFAULT_VALUES.daily_sentiment,
    total_reflections = DEFAULT_VALUES.total_reflections,
    last_submission = DEFAULT_VALUES.last_submission,
  } = summary || {};

  // Normalize daily sentiment
  const daily_sentiment = normalizeDailySentiment(raw_daily_sentiment);

  const refetch = useCallback(async () => {
    await fetchDashboardSummary();
    await checkTodayStatus();
  }, [fetchDashboardSummary, checkTodayStatus]);

  return {
    // State
    summary,
    loading,
    error,
    todaySubmitted,
    
    // Data
    daily_progress,
    positivity_score,
    weekly_summary,
    top_keywords,
    daily_sentiment,
    total_reflections,
    last_submission,
    
    // Actions
    refetch,
  };
};

export default useDashboardData;

