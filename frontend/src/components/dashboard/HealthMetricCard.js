import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { Bedtime, FitnessCenter, Restaurant, WaterDrop } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

const METRIC_CONFIG = {
  sleep: {
    name: 'Sleep',
    icon: Bedtime,
    bgColor: '#365E63', // Dark teal green
    iconColor: 'white',
    buttonColor: '#8CD1BC', // Mint green
  },
  exercise: {
    name: 'Exercise',
    icon: FitnessCenter,
    bgColor: '#8CD1BC', // Mint green
    iconColor: '#365E63', // Dark teal
    buttonColor: '#8CD1BC', // Mint green
  },
  food: {
    name: 'Food',
    icon: Restaurant,
    bgColor: '#365E63', // Dark teal green
    iconColor: '#FF9800', // Orange
    buttonColor: '#8CD1BC', // Mint green
  },
  water: {
    name: 'Water',
    icon: WaterDrop,
    bgColor: '#F5F5F5', // Light gray
    iconColor: '#03A9F4', // Light blue
    buttonColor: '#365E63', // Dark teal green
  },
};

function HealthMetricCard({ 
  type, 
  value, 
  status, 
  actionText,
  chartData, // For sleep mini chart
  progressValue, // For exercise, food, water progress
}) {
  const config = METRIC_CONFIG[type];
  
  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const isDarkBg = type === 'sleep' || type === 'food';
  const isExercise = type === 'exercise';
  const isWater = type === 'water';
  const textColor = isDarkBg ? 'white' : (isExercise ? '#365E63' : '#333');

  // Prepare mini chart data for Sleep
  const getSleepChartData = () => {
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      return null;
    }
    
    // Get last 7 data points
    const data = chartData.slice(-7);
    const labels = data.map((_, i) => '');
    
    return {
      labels: labels,
      datasets: [{
        label: 'Sleep',
        data: data,
        borderColor: '#8CD1BC',
        backgroundColor: 'rgba(140, 209, 188, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      }],
    };
  };

  const sleepChartData = type === 'sleep' ? getSleepChartData() : null;

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (type === 'exercise') {
      // Exercise: days/week out of 7
      const days = parseInt(value) || 0;
      return (days / 7) * 100;
    } else if (type === 'food') {
      // Food: score out of 100
      const score = parseInt(value) || 0;
      return score;
    } else if (type === 'water') {
      // Water: percentage
      const percent = parseInt(value) || 0;
      return percent;
    }
    return progressValue || 0;
  };

  const progressPercent = getProgressPercentage();

  return (
    <Card
      sx={{
        height: { xs: 240, sm: 260, md: 280 }, // Responsive height
        boxShadow: 3,
        bgcolor: config.bgColor,
        border: isWater ? '1px solid #E0E0E0' : 'none',
        borderRadius: { xs: 2, sm: 3 },
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: { xs: 3, sm: 6 },
        },
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 2.5, md: 3 }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1 
      }}>
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          <Icon
            sx={{
              fontSize: { xs: 32, sm: 36, md: 40 },
              color: config.iconColor,
            }}
          />
        </Box>

        {/* Name */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: { xs: 0.5, sm: 1 },
            color: textColor,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          {config.name}
        </Typography>

        {/* Value */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: { xs: 1.5, sm: 2 },
            color: textColor,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          }}
        >
          {value || 'N/A'}
        </Typography>

        {/* Chart or Progress */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: { xs: 60, sm: 70, md: 80 } 
        }}>
          {type === 'sleep' && sleepChartData && (
            <Box sx={{ width: '100%', height: { xs: 50, sm: 60, md: 70 } }}>
              <Line
                data={sleepChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                  },
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                }}
              />
            </Box>
          )}
          
          {type === 'exercise' && (
            <Box sx={{ width: '100%', px: { xs: 0.5, sm: 1 } }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(progressPercent, 100)}
                sx={{
                  height: { xs: 8, sm: 10 },
                  borderRadius: 5,
                  bgcolor: 'rgba(54, 94, 99, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#365E63',
                    borderRadius: 5,
                  },
                }}
              />
            </Box>
          )}
          
          {(type === 'food' || type === 'water') && (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={Math.min(progressPercent, 100)}
                size={{ xs: 70, sm: 80, md: 90 }}
                thickness={5}
                sx={{
                  color: type === 'food' ? '#8CD1BC' : '#03A9F4',
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    color: textColor,
                    fontWeight: 'bold',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {Math.round(progressPercent)}%
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default HealthMetricCard;
