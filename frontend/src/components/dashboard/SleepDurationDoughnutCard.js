/**
 * SleepDurationDoughnutCard Component
 * Doughnut chart for sleep duration distribution
 */
import React from 'react';
import '../../utils/chartSetup';
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CHART_HEIGHTS, DOUGHNUT_CHART_OPTIONS } from '../../config/dashboardConfig';
import EmptyState from './EmptyState';

const SleepDurationDoughnutCard = ({ sleepDuration, title = 'Sleep Duration Distribution' }) => {
  if (!sleepDuration || !sleepDuration.distribution || Object.keys(sleepDuration.distribution).length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No sleep duration data available." />
        </CardContent>
      </Card>
    );
  }

  // Map sleep duration options to labels
  const durationLabels = {
    'Less than 3 hours': 'Less than 3h',
    '3-4 hours': '3-4h',
    '5-6 hours': '5-6h',
    '7-8 hours': '7-8h',
    '8+ hours': '8+h',
  };

  const labels = Object.keys(sleepDuration.distribution).map(key => durationLabels[key] || key);
  const data = Object.values(sleepDuration.distribution);
  const colors = ['#365E63', '#8CD1BC', '#6B8E91', '#CFE0E0', '#7BC4D6'];

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors.slice(0, labels.length),
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ height: CHART_HEIGHTS.doughnut }}>
          <Doughnut 
            key={`sleep-duration-${data.join('-')}`}
            data={chartData} 
            options={DOUGHNUT_CHART_OPTIONS} 
          />
        </Box>
        {sleepDuration.total_responses > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Total responses: {sleepDuration.total_responses}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SleepDurationDoughnutCard;

