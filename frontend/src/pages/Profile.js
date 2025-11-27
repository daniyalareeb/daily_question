import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person,
  Email,
  CalendarToday,
  QuestionAnswer,
  Dashboard,
  Logout,
  Refresh,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

function Profile() {
  const { currentUser, logout } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError('');

      const [responsesRes, analyticsRes] = await Promise.all([
        apiService.getUserResponses(),
        apiService.getDashboardSummary()
      ]);

      setUserStats({
        totalResponses: responsesRes.data.length,
        recentResponses: analyticsRes.data.recent?.total_responses || 0,
        lastWeekResponses: analyticsRes.data.last_week?.total_responses || 0,
        lastMonthResponses: analyticsRes.data.last_month?.total_responses || 0,
        responses: responsesRes.data
      });
    } catch (err) {
      setError('Failed to load user statistics');
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    try {
      setPasswordChangeLoading(true);
      await apiService.changePassword(currentPassword, newPassword);
      setPasswordChangeSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordChangeSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordChangeError(err.response?.data?.detail || err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* User Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3
              }}
            >
              {currentUser?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser?.email ? `Member` : ''}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Email: {currentUser?.email}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <QuestionAnswer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {userStats?.totalResponses || 0}
              </Typography>
              <Typography color="text.secondary">
                Total Responses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Dashboard sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {userStats?.recentResponses || 0}
              </Typography>
              <Typography color="text.secondary">
                Recent (14 days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarToday sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {userStats?.lastWeekResponses || 0}
              </Typography>
              <Typography color="text.secondary">
                Last Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {userStats?.lastMonthResponses || 0}
              </Typography>
              <Typography color="text.secondary">
                Last Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Responses */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Recent Responses
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={fetchUserStats}
              size="small"
            >
              Refresh
            </Button>
          </Box>
          
          {userStats?.responses && userStats.responses.length > 0 ? (
            <List>
              {userStats.responses.slice(0, 5).map((response, index) => (
                <ListItem key={response._id} divider={index < 4}>
                  <ListItemIcon>
                    <QuestionAnswer color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={formatDate(response.date)}
                    secondary={`${response.answers?.length || 0} questions answered`}
                  />
                  <Chip
                    label={response.keywords_agg?.length || 0}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No responses yet. Start answering daily questions!
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Change Password
            </Typography>
            <Button
              variant={showPasswordChange ? 'outlined' : 'contained'}
              startIcon={<Lock />}
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setPasswordChangeError('');
                setPasswordChangeSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              size="small"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </Button>
          </Box>

          {showPasswordChange && (
            <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 2 }}>
              {passwordChangeError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordChangeError}
                </Alert>
              )}
              {passwordChangeSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {passwordChangeSuccess}
                </Alert>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordChangeLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordChangeLoading}
                helperText="At least 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmNewPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={passwordChangeLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
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
                disabled={passwordChangeLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {passwordChangeLoading ? <CircularProgress size={24} /> : 'Update Password'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          onClick={handleLogout}
          size="large"
        >
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}

export default Profile;


