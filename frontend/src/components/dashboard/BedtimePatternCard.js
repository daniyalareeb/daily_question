/**
 * BedtimePatternCard Component
 * Bar chart for bedtime pattern frequency
 */
import React from 'react';
import '../../utils/chartSetup';
import { Bar } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CHART_HEIGHTS, BAR_CHART_OPTIONS } from '../../config/dashboardConfig';
import EmptyState from './EmptyState';

const BedtimePatternCard = ({ bedtimePattern, title = 'Bedtime Pattern' }) => {
  if (!bedtimePattern || !bedtimePattern.frequency || Object.keys(bedtimePattern.frequency).length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No bedtime data available." />
        </CardContent>
      </Card>
    );
  }

  // Order bedtimes chronologically
  const bedtimeOrder = ['9pm', '10pm', '11pm', 'Midnight', 'After Midnight'];
  const labels = bedtimeOrder.filter(bt => bedtimePattern.frequency[bt] !== undefined);
  const data = labels.map(label => bedtimePattern.frequency[label]);

  const chartData = {
    labels,
    datasets: [{
      label: 'Frequency',
      data,
      backgroundColor: '#365E63',
      borderColor: '#3C666C',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    ...BAR_CHART_OPTIONS,
    plugins: {
      ...BAR_CHART_OPTIONS.plugins,
      legend: {
        display: false,
      },
    },
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ height: CHART_HEIGHTS.bar }}>
          <Bar 
            key={`bedtime-${data.join('-')}`}
            data={chartData} 
            options={chartOptions} 
          />
        </Box>
        {bedtimePattern.total_responses > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Total responses: {bedtimePattern.total_responses}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default BedtimePatternCard;

