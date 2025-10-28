import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import {
  Person,
  Email,
  CalendarToday,
  QuestionAnswer,
  Dashboard,
  Logout,
  Refresh
} from '@mui/icons-material';

function Profile() {
  const { currentUser, logout } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                Member since {formatDate(currentUser?.metadata?.creationTime)}
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
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Last Sign In: {formatDate(currentUser?.metadata?.lastSignInTime)}
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


