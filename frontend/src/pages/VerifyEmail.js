import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { Email, CheckCircle } from '@mui/icons-material';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 6, 
            width: '100%',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #F2F9F9 0%, #FFFFFF 100%)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(54, 94, 99, 0.3)',
              }}
            >
              <Email sx={{ fontSize: 50, color: 'white' }} />
            </Box>
          </Box>

          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#365E63' }}>
            Check Your Email
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, color: '#666666', lineHeight: 1.8 }}>
            We've sent a verification link to <strong>{email}</strong>
          </Typography>

          <Box
            sx={{
              bgcolor: '#E8F4F5',
              borderRadius: 2,
              p: 3,
              mb: 4,
              border: '1px solid #CFE0E0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <CheckCircle sx={{ color: 'primary.main', mr: 1, mt: 0.5 }} />
              <Typography variant="body2" sx={{ color: '#365E63', textAlign: 'left' }}>
                Click the verification link in the email to activate your account
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <CheckCircle sx={{ color: 'primary.main', mr: 1, mt: 0.5 }} />
              <Typography variant="body2" sx={{ color: '#365E63', textAlign: 'left' }}>
                Check your spam folder if you don't see the email
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              py: 1.5,
              mb: 2,
              bgcolor: '#365E63',
              '&:hover': {
                bgcolor: '#3C666C',
              },
            }}
          >
            Open App
          </Button>

          <Typography variant="body2" sx={{ color: '#999999', mt: 2 }}>
            Already verified?{' '}
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{
                color: '#365E63',
                textTransform: 'none',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Sign in here
            </Button>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default VerifyEmail;




