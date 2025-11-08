/**
 * StatCard Component
 * Reusable stat card component for displaying metrics
 */
import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress } from '@mui/material';
import { calculateProgressPercentage } from '../../utils/dashboardUtils';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  progressLabel,
  color = 'primary',
  variant = 'default',
  children,
  iconSize,
  iconColor,
}) => {
  const progressValue = progress ? calculateProgressPercentage(progress.current, progress.total) : null;

  return (
    <Card 
      sx={{ 
        height: '100%',
        ...(variant === 'highlighted' && {
          bgcolor: color === 'warning' ? 'grey.50' : `${color}.50`,
          border: '2px solid',
          borderColor: color === 'warning' ? 'success.main' : `${color}.main`,
        }),
        ...(variant === 'default' && color === 'default' && {
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }),
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {Icon && (
            <Icon 
              sx={{ 
                mr: 1, 
                color: iconColor || (color === 'default' ? 'text.secondary' : `${color}.main`),
                fontSize: iconSize || 24,
              }} 
            />
          )}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
        
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            color: variant === 'default' && color === 'default' ? 'text.secondary' : 'text.primary',
          }}
        >
          {value}
        </Typography>
        
        {subtitle && (
          <Typography color="text.secondary" sx={{ mb: progressValue ? 2 : 0 }}>
            {subtitle}
          </Typography>
        )}
        
        {progressValue !== null && (
          <>
            <LinearProgress 
              variant="determinate" 
              value={progressValue} 
              sx={{ height: 10, borderRadius: 2 }}
              color={color}
            />
            {progressLabel && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {progressLabel}
              </Typography>
            )}
          </>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
};

export default StatCard;

