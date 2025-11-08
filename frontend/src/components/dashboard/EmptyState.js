/**
 * EmptyState Component
 * Displays empty state messages when no data is available
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { EMPTY_STATE_MESSAGES } from '../../config/dashboardConfig';

const EmptyState = ({ message, variant = 'default' }) => {
  const displayMessage = message || EMPTY_STATE_MESSAGES.noData;
  
  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        py: 4,
        px: 2
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {displayMessage}
      </Typography>
    </Box>
  );
};

export default EmptyState;


