import React from 'react';
import { Box, Typography, Avatar, Button, useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DashboardHeader() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        mb: 0,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap',
        gap: { xs: 2, sm: 2 },
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Left side: Avatar and user info */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1.5, sm: 2 },
        flex: 1,
        minWidth: 0, // Allow text truncation
      }}>
        <Avatar
          sx={{
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            bgcolor: '#8CD1BC', // Mint green
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            fontWeight: 'bold',
            color: '#365E63',
            flexShrink: 0,
          }}
        >
          {getInitial()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}> {/* Allow text truncation */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              mb: 0.5,
              fontSize: { xs: '1.1rem', sm: '1.5rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getDisplayName()}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }, 
            flexWrap: 'wrap',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: '150px', sm: 'none' },
              }}
            >
              {currentUser?.email || ''}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              | Daily Reflection Tracker
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right side: Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 2 }, 
        flexWrap: 'wrap',
        width: { xs: '100%', sm: 'auto' },
        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
      }}>
        <Button
          variant="contained"
          onClick={handleChangePassword}
          size={isMobile ? 'small' : 'medium'}
          sx={{
            bgcolor: 'white',
            color: '#365E63',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            },
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.75, sm: 1 },
            minWidth: { xs: 'auto', sm: '140px' },
          }}
        >
          Change Password
        </Button>
        <Button
          variant="contained"
          onClick={handleLogout}
          size={isMobile ? 'small' : 'medium'}
          sx={{
            bgcolor: '#8CD1BC', // Mint green
            color: '#365E63',
            '&:hover': {
              bgcolor: '#7BC4D6',
            },
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.75, sm: 1 },
            minWidth: { xs: 'auto', sm: '100px' },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardHeader;

