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
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 3,
              borderRadius: 3,
              bgcolor: 'white',
              border: '1px solid #E8E8E8',
              boxShadow: '0 2px 8px rgba(54, 94, 99, 0.08)',
              textAlign: 'center',
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(54, 94, 99, 0.12)',
              },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: stat.icon === QuestionAnswer ? '8px' : '50%',
                bgcolor: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: `0 2px 8px ${stat.color}40`,
              }}
            >
              <stat.icon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#365E63', mb: 0.5 }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', fontWeight: 500 }}>
              {stat.label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

export default ProfileSection;



