import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DashboardHeader() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    // Open change password dialog - will be handled by a modal component
    // For now, navigate to a change password page or show modal
    navigate('/change-password');
  };

  // Get user initial from full_name or email
  const getInitial = () => {
    if (currentUser?.full_name) {
      return currentUser.full_name.charAt(0).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return currentUser?.full_name || currentUser?.email || 'User';
  };

  return (
    <Box
      sx={{
        bgcolor: '#365E63', // Dark teal green
        color: 'white',
        py: 3,
        px: { xs: 2, sm: 4, md: 5 },
        mb: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Left side: Avatar and user info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: '#8CD1BC', // Mint green
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#365E63',
          }}
        >
          {getInitial()}
        </Avatar>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              mb: 0.5,
            }}
          >
            {getDisplayName()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {currentUser?.email || ''}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              | Daily Reflection Tracker
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right side: Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handleChangePassword}
          sx={{
            bgcolor: 'white',
            color: '#365E63',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            },
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Change Password
        </Button>
        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{
            bgcolor: '#8CD1BC', // Mint green
            color: '#365E63',
            '&:hover': {
              bgcolor: '#7BC4D6',
            },
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardHeader;

