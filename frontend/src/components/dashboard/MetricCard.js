/**
 * MetricCard Component
 * Enhanced metric card with additional features like trend indicators
 */
import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress } from '@mui/material';
import { getPositivityColor } from '../../utils/dashboardUtils';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  progressValue,
  positiveCount,
  negativeCount,
  color,
  trend,
}) => {
  // Determine color based on value if not provided
  const cardColor = color || getPositivityColor(value);
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: value >= 70 ? 'success.50' : 
                 value >= 50 ? 'primary.50' : 'warning.50',
        border: '2px solid',
        borderColor: value >= 70 ? 'success.main' : 
                     value >= 50 ? 'primary.main' : 'warning.main',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {Icon && (
            <Icon 
              sx={{ 
                mr: 1, 
                fontSize: 32,
                color: value >= 70 ? 'success.main' : 
                        value >= 50 ? 'primary.main' : 'warning.main',
              }} 
            />
          )}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
          {value}%
        </Typography>
        
        {subtitle && (
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.95rem' }}>
            {subtitle}
          </Typography>
        )}
        
        {progressValue !== undefined && (
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            color={cardColor}
            sx={{ height: 12, borderRadius: 2, mb: 2 }}
          />
        )}
        
        {(positiveCount !== undefined || negativeCount !== undefined) && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}>
            {positiveCount !== undefined && (
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {positiveCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Positive
                </Typography>
              </Box>
            )}
            {negativeCount !== undefined && (
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {negativeCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Negative
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;


