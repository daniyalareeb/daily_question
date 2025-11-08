/**
 * BarChartCard Component
 * Bar chart for displaying sentiment scores
 */
import React from 'react';
import '../../utils/chartSetup'; // Ensure Chart.js is registered
import { Bar } from 'react-chartjs-2';
import { Box } from '@mui/material';
import { 
  CHART_HEIGHTS, 
  BAR_CHART_OPTIONS 
} from '../../config/dashboardConfig';
import { 
  isValidDailySentiment, 
  prepareLineChartData, 
  getSentimentBarColors 
} from '../../utils/dashboardUtils';

const BarChartCard = ({ dailySentiment, title = 'Daily Sentiment This Week', height }) => {
  if (!isValidDailySentiment(dailySentiment)) {
    return null;
  }

  const { labels, data } = prepareLineChartData(dailySentiment);
  const colors = getSentimentBarColors(data);

  const chartData = {
    labels,
    datasets: [{
      label: 'Positivity Score',
      data,
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      borderWidth: 2,
    }],
  };

  const chartKey = `bar-chart-${labels.join('-')}`;

  return (
    <Box sx={{ height: height || CHART_HEIGHTS.bar }}>
      <Bar 
        key={chartKey}
        data={chartData} 
        options={BAR_CHART_OPTIONS} 
      />
    </Box>
  );
};

export default BarChartCard;

