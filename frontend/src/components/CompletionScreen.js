import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Dashboard, CheckCircle } from '@mui/icons-material';

function CompletionScreen() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '60vh'
        }}
      >
        <Box 
          sx={{ 
            mb: 4, 
            width: 200, 
            height: 200, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(140, 209, 188, 0.2) 0%, rgba(123, 196, 214, 0.2) 100%)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 0.5
                },
                '50%': {
                  transform: 'scale(1.1)',
                  opacity: 0.8
                }
              }
            }}
          />
          <CheckCircle 
            sx={{ 
              fontSize: 200, 
              color: '#8CD1BC', // Soft mint green
              position: 'relative',
              zIndex: 1,
              animation: 'scaleIn 0.6s ease-out',
              '@keyframes scaleIn': {
                '0%': { 
                  transform: 'scale(0) rotate(-180deg)', 
                  opacity: 0 
                },
                '50%': { 
                  transform: 'scale(1.2) rotate(0deg)',
                },
                '100%': { 
                  transform: 'scale(1) rotate(0deg)', 
                  opacity: 1 
                }
              }
            }} 
          />
        </Box>
        
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            color: '#666666' // Dark grey
          }}
        >
          Awesome!
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 4, 
            maxWidth: 400,
            color: '#999999' // Medium grey
          }}
        >
          You are ready to proceed
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<Dashboard />}
          onClick={() => navigate('/dashboard')}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            backgroundColor: '#8CD1BC', // Soft mint green
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#7BC4D6', // Cyan-blue
            }
          }}
        >
          Let's get started
        </Button>
      </Box>
    </Container>
  );
}

export default CompletionScreen;
