import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { LocalFireDepartment, QuestionAnswer, EmojiEmotions, CalendarToday } from '@mui/icons-material';

function ProfileSection({ totalReflections, currentStreak, positivityScore, totalDays }) {
  const stats = [
    {
      label: 'Total Reflections',
      value: totalReflections || 0,
      icon: QuestionAnswer,
      color: '#8CD1BC', // Mint green
    },
    {
      label: 'Current Streak',
      value: currentStreak || 0,
      icon: LocalFireDepartment,
      color: '#FF9800', // Orange
    },
    {
      label: 'Positivity Score',
      value: `${positivityScore || 0}/100`,
      icon: EmojiEmotions,
      color: '#8CD1BC', // Light green
    },
    {
      label: 'Total Days',
      value: totalDays || 0,
      icon: CalendarToday,
      color: '#666666', // Gray
    },
  ];

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: { xs: 3, sm: 4 } }}>
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: { xs: 2, sm: 3 },
              bgcolor: 'white',
              border: '1px solid #E8E8E8',
              boxShadow: '0 2px 8px rgba(54, 94, 99, 0.08)',
              textAlign: 'center',
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-2px)' },
                boxShadow: { xs: '0 2px 8px rgba(54, 94, 99, 0.08)', sm: '0 4px 12px rgba(54, 94, 99, 0.12)' },
              },
            }}
          >
            <Box
              sx={{
                width: { xs: 44, sm: 48, md: 56 },
                height: { xs: 44, sm: 48, md: 56 },
                borderRadius: stat.icon === QuestionAnswer ? '8px' : '50%',
                bgcolor: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: { xs: 1.5, sm: 2 },
                boxShadow: `0 2px 8px ${stat.color}40`,
              }}
            >
              <stat.icon sx={{ color: 'white', fontSize: { xs: 22, sm: 26, md: 28 } }} />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#365E63', 
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              }}
            >
              {stat.value}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666', 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              {stat.label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

export default ProfileSection;



