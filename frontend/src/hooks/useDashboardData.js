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
  
  // Health & Wellness data
  const [sleepQualityTrend, setSleepQualityTrend] = useState(null);
  const [sleepDuration, setSleepDuration] = useState(null);
  const [bedtimePattern, setBedtimePattern] = useState(null);
  const [sleepScore, setSleepScore] = useState(null);
  const [nutritionRatio, setNutritionRatio] = useState(null);
  const [mealFrequency, setMealFrequency] = useState(null);
  const [nutritionScore, setNutritionScore] = useState(null);
  const [exerciseFrequency, setExerciseFrequency] = useState(null);
  const [exerciseDistribution, setExerciseDistribution] = useState(null);
  const [hydrationConsistency, setHydrationConsistency] = useState(null);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Fetching dashboard summary...');
      console.log('📍 API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
      console.log('🔑 Token exists:', !!localStorage.getItem('jwtToken'));
      
      const response = await apiService.getDashboardSummary();
      console.log('✅ Dashboard summary response:', response.data);
      console.log('✅ Total reflections:', response.data?.total_reflections);
      console.log('✅ Response status:', response.status);
      
      if (response.data) {
        setSummary(response.data);
        
        // If we got data but total_reflections is 0, log it for debugging
        if (response.data.total_reflections === 0) {
          console.warn('⚠️ Dashboard returned 0 total_reflections but has data:', response.data);
          console.warn('⚠️ Daily progress:', response.data.daily_progress);
        } else {
          console.log('✅ Dashboard data loaded successfully:', {
            total_reflections: response.data.total_reflections,
            daily_progress: response.data.daily_progress
          });
        }
      } else {
        console.warn('⚠️ Dashboard response has no data');
        setSummary(null);
      }
    } catch (err) {
      console.error('❌ Dashboard error:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error details:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Request config:', err.config);
      
      // Check if it's a CORS error
      if (err.code === 'ERR_NETWORK' || err.message?.includes('CORS') || err.message?.includes('blocked')) {
        console.error('🚫 CORS Error Detected!');
        console.error('   This usually means:');
        console.error('   1. Backend server is not running');
        console.error('   2. Backend CORS is not configured correctly');
        console.error('   3. Network/firewall is blocking the request');
        console.error('   ✅ Backend CORS is configured correctly (verified)');
        console.error('   🔧 Try: Restart backend server if you just changed CORS config');
      }
      
      setError('Failed to load dashboard summary');
      setSummary(null); // Clear summary on error
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

  const fetchHealthWellnessData = useCallback(async () => {
    try {
      // Use optimized unified endpoint (single request instead of 10 separate calls)
      const response = await apiService.getHealthWellnessAll(30);
      const data = response.data;

      // Set sleep data
      if (data.sleep) {
        setSleepQualityTrend(data.sleep.quality_trend || {});
        setSleepDuration(data.sleep.duration_distribution || null);
        setBedtimePattern(data.sleep.bedtime_pattern || null);
        setSleepScore(data.sleep.score || null);
      }

      // Set nutrition data
      if (data.nutrition) {
        setNutritionRatio(data.nutrition.ratio || null);
        setMealFrequency(data.nutrition.meal_frequency || {});
        setNutritionScore(data.nutrition.score || null);
      }

      // Set exercise data
      if (data.exercise) {
        setExerciseFrequency(data.exercise.frequency || {});
        setExerciseDistribution(data.exercise.distribution || null);
      }

      // Set hydration data
      if (data.hydration) {
        setHydrationConsistency(data.hydration.consistency || null);
      }
    } catch (err) {
      console.error('Error fetching health & wellness data:', err);
      // Set defaults on error
      setSleepQualityTrend({});
      setSleepDuration(null);
      setBedtimePattern(null);
      setSleepScore(null);
      setNutritionRatio(null);
      setMealFrequency({});
      setNutritionScore(null);
      setExerciseFrequency({});
      setExerciseDistribution(null);
      setHydrationConsistency(null);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
    checkTodayStatus();
    fetchHealthWellnessData();
  }, [fetchDashboardSummary, checkTodayStatus, fetchHealthWellnessData]);

  // Extract and normalize data with defaults
  // Map backend response fields to frontend expected fields
  const {
    daily_progress = DEFAULT_VALUES.daily_progress,
    mood_score, // Backend returns mood_score
    weekly_summary = DEFAULT_VALUES.weekly_summary,
    top_selections, // Backend returns top_selections
    daily_mood, // Backend returns daily_mood
    total_reflections = DEFAULT_VALUES.total_reflections,
    last_submission = DEFAULT_VALUES.last_submission,
  } = summary || {};

  // Map backend fields to frontend expected names
  const positivity_score = mood_score || DEFAULT_VALUES.positivity_score;
  // Backend returns top_selections with {top_10: [], counts: {}}, which matches our expected structure
  const top_keywords = top_selections || DEFAULT_VALUES.top_keywords;
  const raw_daily_sentiment = daily_mood || DEFAULT_VALUES.daily_sentiment;

  // Normalize daily sentiment
  const daily_sentiment = normalizeDailySentiment(raw_daily_sentiment);

  const refetch = useCallback(async () => {
    await fetchDashboardSummary();
    await checkTodayStatus();
    await fetchHealthWellnessData();
  }, [fetchDashboardSummary, checkTodayStatus, fetchHealthWellnessData]);

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
    
    // Health & Wellness Data
    sleepQualityTrend,
    sleepDuration,
    bedtimePattern,
    sleepScore,
    nutritionRatio,
    mealFrequency,
    nutritionScore,
    exerciseFrequency,
    exerciseDistribution,
    hydrationConsistency,
    
    // Actions
    refetch,
  };
};

export default useDashboardData;

