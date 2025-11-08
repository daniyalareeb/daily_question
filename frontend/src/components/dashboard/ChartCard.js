/**
 * ChartCard Component
 * Wrapper component for charts with consistent styling
 */
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const ChartCard = ({ title, children, height, sx = {} }) => {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent>
        {title && (
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        )}
        <Box sx={{ height: height || 300 }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartCard;


