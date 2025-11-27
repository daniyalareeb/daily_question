import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  useEffect(() => {
    // Check for reset token in URL (from email link)
    // Backend will handle token validation
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      // Store token temporarily for password reset
      sessionStorage.setItem('resetToken', accessToken);
    } else {
      // Check query params as fallback
      const token = searchParams.get('token');
      if (token) {
        sessionStorage.setItem('resetToken', token);
      } else if (!accessToken && !token) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    }
  }, [searchParams]);

  const handleClickShowPassword = () => {
    const input = passwordInputRef.current?.querySelector('input');
    if (input) {
      const cursorPosition = input.selectionStart;
      setShowPassword(!showPassword);
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
        input.focus();
      }, 0);
    } else {
      setShowPassword(!showPassword);
    }
  };

  const handleClickShowConfirmPassword = () => {
    const input = confirmPasswordInputRef.current?.querySelector('input');
    if (input) {
      const cursorPosition = input.selectionStart;
      setShowConfirmPassword(!showConfirmPassword);
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
        input.focus();
      }, 0);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleMouseDownPassword = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setSuccess(false);
      setLoading(true);
      
      // Get reset token from sessionStorage or URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const resetToken = sessionStorage.getItem('resetToken') || 
                        accessToken ||
                        searchParams.get('token');
      
      if (!resetToken) {
        throw new Error('Invalid or expired reset link. Please request a new password reset.');
      }
      
      // Call backend API with token
      await apiService.resetPassword(password, resetToken);
      
      // Clear token
      sessionStorage.removeItem('resetToken');
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Lock sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
              Set New Password
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset successfully! Redirecting to login...
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={success || loading}
              helperText="Password must be at least 6 characters"
              inputRef={passwordInputRef}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      disabled={success || loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={success || loading}
              inputRef={confirmPasswordInputRef}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      disabled={success || loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || success}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            
            <Box textAlign="center">
              <Typography variant="body2">
                <Link to="/login" style={{ textDecoration: 'none', color: '#365E63' }}>
                  Back to Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default ResetPassword;


