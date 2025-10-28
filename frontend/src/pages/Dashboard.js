/**
 * Dashboard Component - Daily Questions Analytics Dashboard
 * 
 * This component displays comprehensive analytics about user's daily reflections.
 * It shows progress, streaks, positivity scores, and visual charts.
 * 
 * Key Features:
 * - Daily Progress: Days completed this month (progress bar)
 * - Current Streak: Consecutive days with fire emoji indicator
 * - Positivity Score: Overall mood percentage (0-100%) based on sentiment analysis
 * - Weekly Summary: Days completed, weekly positivity, top themes for the week
 * - Top Keywords: Most frequently used words (bar chart visualization)
 * - Sentiment Distribution: Positive/negative/neutral breakdown (doughnut chart)
 * - Total Reflections: Overall count of daily submissions
 * - Done for Today Badge: Shows when user has submitted today
 * 
 * Data Flow:
 * 1. fetchDashboardSummary(): Gets main analytics from /api/dashboard/summary
 * 2. checkTodayStatus(): Checks if user submitted today from /api/responses/today/status
 * 3. fetchUserResponses(): Gets all user responses for detailed data
 * 4. State updates trigger UI re-renders with new data
 * 
 * Dependencies:
 * - apiService (services/api.js): Handles all API calls with Firebase auth tokens
 * - Chart.js + react-chartjs-2: Bar, Doughnut, Line charts for visualization
 * - Material-UI: Card, Grid, LinearProgress, Chip for UI components
 * - @mui/icons-material: LocalFireDepartment, CalendarToday, EmojiEmotions, etc.
 * 
 * API Endpoints Used:
 * - GET /api/dashboard/summary - Main dashboard data (all metrics)
 * - GET /api/responses/today/status - Check if submitted today
 * - GET /api/responses/ - Get all historical responses
 * 
 * User Experience:
 * - Shows loading spinner while fetching data
 * - Displays error message if API call fails
 * - Updates in real-time when user submits new responses
 * - Visual indicators (progress bars, charts, badges) for easy understanding
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  LocalFireDepartment,
  CalendarToday,
  EmojiEmotions,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState([]);
  const [todaySubmitted, setTodaySubmitted] = useState(false);

  useEffect(() => {
    fetchDashboardSummary();
    checkTodayStatus();
    fetchUserResponses();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.getDashboardSummary();
      console.log('Dashboard Summary:', response.data);
      setSummary(response.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayStatus = async () => {
    try {
      const status = await apiService.getTodayStatus();
      setTodaySubmitted(status.data.submitted);
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  const fetchUserResponses = async () => {
    try {
      const response = await apiService.getUserResponses();
      setResponses(response.data);
    } catch (err) {
      console.error('Fetch responses error:', err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Alert severity="info" sx={{ mt: 2 }}>
          Make sure you have logged in and submitted at least one response.
        </Alert>
      </Container>
    );
  }

  // Default values if summary is null
  const { 
    daily_progress = { days_this_month: 0, current_streak: 0, longest_streak: 0, total_days: 0 },
    positivity_score = { overall_score: 0, trend: 'neutral', positive_count: 0, negative_count: 0 },
    weekly_summary = { days_completed: 0, top_themes: [], weekly_trend: 'neutral', positivity_score: 0 },
    top_keywords = { top_10: [], counts: {} },
    total_reflections = 0,
    last_submission = null
  } = summary || {};

  // Chart data for top keywords
  const keywordsChartData = top_keywords.top_10.length > 0 ? {
    labels: top_keywords.top_10.slice(0, 5),
    datasets: [{
      label: 'Usage Count',
      data: top_keywords.top_10.slice(0, 5).map(k => top_keywords.counts[k] || 0),
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(79, 70, 229, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 1
    }]
  } : null;

  // Mood chart data
  const moodData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [
        positivity_score.positive_count || 0,
        positivity_score.negative_count || 0,
        Math.max(0, (positivity_score.positive_count || 0) + (positivity_score.negative_count || 0))
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ]
    }]
  };

  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const progressPercentage = (daily_progress.days_this_month / daysInMonth) * 100;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Your Reflection Dashboard
        </Typography>
        {todaySubmitted && (
          <Chip 
            icon={<CheckCircle />} 
            label="Completed for today!" 
            color="success" 
            variant="outlined"
            sx={{ fontSize: '0.9rem', py: 2.5 }}
          />
        )}
      </Box>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Days This Month */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Days This Month
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {daily_progress.days_this_month}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Completed out of {daysInMonth} days
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ height: 10, borderRadius: 2 }}
                color="primary"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {progressPercentage.toFixed(1)}% of month completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Streak */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            background: daily_progress.current_streak > 0 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : ''
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalFireDepartment sx={{ 
                  mr: 1, 
                  color: daily_progress.current_streak > 0 ? '#fff' : 'text.secondary',
                  fontSize: 28
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold',
                  color: daily_progress.current_streak > 0 ? '#fff' : 'inherit'
                }}>
                  Current Streak
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                color: daily_progress.current_streak > 0 ? '#fff' : 'inherit'
              }}>
                {daily_progress.current_streak} {daily_progress.current_streak > 0 ? '🔥' : ''}
              </Typography>
              <Typography color={daily_progress.current_streak > 0 ? 'rgba(255,255,255,0.8)' : 'text.secondary'}>
                Keep it going!
              </Typography>
              <Typography variant="caption" color={daily_progress.current_streak > 0 ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
                Longest streak: {daily_progress.longest_streak} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Positivity Score */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEmotions sx={{ mr: 1, color: 'secondary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Positivity Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {positivity_score.overall_score}%
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Your overall mood
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={positivity_score.overall_score} 
                color={positivity_score.overall_score >= 70 ? 'success' : positivity_score.overall_score >= 50 ? 'primary' : 'warning'}
                sx={{ height: 10, borderRadius: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Positive: {positivity_score.positive_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Negative: {positivity_score.negative_count || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Weekly Summary */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Weekly Summary
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {weekly_summary.days_completed}
              </Typography>
              <Typography color="text.secondary">
                Days completed this week
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {weekly_summary.positivity_score}%
              </Typography>
              <Typography color="text.secondary">
                Weekly positivity
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Top Themes This Week
              </Typography>
              {weekly_summary.top_themes && weekly_summary.top_themes.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {weekly_summary.top_themes.map((theme, index) => (
                    <Chip 
                      key={index} 
                      label={theme} 
                      color="primary" 
                      variant="outlined" 
                      size="medium"
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">Start reflecting to see your themes!</Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Charts Row */}
      {top_keywords.top_10.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Top Keywords
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={keywordsChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Sentiment Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut 
                    data={moodData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Top Keywords */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Your Most Used Words
          </Typography>
          {top_keywords.top_10 && top_keywords.top_10.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {top_keywords.top_10.map((keyword, index) => (
                <Chip
                  key={index}
                  label={`${keyword} (${top_keywords.counts[keyword] || 0})`}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                  sx={{ fontSize: '1rem', py: 1.5, px: 0.5 }}
                />
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              No keywords yet. Start reflecting to see your most used words!
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Total Reflections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Total Reflections
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {total_reflections}
              </Typography>
              <Typography color="text.secondary">
                Total entries you've made
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Total Days
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {daily_progress.total_days}
              </Typography>
              <Typography color="text.secondary">
                Days with reflections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Last Submission
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {last_submission ? new Date(last_submission).toLocaleDateString() : 'Never'}
              </Typography>
              <Typography color="text.secondary">
                Most recent entry date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;