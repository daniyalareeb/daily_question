/**
 * ExerciseFrequencyCard Component
 * Line chart for exercise frequency over time
 */
import React from 'react';
import '../../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CHART_HEIGHTS, LINE_CHART_OPTIONS } from '../../config/dashboardConfig';
import EmptyState from './EmptyState';

const ExerciseFrequencyCard = ({ exerciseFrequency, title = 'Exercise Frequency' }) => {
  if (!exerciseFrequency || Object.keys(exerciseFrequency).length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No exercise data available. Start tracking your workouts!" />
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const sortedDates = Object.keys(exerciseFrequency).sort();
  const labels = sortedDates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  // Convert exercise data to binary (1 = exercised, 0 = didn't exercise)
  const data = sortedDates.map(date => exerciseFrequency[date].exercised ? 1 : 0);

  const chartData = {
    labels,
    datasets: [{
      label: 'Exercised',
      data,
      borderColor: '#8CD1BC',
      backgroundColor: 'rgba(140, 209, 188, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: (context) => {
        return context.parsed.y === 1 ? '#8CD1BC' : '#CFE0E0';
      },
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
        max: 1,
        min: 0,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value === 1 ? 'Yes' : 'No';
          },
        },
      },
    },
    plugins: {
      ...LINE_CHART_OPTIONS.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const exercised = context.parsed.y === 1;
            const date = sortedDates[context.dataIndex];
            const duration = exerciseFrequency[date]?.duration;
            if (exercised) {
              return duration ? `Exercised: ${duration}` : 'Exercised';
            }
            return 'No exercise';
          },
        },
      },
    },
  };

  // Calculate exercise stats
  const exerciseDays = data.filter(d => d === 1).length;
  const totalDays = data.length;
  const exercisePercentage = totalDays > 0 ? ((exerciseDays / totalDays) * 100).toFixed(1) : 0;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ height: CHART_HEIGHTS.line }}>
          <Line 
            key={`exercise-${sortedDates.join('-')}`}
            data={chartData} 
            options={chartOptions} 
          />
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Exercise days: {exerciseDays} / {totalDays} ({exercisePercentage}%)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExerciseFrequencyCard;


