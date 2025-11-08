/**
 * DoughnutChartCard Component
 * Doughnut chart for sentiment distribution
 */
import React from 'react';
import '../../utils/chartSetup'; // Ensure Chart.js is registered
import { Doughnut } from 'react-chartjs-2';
import ChartCard from './ChartCard';
import { 
  CHART_HEIGHTS, 
  DOUGHNUT_CHART_OPTIONS,
  SENTIMENT_COLORS 
} from '../../config/dashboardConfig';
import { prepareMoodChartData } from '../../utils/dashboardUtils';

const DoughnutChartCard = ({ positivityScore, title = 'Sentiment Distribution', height }) => {
  const chartData = prepareMoodChartData(positivityScore);
  
  // Add colors to the dataset
  chartData.datasets[0].backgroundColor = [
    SENTIMENT_COLORS.positive,
    SENTIMENT_COLORS.negative,
    SENTIMENT_COLORS.neutral,
  ];

  const chartKey = `doughnut-${chartData.datasets[0].data.join('-')}`;

  return (
    <ChartCard title={title} height={height || CHART_HEIGHTS.doughnut}>
      <Doughnut 
        key={chartKey}
        data={chartData} 
        options={DOUGHNUT_CHART_OPTIONS} 
      />
    </ChartCard>
  );
};

export default DoughnutChartCard;

