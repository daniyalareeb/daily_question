// Dashboard component for displaying daily questions analytics
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ProfileSection from '../components/dashboard/ProfileSection';
import HealthMetricCard from '../components/dashboard/HealthMetricCard';
import UnifiedHealthChart from '../components/dashboard/UnifiedHealthChart';
import EmptyState from '../components/dashboard/EmptyState';
import useDashboardData from '../hooks/useDashboardData';
import { LOADING_MESSAGES } from '../config/dashboardConfig';

function Dashboard() {
  const [timeRange, setTimeRange] = useState('7D');
  const {
    summary,
    loading,
    error,
    todaySubmitted,
    daily_progress,
    positivity_score,
    total_reflections,
    last_submission,
    sleepQualityText,
    exerciseDaysPerWeek,
    nutritionScore,
    hydrationConsistency,
    unifiedChartData,
    sleepDuration,
    sleepQualityTrend,
  } = useDashboardData(timeRange);

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {LOADING_MESSAGES.dashboard}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Always show dashboard, even with no data
  // Components will handle empty/zero data gracefully

  // Calculate sleep hours from sleep duration data
  const calculateSleepHours = () => {
    if (!sleepDuration || !sleepDuration.distribution) {
      return 'N/A';
    }
    
    // Get the most common sleep duration
    const distribution = sleepDuration.distribution;
    if (typeof distribution !== 'object' || Object.keys(distribution).length === 0) {
      return 'N/A';
    }
    
    // Find the most frequent duration
    let maxCount = 0;
    let mostCommonDuration = null;
    Object.entries(distribution).forEach(([duration, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonDuration = duration;
      }
    });
    
    // Extract hours from duration string (e.g., "7-8 hours" -> "7.5" or "8 hours" -> "8")
    if (mostCommonDuration) {
      const hoursMatch = mostCommonDuration.match(/(\d+)/);
      if (hoursMatch) {
        return `${hoursMatch[1]} hours`;
      }
    }
    
    return 'N/A';
  };

  // Calculate card values with proper validation
  const sleepValue = calculateSleepHours();
  const exerciseValue = exerciseDaysPerWeek > 0 ? `${exerciseDaysPerWeek} days/week` : '0 days/week';
  
  let foodValue = 'N/A';
  let foodScore = 0;
  if (nutritionScore && typeof nutritionScore === 'object' && nutritionScore.score !== undefined) {
    foodScore = parseFloat(nutritionScore.score);
    if (!isNaN(foodScore)) {
      foodValue = `${Math.round(foodScore)}/100`;
    }
  }
  
  let waterValue = 'N/A';
  let waterPercent = 0;
  if (hydrationConsistency && typeof hydrationConsistency === 'object') {
    waterPercent = parseFloat(hydrationConsistency.consistency_score) || 
                  parseFloat(hydrationConsistency.adequate_percentage) || 0;
    if (!isNaN(waterPercent)) {
      waterValue = `${Math.round(waterPercent)}%`;
    }
  }

  // Get sleep chart data for mini chart
  const getSleepChartData = () => {
    if (!unifiedChartData || !unifiedChartData.sleep) {
      return [];
    }
    return unifiedChartData.sleep.filter(val => val !== null && val !== undefined);
  };

  // Determine status/action text for cards
  const getSleepStatus = () => {
    if (sleepQualityText === 'Excellent' || sleepQualityText === 'Good') return 'Normal';
    if (sleepQualityText === 'Average') return 'Check Now';
    return 'Check Now';
  };

  const getExerciseStatus = () => {
    if (exerciseDaysPerWeek >= 5) return 'Normal';
    if (exerciseDaysPerWeek >= 3) return 'Check Now';
    return 'Check Now';
  };

  const getFoodStatus = () => {
    const score = nutritionScore?.score || 0;
    if (score >= 70) return 'Normal';
    return 'Check Now';
  };

  const getWaterStatus = () => {
    const score = hydrationConsistency?.consistency_score || hydrationConsistency?.adequate_percentage || 0;
    if (score >= 70) return 'Normal';
    return 'Check Now';
  };

  return (
    <Box>
      {/* Dashboard Header */}
      <DashboardHeader />

      <Container 
        maxWidth="xl" 
        sx={{ 
          mb: { xs: 3, sm: 4 },
          px: { xs: 1.5, sm: 2, md: 3, lg: 4 },
          mt: { xs: 2, sm: 3 },
        }}
      >
        {/* Stats Section */}
        <ProfileSection
          totalReflections={total_reflections}
          currentStreak={daily_progress.current_streak}
          positivityScore={positivity_score.overall_score}
          totalDays={daily_progress.total_days}
        />

        {/* Health Metric Cards - 2x2 Grid */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Grid item xs={12} sm={6}>
            <HealthMetricCard
              type="sleep"
              value={sleepValue}
              status={getSleepStatus()}
              actionText={getSleepStatus()}
              chartData={getSleepChartData()}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <HealthMetricCard
              type="exercise"
              value={exerciseValue}
              status={getExerciseStatus()}
              actionText={getExerciseStatus()}
              progressValue={(exerciseDaysPerWeek / 7) * 100}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <HealthMetricCard
              type="food"
              value={foodValue}
              status={getFoodStatus()}
              actionText={getFoodStatus()}
              progressValue={foodScore}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <HealthMetricCard
              type="water"
              value={waterValue}
              status={getWaterStatus()}
              actionText={getWaterStatus()}
              progressValue={waterPercent}
            />
          </Grid>
        </Grid>

        {/* Unified Health Chart */}
        <UnifiedHealthChart 
          chartData={unifiedChartData} 
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </Container>
    </Box>
  );
}

export default Dashboard;
