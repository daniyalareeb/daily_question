/**
 * SleepQualityTrendCard Component
 * Line chart for displaying sleep quality trend over time
 */
import React from 'react';
import '../../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CHART_HEIGHTS, LINE_CHART_OPTIONS } from '../../config/dashboardConfig';
import EmptyState from './EmptyState';

const SleepQualityTrendCard = ({ sleepQualityTrend, title = 'Sleep Quality Trend', days = 30 }) => {
  if (!sleepQualityTrend || Object.keys(sleepQualityTrend).length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No sleep quality data available. Start tracking your sleep to see trends!" />
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const sortedDates = Object.keys(sleepQualityTrend).sort();
  const labels = sortedDates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const data = sortedDates.map(date => sleepQualityTrend[date].score);

  const chartData = {
    labels,
    datasets: [{
      label: 'Sleep Quality Score',
      data,
      borderColor: '#365E63',
      backgroundColor: 'rgba(54, 94, 99, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#365E63',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    ...LINE_CHART_OPTIONS,
    scales: {
      ...LINE_CHART_OPTIONS.scales,
      y: {
        ...LINE_CHART_OPTIONS.scales.y,
        max: 5,
        min: 1,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            const labels = { 1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent' };
            return labels[value] || value;
          },
        },
      },
    },
    plugins: {
      ...LINE_CHART_OPTIONS.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const score = context.parsed.y;
            const labels = { 1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent' };
            return `Quality: ${labels[score] || score}`;
          },
        },
      },
    },
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ height: CHART_HEIGHTS.line }}>
          <Line 
            key={`sleep-quality-${sortedDates.join('-')}`}
            data={chartData} 
            options={chartOptions} 
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SleepQualityTrendCard;

