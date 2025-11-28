/**
 * HydrationGaugeCard Component
 * Radial/Gauge chart for hydration consistency
 */
import React from 'react';
import '../../utils/chartSetup';
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent, LinearProgress } from '@mui/material';
import { CHART_HEIGHTS } from '../../config/dashboardConfig';
import EmptyState from './EmptyState';

const HydrationGaugeCard = ({ hydrationConsistency, title = 'Hydration Consistency' }) => {
  if (!hydrationConsistency || hydrationConsistency.total_days === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No hydration data available. Start tracking your water intake!" />
        </CardContent>
      </Card>
    );
  }

  const percentage = hydrationConsistency.adequate_percentage || 0;
  
  // Create a gauge-like doughnut chart
  const chartData = {
    labels: ['Adequate', 'Low'],
    datasets: [{
      data: [percentage, 100 - percentage],
      backgroundColor: ['#8CD1BC', '#CFE0E0'],
      borderWidth: 0,
      cutout: '75%',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label;
            const value = context.parsed;
            if (label === 'Adequate') {
              return `Adequate hydration: ${value.toFixed(1)}%`;
            }
            return `Low hydration: ${value.toFixed(1)}%`;
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
        <Box sx={{ position: 'relative', height: CHART_HEIGHTS.doughnut, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Doughnut 
            key={`hydration-${percentage}`}
            data={chartData} 
            options={chartOptions} 
          />
          <Box sx={{ position: 'absolute', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#365E63' }}>
              {percentage.toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adequate
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Adequate days: {hydrationConsistency.adequate_days}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Low days: {hydrationConsistency.low_days}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#CFE0E0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: percentage >= 80 ? '#8CD1BC' : percentage >= 60 ? '#6B8E91' : '#FFA726',
              }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Target: 80%+ adequate hydration
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HydrationGaugeCard;


