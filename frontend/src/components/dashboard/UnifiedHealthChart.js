import React, { useRef, useMemo } from 'react';
import { Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

const CHART_COLORS = {
  sleep: '#4CAF50', // Green
  exercise: '#F44336', // Red
  food: '#FF9800', // Orange
  water: '#03A9F4', // Light blue
};

// Helper function to convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Chart.js plugin to create gradients after chart is laid out
const gradientFillPlugin = {
  id: 'gradientFill',
  beforeDatasetsDraw: (chart) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const colorArray = [CHART_COLORS.sleep, CHART_COLORS.exercise, CHART_COLORS.food, CHART_COLORS.water];
    
    chart.data.datasets.forEach((dataset, index) => {
      if (dataset.fill && chart.chartArea) {
        const color = colorArray[index];
        
        // Create gradient from top to bottom
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, hexToRgba(color, 0.5));
        gradient.addColorStop(0.2, hexToRgba(color, 0.35));
        gradient.addColorStop(0.5, hexToRgba(color, 0.25));
        gradient.addColorStop(0.8, hexToRgba(color, 0.15));
        gradient.addColorStop(1, hexToRgba(color, 0.05));
        
        // Apply gradient to dataset
        dataset.backgroundColor = gradient;
      }
    });
  }
};

function UnifiedHealthChart({ chartData, timeRange = '7D', onTimeRangeChange }) {
  const chartRef = useRef(null);

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null && onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  // Ensure all data arrays are valid and have the same length as labels
  const labels = useMemo(() => {
    if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData) || !chartData.labels) {
      return [];
    }
    return Array.isArray(chartData.labels) ? chartData.labels : [];
  }, [chartData]);

  const sleepData = useMemo(() => {
    if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData)) return [];
    return Array.isArray(chartData.sleep) ? chartData.sleep : [];
  }, [chartData]);

  const exerciseData = useMemo(() => {
    if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData)) return [];
    return Array.isArray(chartData.exercise) ? chartData.exercise : [];
  }, [chartData]);

  const foodData = useMemo(() => {
    if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData)) return [];
    return Array.isArray(chartData.food) ? chartData.food : [];
  }, [chartData]);

  const waterData = useMemo(() => {
    if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData)) return [];
    return Array.isArray(chartData.water) ? chartData.water : [];
  }, [chartData]);
  
  // Pad arrays to match labels length if needed
  const padArray = (arr, length) => {
    const padded = [...arr];
    while (padded.length < length) {
      padded.push(null);
    }
    return padded.slice(0, length);
  };
  
  // Create datasets
  const datasets = useMemo(() => {
    return [
      {
        label: 'Sleep',
        data: padArray(sleepData, labels.length),
        borderColor: CHART_COLORS.sleep,
        backgroundColor: hexToRgba(CHART_COLORS.sleep, 0.3), // Fallback, will be replaced by plugin
        borderWidth: 3,
        fill: true,
        tension: 0.6, // Smoother curves
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_COLORS.sleep,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        cubicInterpolationMode: 'monotone',
        spanGaps: true, // Connect across null values to reduce gaps
      },
      {
        label: 'Exercise',
        data: padArray(exerciseData, labels.length),
        borderColor: CHART_COLORS.exercise,
        backgroundColor: hexToRgba(CHART_COLORS.exercise, 0.3), // Fallback
        borderWidth: 3,
        fill: true,
        tension: 0.6,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_COLORS.exercise,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        cubicInterpolationMode: 'monotone',
        spanGaps: true, // Connect across null values to reduce gaps
      },
      {
        label: 'Food',
        data: padArray(foodData, labels.length),
        borderColor: CHART_COLORS.food,
        backgroundColor: hexToRgba(CHART_COLORS.food, 0.3), // Fallback
        borderWidth: 3,
        fill: true,
        tension: 0.6,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_COLORS.food,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        cubicInterpolationMode: 'monotone',
        spanGaps: true, // Connect across null values to reduce gaps
      },
      {
        label: 'Water',
        data: padArray(waterData, labels.length),
        borderColor: CHART_COLORS.water,
        backgroundColor: hexToRgba(CHART_COLORS.water, 0.3), // Fallback
        borderWidth: 3,
        fill: true,
        tension: 0.6,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_COLORS.water,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        cubicInterpolationMode: 'monotone',
        spanGaps: true, // Connect across null values to reduce gaps
      },
    ];
  }, [sleepData, exerciseData, foodData, waterData, labels.length]);
  
  const data = useMemo(() => ({
    labels: labels,
    datasets: datasets,
  }), [labels, datasets]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animation for better gradient rendering
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: '600',
            family: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
          color: '#333',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (value === null || value === undefined) return `${context.dataset.label}: No data`;
            return `${context.dataset.label}: ${Math.round(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 110, // Add padding so 100 isn't cut off
        suggestedMax: 110,
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value;
          },
          font: {
            size: 12,
            weight: '500',
          },
          color: '#666',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#666',
          maxTicksLimit: timeRange === '7D' ? 7 : 
                         timeRange === '30D' ? 10 :
                         timeRange === '3M' ? 12 :
                         timeRange === '1Y' ? 12 : 24,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3,
      },
    },
  }), [timeRange]);

  // Validate chart data after all hooks
  if (!chartData || 
      typeof chartData !== 'object' || 
      Array.isArray(chartData) ||
      !chartData.labels || 
      !Array.isArray(chartData.labels) ||
      chartData.labels.length === 0) {
    return (
      <Card sx={{ boxShadow: 2, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#365E63' }}>
            Statistics
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No data available yet. Start tracking your health metrics!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 3, bgcolor: 'white' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#365E63' }}>
            Statistics
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            aria-label="time range filter"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#666',
                borderColor: '#E0E0E0',
                '&.Mui-selected': {
                  bgcolor: '#365E63',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#3C666C',
                  },
                },
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              },
            }}
          >
            <ToggleButton value="7D" aria-label="7 days">
              7D
            </ToggleButton>
            <ToggleButton value="30D" aria-label="30 days">
              30D
            </ToggleButton>
            <ToggleButton value="3M" aria-label="3 months">
              3M
            </ToggleButton>
            <ToggleButton value="1Y" aria-label="1 year">
              1Y
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 400 }}>
          <Line 
            ref={chartRef}
            data={data} 
            options={options}
            plugins={[gradientFillPlugin]}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default UnifiedHealthChart;
