// Custom hook for managing dashboard data fetching and state
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { DEFAULT_VALUES } from '../config/dashboardConfig';
import { normalizeDailySentiment } from '../utils/dashboardUtils';
import { useAuth } from '../contexts/AuthContext';
import { aggregateByWeek, aggregateByMonth, getDaysForRange } from '../utils/chartAggregation';

const useDashboardData = (timeRange = '7D') => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todaySubmitted, setTodaySubmitted] = useState(false);
  const [registrationDate, setRegistrationDate] = useState(null);
  
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
  const [hydrationFrequency, setHydrationFrequency] = useState({});

  const fetchDashboardSummary = useCallback(async () => {
    try {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Fetching dashboard summary...');
      }
      
      // Force refresh to bypass cache (in case of stale data)
      const response = await apiService.getDashboardSummary(true);
      if (response && response.data) {
        setSummary(response.data);
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          if (response.data.total_reflections === 0) {
            console.warn('⚠️ Dashboard returned 0 total_reflections');
          } else {
            console.log('✅ Dashboard data loaded successfully');
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Dashboard response has no data');
        }
        setSummary(null);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Dashboard error:', err);
      }
      
      // Don't set error here, let the parent handle it
      setSummary(null); // Clear summary on error
      throw err; // Re-throw so parent can handle
    }
  }, []);

  const checkTodayStatus = useCallback(async () => {
    try {
      const status = await apiService.getTodayStatus();
      setTodaySubmitted(status.data.submitted);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Status check error:', err);
      }
    }
  }, []);

  const fetchHealthWellnessData = useCallback(async (forceRefresh = false) => {
    try {
      // Use optimized unified endpoint (single request instead of 10 separate calls)
      const days = getDaysForRange(timeRange);
      const response = await apiService.getHealthWellnessAll(days, forceRefresh);
      const data = response?.data || {};

      // Set sleep data (always set, even if empty)
      setSleepQualityTrend(data.sleep?.quality_trend || {});
      setSleepDuration(data.sleep?.duration_distribution || null);
      setBedtimePattern(data.sleep?.bedtime_pattern || null);
      setSleepScore(data.sleep?.score || null);

      // Set nutrition data (always set, even if empty)
      setNutritionRatio(data.nutrition?.ratio || null);
      setMealFrequency(data.nutrition?.meal_frequency || {});
      setNutritionScore(data.nutrition?.score || null);

      // Set exercise data (always set, even if empty)
      setExerciseFrequency(data.exercise?.frequency || {});
      setExerciseDistribution(data.exercise?.distribution || null);

      // Set hydration data (always set, even if empty)
      setHydrationConsistency(data.hydration?.consistency || null);
      setHydrationFrequency(data.hydration?.frequency || {});
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching health & wellness data:', err);
      }
      // Set defaults on error (empty data, not null, so chart can still render)
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
      setHydrationFrequency({});
    }
  }, [timeRange]);

  // Fetch user info to get registration date
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userResponse = await apiService.getUserInfo();
        if (userResponse.data?.registration_date) {
          if (process.env.NODE_ENV === 'development') {
            console.log('📅 Setting registration date:', userResponse.data.registration_date);
          }
          setRegistrationDate(userResponse.data.registration_date);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not fetch registration date:', err);
        }
      }
    };
    
    if (currentUser) {
      fetchUserInfo();
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Fetch all data in parallel with timeout protection
        const fetchPromises = [
          fetchDashboardSummary().catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error fetching dashboard summary:', err);
            }
            return null;
          }),
          checkTodayStatus().catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error checking today status:', err);
            }
            return null;
          }),
          fetchHealthWellnessData(true).catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error fetching health wellness data:', err);
            }
            return null;
          })
        ];
        
        await Promise.all(fetchPromises);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading dashboard data:', err);
        }
        setError('Failed to load dashboard data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [timeRange]); // Only depend on timeRange, functions are stable

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

  // Calculate exercise frequency (days per week)
  const calculateExerciseFrequency = useCallback(() => {
    if (!exerciseFrequency || typeof exerciseFrequency !== 'object' || Array.isArray(exerciseFrequency)) {
      return 0;
    }
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let daysWithExercise = 0;
    const checkedDates = new Set();
    
    Object.keys(exerciseFrequency).forEach(dateStr => {
      try {
        // Parse date string (YYYY-MM-DD format)
        const dateParts = dateStr.split('-');
        if (dateParts.length === 3) {
          const date = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
          if (!isNaN(date.getTime()) && date >= weekAgo && !checkedDates.has(dateStr)) {
            checkedDates.add(dateStr);
            const dayData = exerciseFrequency[dateStr];
            if (dayData && typeof dayData === 'object' && dayData.exercised === true) {
              daysWithExercise++;
            }
          }
        }
      } catch (e) {
        // Skip invalid dates
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid date in exercise frequency:', dateStr, e);
        }
      }
    });
    
    return daysWithExercise;
  }, [exerciseFrequency]);

  // Get sleep quality text from latest data
  const getSleepQuality = useCallback(() => {
    if (!sleepQualityTrend || typeof sleepQualityTrend !== 'object' || Array.isArray(sleepQualityTrend)) {
      return 'N/A';
    }
    
    const dates = Object.keys(sleepQualityTrend).filter(dateStr => {
      // Validate date format (YYYY-MM-DD)
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    }).sort((a, b) => {
      // Sort by date descending (newest first)
      return b.localeCompare(a);
    });
    
    if (dates.length === 0) {
      return 'N/A';
    }
    
    const latestDate = dates[0];
    const latestData = sleepQualityTrend[latestDate];
    
    if (!latestData || typeof latestData !== 'object' || latestData.score === undefined || latestData.score === null) {
      return 'N/A';
    }
    
    const latestScore = parseFloat(latestData.score) || 0;
    
    // Map score to quality text (scores: Excellent=5, Good=4, Average=3, Poor=2, Very Poor=1)
    if (latestScore >= 4.5) return 'Excellent';
    if (latestScore >= 3.5) return 'Good';
    if (latestScore >= 2.5) return 'Average';
    if (latestScore >= 1.5) return 'Poor';
    return 'Very Poor';
  }, [sleepQualityTrend]);

  // Normalize metrics to 0-100 scale for chart
  const prepareUnifiedChartData = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at midnight
    
    // Get days based on time range
    const requestedDays = getDaysForRange(timeRange);
    
    // Determine start date: registration date or requested days ago, whichever is more recent
    let startDate;
    let days;
    
    if (registrationDate) {
      const regDate = new Date(registrationDate);
      regDate.setHours(0, 0, 0, 0);
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - (requestedDays - 1)); // requestedDays including today
      
      // Calculate days since registration
      const daysSinceRegistration = Math.ceil((today - regDate) / (1000 * 60 * 60 * 24)) + 1;
      
      if (regDate > daysAgo) {
        // User registered recently (within requested days)
        // Start from registration date and show full requested days (even if future dates)
        startDate = regDate;
        days = requestedDays; // Always show full requested days from registration
      } else {
        // User registered longer ago, show requested days ending today
        startDate = daysAgo;
        days = requestedDays;
      }
    } else {
      // Fallback: requested days ago if no registration date
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (requestedDays - 1));
      days = requestedDays;
    }
    
    const labels = [];
    const dateLabels = []; // Store YYYY-MM-DD format for aggregation
    const sleepData = [];
    const exerciseData = [];
    const foodData = [];
    const waterData = [];
    
    // Generate date labels from start date for the requested number of days
    // This will include future dates if user registered recently
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(formattedDate);
      dateLabels.push(dateStr);
      
      // Check if this date is in the future (no data available yet)
      const isFutureDate = date > today;
      
      // For future dates, push null (no data) and continue
      if (isFutureDate) {
        sleepData.push(null);
        exerciseData.push(null);
        foodData.push(null);
        waterData.push(null);
        continue;
      }
      
      // Sleep: Get score from sleepQualityTrend (already 1-5 scale, convert to 0-100)
      if (sleepQualityTrend && typeof sleepQualityTrend === 'object' && !Array.isArray(sleepQualityTrend) && sleepQualityTrend[dateStr]) {
        const dayData = sleepQualityTrend[dateStr];
        if (dayData && typeof dayData === 'object' && dayData.score !== undefined && dayData.score !== null) {
          const score = parseFloat(dayData.score) || 0;
          sleepData.push((score / 5) * 100); // Convert 1-5 to 0-100
        } else {
          sleepData.push(null);
        }
      } else {
        sleepData.push(null);
      }
      
      // Exercise: Check if exercised that day (100 if yes, null if no data)
      if (exerciseFrequency && typeof exerciseFrequency === 'object' && !Array.isArray(exerciseFrequency) && exerciseFrequency[dateStr]) {
        const dayData = exerciseFrequency[dateStr];
        if (dayData && typeof dayData === 'object' && dayData.exercised === true) {
          exerciseData.push(100);
        } else {
          exerciseData.push(null); // Use null for no exercise (not 0)
        }
      } else {
        exerciseData.push(null);
      }
      
      // Food: Calculate daily nutrition score from meal_frequency
      // For now, we'll estimate based on meals eaten (3 meals = 100, 2 = 67, 1 = 33)
      // In a real implementation, we'd need per-day healthy/easy meal breakdown
      if (mealFrequency && typeof mealFrequency === 'object' && !Array.isArray(mealFrequency) && mealFrequency[dateStr]) {
        const dayMeals = mealFrequency[dateStr];
        if (dayMeals && typeof dayMeals === 'object') {
          const mealsEaten = (dayMeals.breakfast || 0) + (dayMeals.lunch || 0) + (dayMeals.dinner || 0);
          if (mealsEaten > 0) {
            // Estimate score based on meals eaten (simple heuristic)
            // If we have overall nutrition score, use it as baseline, otherwise estimate
            if (nutritionScore && typeof nutritionScore === 'object' && nutritionScore.score !== undefined) {
              const baseScore = parseFloat(nutritionScore.score) || 0;
              // Scale based on meals: if 3 meals, use full score; if fewer, scale down
              const mealRatio = mealsEaten / 3;
              foodData.push(Math.round(baseScore * mealRatio));
            } else if (nutritionRatio && typeof nutritionRatio === 'object' && nutritionRatio.healthy_percentage !== undefined) {
              const baseScore = parseFloat(nutritionRatio.healthy_percentage) || 0;
              const mealRatio = mealsEaten / 3;
              foodData.push(Math.round(baseScore * mealRatio));
            } else {
              // Default: estimate based on meals (3 meals = 100, 2 = 67, 1 = 33)
              foodData.push(Math.round((mealsEaten / 3) * 100));
            }
          } else {
            foodData.push(null);
          }
        } else {
          foodData.push(null);
        }
      } else {
        foodData.push(null);
      }
      
      // Water: Calculate daily hydration score from hydration_frequency (per-day data)
      if (hydrationFrequency && typeof hydrationFrequency === 'object' && !Array.isArray(hydrationFrequency) && hydrationFrequency[dateStr]) {
        const dayData = hydrationFrequency[dateStr];
        if (dayData && typeof dayData === 'object' && dayData.score !== undefined) {
          waterData.push(parseFloat(dayData.score) || 0);
        } else {
          waterData.push(null);
        }
      } else {
        waterData.push(null);
      }
    }
    
    // Apply aggregation if needed
    let finalLabels = labels;
    let finalSleepData = sleepData;
    let finalExerciseData = exerciseData;
    let finalFoodData = foodData;
    let finalWaterData = waterData;
    
    if (timeRange === '3M') {
      // Aggregate to weekly averages
      const sleepAgg = aggregateByWeek(dateLabels, sleepData);
      const exerciseAgg = aggregateByWeek(dateLabels, exerciseData);
      const foodAgg = aggregateByWeek(dateLabels, foodData);
      const waterAgg = aggregateByWeek(dateLabels, waterData);
      
      // Use the longest labels array (they should all be the same length)
      finalLabels = sleepAgg.labels;
      finalSleepData = sleepAgg.values;
      finalExerciseData = exerciseAgg.values;
      finalFoodData = foodAgg.values;
      finalWaterData = waterAgg.values;
    } else if (timeRange === '1Y') {
      // Aggregate to monthly averages
      const sleepAgg = aggregateByMonth(dateLabels, sleepData);
      const exerciseAgg = aggregateByMonth(dateLabels, exerciseData);
      const foodAgg = aggregateByMonth(dateLabels, foodData);
      const waterAgg = aggregateByMonth(dateLabels, waterData);
      
      // Use the longest labels array (they should all be the same length)
      finalLabels = sleepAgg.labels;
      finalSleepData = sleepAgg.values;
      finalExerciseData = exerciseAgg.values;
      finalFoodData = foodAgg.values;
      finalWaterData = waterAgg.values;
    }
    
    return {
      labels: finalLabels,
      sleep: finalSleepData,
      exercise: finalExerciseData,
      food: finalFoodData,
      water: finalWaterData,
      timeRange, // Include time range for chart formatting
    };
  }, [sleepQualityTrend, exerciseFrequency, mealFrequency, nutritionRatio, nutritionScore, hydrationFrequency, registrationDate, timeRange]);

  // Calculate card values
  const exerciseDaysPerWeek = calculateExerciseFrequency();
  const sleepQualityText = getSleepQuality();
  const unifiedChartData = prepareUnifiedChartData();

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
    hydrationFrequency,
    
    // Calculated values for cards
    sleepQualityText,
    exerciseDaysPerWeek,
    unifiedChartData,
    
    // Actions
    refetch,
  };
};

export default useDashboardData;

