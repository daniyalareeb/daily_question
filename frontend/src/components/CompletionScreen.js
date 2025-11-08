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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
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
              color: '#10b981',
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          You're Done for Today!
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: 400 }}
        >
          Great job completing your daily reflection. See you tomorrow for another day of self-discovery.
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            }
          }}
        >
          View Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default CompletionScreen;
