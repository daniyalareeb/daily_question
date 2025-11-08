/**
 * ChartCard Component
 * Wrapper component for charts with consistent styling
 */
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const ChartCard = ({ title, children, height, sx = {} }) => {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ 
        p: { xs: 1, sm: 1.5 }, // Reduced from 1.5/2
        pr: { xs: 1, sm: 1.25 }, // Less padding on right
        '&:last-child': { pb: { xs: 1, sm: 1.5 } } 
      }}>
        {title && (
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 1.5 }}>
            {title}
          </Typography>
        )}
        <Box sx={{ height: height || 300, mt: -1 }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartCard;


