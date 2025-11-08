/**
 * LineChartCard Component
 * Dual-line chart for displaying daily sentiment trends (Positive vs Negative keywords)
 */
import React from 'react';
import '../../utils/chartSetup'; // Ensure Chart.js is registered
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import EmptyState from './EmptyState';
import {
  CHART_HEIGHTS,
  SENTIMENT_COLORS
} from '../../config/dashboardConfig';
import { 
  isValidDailySentiment, 
  prepareLineChartData
} from '../../utils/dashboardUtils';

const LineChartCard = ({ dailySentiment, title = 'Daily Sentiment This Week' }) => {
  // Validate input data
  try {
    if (!dailySentiment || typeof dailySentiment !== 'object' || Array.isArray(dailySentiment)) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No sentiment data available for this week. Start reflecting to see your daily sentiment trends!" />
        </Box>
      );
    }

    // Validate data format
    let isValid = false;
    try {
      isValid = isValidDailySentiment(dailySentiment);
    } catch (validationError) {
      isValid = false;
    }

    if (!isValid) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No sentiment data available for this week. Start reflecting to see your daily sentiment trends!" />
        </Box>
      );
    }
  } catch (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <EmptyState message="Error loading sentiment data. Please refresh the page." />
      </Box>
    );
  }

  // Prepare chart data with error handling
  let chartDataResult = { labels: [], data: [], positiveData: [], negativeData: [] };
  try {
    const result = prepareLineChartData(dailySentiment);
    
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      chartDataResult = {
        labels: Array.isArray(result.labels) ? result.labels : [],
        data: Array.isArray(result.data) ? result.data : [],
        positiveData: Array.isArray(result.positiveData) ? result.positiveData : [],
        negativeData: Array.isArray(result.negativeData) ? result.negativeData : [],
      };
    }
  } catch (error) {
    chartDataResult = { labels: [], data: [], positiveData: [], negativeData: [] };
  }
  
  // Safely extract with explicit checks - use 'in' operator to check property existence
  const labels = (chartDataResult && 'labels' in chartDataResult && Array.isArray(chartDataResult.labels)) 
    ? chartDataResult.labels 
    : [];
  const data = (chartDataResult && 'data' in chartDataResult && Array.isArray(chartDataResult.data)) 
    ? chartDataResult.data 
    : [];
  const positiveData = (chartDataResult && 'positiveData' in chartDataResult && Array.isArray(chartDataResult.positiveData)) 
    ? chartDataResult.positiveData 
    : [];
  const negativeData = (chartDataResult && 'negativeData' in chartDataResult && Array.isArray(chartDataResult.negativeData)) 
    ? chartDataResult.negativeData 
    : [];
  
  // Check if we have positive/negative data for dual-line chart
  // Ensure arrays exist and have valid data
  const hasDualData = Array.isArray(positiveData) && 
                      Array.isArray(negativeData) &&
                      positiveData.length > 0 &&
                      negativeData.length > 0 &&
                      positiveData.some(v => v !== null && v !== undefined && v !== 0) && 
                      negativeData.some(v => v !== null && v !== undefined && v !== 0);

  const chartData = {
    labels,
        datasets: hasDualData ? [
      // Positive keywords line
      {
        label: 'Positive Keywords',
        data: positiveData,
        borderColor: SENTIMENT_COLORS.positive,
        backgroundColor: SENTIMENT_COLORS.positive.replace('0.8', '0.1'),
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: SENTIMENT_COLORS.positive,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        spanGaps: false,
      },
      // Negative keywords line
      {
        label: 'Negative Keywords',
        data: negativeData,
        borderColor: SENTIMENT_COLORS.negative,
        backgroundColor: SENTIMENT_COLORS.negative.replace('0.8', '0.1'),
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: SENTIMENT_COLORS.negative,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        spanGaps: false,
      },
    ] : [
      // Fallback to single line (positivity score) if dual data not available
      {
        label: 'Positivity Score',
        data,
        borderColor: SENTIMENT_COLORS.positive,
        backgroundColor: SENTIMENT_COLORS.positive.replace('0.8', '0.1'),
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: (context) => {
          const score = context.parsed.y;
          if (score === null || score === undefined) return 'rgba(156, 163, 175, 1)';
          return score >= 50 ? SENTIMENT_COLORS.positive : SENTIMENT_COLORS.negative;
        },
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        spanGaps: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (value === null || value === undefined) return 'No data';
            const datasetLabel = context.dataset.label;
            if (datasetLabel === 'Positive Keywords' || datasetLabel === 'Negative Keywords') {
              return `${datasetLabel}: ${value} occurrences`;
            }
            const sentiment = value >= 50 ? 'Positive' : 'Negative';
            return `${sentiment}: ${value}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: hasDualData ? undefined : 100, // For dual chart, let it auto-scale based on counts
        ticks: {
          precision: 0,
        },
        title: {
          display: true,
          text: hasDualData ? 'Keyword Count' : 'Positivity Score (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ height: CHART_HEIGHTS.line, mb: 3 }}>
        <Line 
          key={`line-chart-${labels.join('-')}`}
          data={chartData} 
          options={chartOptions} 
        />
      </Box>
    </Box>
  );
};

export default LineChartCard;
