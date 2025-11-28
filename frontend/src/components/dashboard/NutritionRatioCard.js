/**
 * NutritionRatioCard Component
 * Doughnut chart for healthy vs easy food ratio
 */
import React from 'react';
import '../../utils/chartSetup';
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { CHART_HEIGHTS, DOUGHNUT_CHART_OPTIONS, SENTIMENT_COLORS } from '../../config/dashboardConfig';
import EmptyState from './EmptyState';

const NutritionRatioCard = ({ nutritionRatio, title = 'Nutrition: Healthy vs Easy Food' }) => {
  if (!nutritionRatio || nutritionRatio.total_meals === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {title}
          </Typography>
          <EmptyState message="No nutrition data available. Start tracking your meals!" />
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: ['Healthy (Fruit & Veg)', 'Easy Food/Snacks'],
    datasets: [{
      data: [nutritionRatio.healthy_count, nutritionRatio.easy_count],
      backgroundColor: [SENTIMENT_COLORS.positive, '#FFA726'],
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
            key={`nutrition-${nutritionRatio.healthy_count}-${nutritionRatio.easy_count}`}
            data={chartData} 
            options={DOUGHNUT_CHART_OPTIONS} 
          />
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Healthy: {nutritionRatio.healthy_percentage.toFixed(1)}% ({nutritionRatio.healthy_count} meals)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Easy/Snacks: {nutritionRatio.easy_percentage.toFixed(1)}% ({nutritionRatio.easy_count} meals)
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: '#365E63' }}>
            Total meals tracked: {nutritionRatio.total_meals}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NutritionRatioCard;


