// Dashboard component for displaying daily questions analytics
import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  LocalFireDepartment,
  CalendarToday,
  EmojiEmotions,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../utils/chartSetup'; // Initialize Chart.js registration
import StatCard from '../components/dashboard/StatCard';
import MetricCard from '../components/dashboard/MetricCard';
import LineChartCard from '../components/dashboard/LineChartCard';
import WordCloudCard from '../components/dashboard/WordCloudCard';
import EmptyState from '../components/dashboard/EmptyState';
import useDashboardData from '../hooks/useDashboardData';
import {
  calculateProgressPercentage,
  getDaysInCurrentMonth,
  formatDateNumeric,
  prepareKeywordsChartData,
} from '../utils/dashboardUtils';
import {
  SPACING,
  CHART_HEIGHTS,
  KEYWORD_CHART_COLORS,
  KEYWORD_CHART_BORDER_COLORS,
  THEME_CARD_COLORS,
  EMPTY_STATE_MESSAGES,
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  DOUGHNUT_CHART_OPTIONS,
  SENTIMENT_COLORS,
} from '../config/dashboardConfig';

function Dashboard() {
  const {
    loading,
    error,
    todaySubmitted,
    daily_progress,
    positivity_score,
    weekly_summary,
    top_keywords,
    daily_sentiment,
    total_reflections,
    last_submission,
  } = useDashboardData();

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: SPACING.container.mt, mb: SPACING.container.mb }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {LOADING_MESSAGES.dashboard}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: SPACING.container.mt, mb: SPACING.container.mb }}>
        <Alert severity="error">{error}</Alert>
        <Alert severity="info" sx={{ mt: 2 }}>
          {ERROR_MESSAGES.loginRequired}
        </Alert>
      </Container>
    );
  }

  // Calculations
  const daysInMonth = getDaysInCurrentMonth();
  const progressPercentage = calculateProgressPercentage(daily_progress.days_this_month, daysInMonth);
  const keywordsChartData = prepareKeywordsChartData(top_keywords, 5);

  // Add colors to keywords chart data if it exists
  if (keywordsChartData) {
    keywordsChartData.datasets[0].backgroundColor = KEYWORD_CHART_COLORS;
    keywordsChartData.datasets[0].borderColor = KEYWORD_CHART_BORDER_COLORS;
    keywordsChartData.datasets[0].borderWidth = 1;
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        mt: { xs: 1, sm: 1.5 }, 
        mb: { xs: 2, sm: SPACING.container.mb },
        px: { xs: 1, sm: 1.5 }, // Reduced from 1.5/2
        pr: { xs: 1, sm: 1 }, // Even less on right side
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Compact Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Your Reflection Dashboard
        </Typography>
        {todaySubmitted && (
          <Chip 
            icon={<CheckCircle />} 
            label="Completed for today!" 
            color="success" 
            size="small"
            sx={{ fontSize: '0.85rem' }}
          />
        )}
      </Box>

      {/* Hero Banner Section - 3 Key Metrics */}
      <Box 
        sx={{ 
          mb: SPACING.hero.mb,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
          boxShadow: 2,
        }}
      >
        <Grid container spacing={SPACING.grid.spacing}>
          {/* Days This Month */}
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Days This Month"
              value={daily_progress.days_this_month}
              subtitle={`Completed out of ${daysInMonth} days`}
              icon={CalendarToday}
              progress={{
                current: daily_progress.days_this_month,
                total: daysInMonth,
              }}
              progressLabel={`${progressPercentage.toFixed(1)}% of month completed`}
              color="primary"
            />
          </Grid>

          {/* Current Streak */}
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Current Streak"
              value={`${daily_progress.current_streak} ${daily_progress.current_streak > 0 ? '🔥' : ''}`}
              subtitle="Keep it going!"
              icon={LocalFireDepartment}
              color={daily_progress.current_streak > 0 ? 'warning' : 'default'}
              variant={daily_progress.current_streak > 0 ? 'highlighted' : 'default'}
              iconSize={32}
              iconColor={daily_progress.current_streak > 0 ? 'warning.main' : 'text.secondary'}
            >
              <Typography variant="caption" color="text.secondary">
                Longest streak: {daily_progress.longest_streak} days
              </Typography>
            </StatCard>
          </Grid>

          {/* Positivity Score */}
          <Grid item xs={12} sm={4}>
            <MetricCard
              title="Positivity Score"
              value={positivity_score.overall_score}
              subtitle="Your overall mood"
              icon={EmojiEmotions}
              progressValue={positivity_score.overall_score}
              positiveCount={positivity_score.positive_count}
              negativeCount={positivity_score.negative_count}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Weekly Summary - Compact */}
      <Card sx={{ mb: SPACING.section.mb }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, pr: { xs: 1, sm: 1.25 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Weekly Summary
              </Typography>
            </Box>
            {weekly_summary.positivity_score > 0 && (
              <Chip
                label={`${weekly_summary.positivity_score}% Positive`}
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={3}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {weekly_summary.days_completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Days this week
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {weekly_summary.positivity_score}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weekly positivity
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Top Themes This Week */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              Top Themes This Week
            </Typography>
            {weekly_summary.top_themes && weekly_summary.top_themes.length > 0 ? (
              <Grid container spacing={1.5}>
                {weekly_summary.top_themes.map((theme, index) => {
                  const color = THEME_CARD_COLORS[index % THEME_CARD_COLORS.length];
                  return (
                    <Grid item xs={6} sm={4} md={2.4} key={index}>
                      <Card 
                        sx={{ 
                          bgcolor: color.bg,
                          color: 'white',
                          textAlign: 'center',
                          p: 1.5,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: color.hover,
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {theme}
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {EMPTY_STATE_MESSAGES.noThemes}
              </Typography>
            )}
          </Box>
          
          {/* Daily Sentiment Line Chart */}
          <LineChartCard 
            dailySentiment={daily_sentiment} 
            title="Daily Sentiment Trends"
          />
        </CardContent>
      </Card>

      {/* Charts - Side by Side in Single Container */}
      {top_keywords?.top_10 && Array.isArray(top_keywords.top_10) && top_keywords.top_10.length > 0 && (
        <Card sx={{ mb: SPACING.section.mb }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Grid container spacing={2}>
              {/* Top Keywords - Left Side */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Top Keywords
                </Typography>
                <Box sx={{ height: CHART_HEIGHTS.keywords }}>
                  {keywordsChartData ? (
                    <Bar 
                      key={`keywords-chart-${top_keywords.top_10.slice(0, 5).join('-')}`}
                      data={keywordsChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                          padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  ) : (
                    <EmptyState message={EMPTY_STATE_MESSAGES.noData} />
                  )}
                </Box>
              </Grid>

              {/* Sentiment Distribution - Right Side */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Sentiment Distribution
                </Typography>
                <Box sx={{ height: CHART_HEIGHTS.doughnut }}>
                  <Doughnut 
                    key={`doughnut-${positivity_score.positive_count}-${positivity_score.negative_count}-${positivity_score.overall_score}`}
                    data={{
                      labels: ['Positive', 'Negative', 'Neutral'],
                      datasets: [{
                        data: [
                          positivity_score.positive_count || 0,
                          positivity_score.negative_count || 0,
                          Math.max(0, 100 - (positivity_score.positive_count || 0) - (positivity_score.negative_count || 0))
                        ],
                        backgroundColor: [
                          SENTIMENT_COLORS.positive,
                          SENTIMENT_COLORS.negative,
                          SENTIMENT_COLORS.neutral,
                        ],
                      }],
                    }}
                    options={DOUGHNUT_CHART_OPTIONS}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Word Cloud */}
      <WordCloudCard topKeywords={top_keywords} />

      {/* Footer Stats - Compact */}
      <Box sx={{ 
        bgcolor: 'grey.100', 
        borderRadius: 2, 
        p: { xs: 2, sm: 2.5 }, 
        mb: SPACING.section.mb,
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: { xs: 1.5, sm: 2 },
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total Reflections
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {total_reflections}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total Days
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {daily_progress.total_days}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Last Submission
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {formatDateNumeric(last_submission)}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default Dashboard;
