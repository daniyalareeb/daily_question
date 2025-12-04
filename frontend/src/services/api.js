// API service for communicating with the backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 20000, // 20 second timeout - increased for complex queries
});

// Add auth token to requests from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized) - token invalid or expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors - don't logout on timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        console.error('Request timeout - Backend may not be running:', error);
        console.error('Make sure backend is running on:', API_BASE_URL);
      }
      // Create a more user-friendly error
      error.userMessage = 'Connection timeout. Please check if the server is running.';
      return Promise.reject(error);
    }
    
    // Log CORS errors specifically - don't logout on network errors
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        console.error('CORS Error detected:', error);
        console.error('This might be due to:');
        console.error('1. Backend server not running');
        console.error('2. Browser cache issue - try hard refresh (Ctrl+Shift+R)');
        console.error('3. Invalid authentication token');
      }
      error.userMessage = 'Network error. Please check your connection.';
      return Promise.reject(error);
    }
    
    // Only logout on actual 401 auth errors, not network errors
    if (error.response?.status === 401) {
      // Check if this is a network-related 401 (no response body) vs actual auth failure
      const isNetworkError = !error.response.data || 
                           error.code === 'ERR_NETWORK' || 
                           error.code === 'ECONNABORTED';
      
      if (!isNetworkError) {
        // Actual authentication error - token is invalid or expired
        localStorage.removeItem('jwtToken');
        // Dispatch custom event to notify AuthContext
        window.dispatchEvent(new CustomEvent('auth:logout'));
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      } else {
        // Network error causing 401 - don't logout, just reject
        error.userMessage = 'Network error. Please check your connection.';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Questions
  getQuestions: () => 
    api.get('/api/questions/'),
  
  getQuestionById: (id) => 
    api.get(`/api/questions/${id}`),

  // Responses
  submitResponse: (responseData) => 
    api.post('/api/responses/', responseData),
  
  getUserResponses: (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/api/responses/?${params.toString()}`);
  },
  
  getTodayStatus: () => 
    api.get('/api/responses/today/status'),
  
  getResponseById: (id) => 
    api.get(`/api/responses/${id}`),

  // Dashboard
  getDashboardAnalytics: (timeFilter = 'recent') => 
    api.get(`/api/dashboard/analytics?time_filter=${timeFilter}`),
  
  getFrequencyChart: (questionId = null, timeFilter = 'recent') => {
    const params = new URLSearchParams();
    if (questionId) params.append('question_id', questionId);
    params.append('time_filter', timeFilter);
    return api.get(`/api/dashboard/frequency-chart?${params.toString()}`);
  },
  
  getTrendLine: (optionText, questionId = null) => {
    const params = new URLSearchParams();
    if (questionId) params.append('question_id', questionId);
    return api.get(`/api/dashboard/trend-line/${encodeURIComponent(optionText)}?${params.toString()}`);
  },
  
  getDashboardSummary: (forceRefresh = false) =>
    api.get('/api/dashboard/summary', { params: { force_refresh: forceRefresh } }),
  
  getWeeklyMood: () => 
    api.get('/api/dashboard/weekly-mood'),
  
  getQuestionAnalytics: (questionId) => 
    api.get(`/api/dashboard/question-analytics/${questionId}`),
  
  getSubQuestionAnalytics: (questionId, subQuestionId) => 
    api.get(`/api/dashboard/sub-question-analytics/${questionId}/${subQuestionId}`),

  // Health & Wellness Analytics
  getSleepQualityTrend: (days = 30) => 
    api.get(`/api/dashboard/sleep/quality-trend?days=${days}`),
  
  getSleepDurationDistribution: () => 
    api.get('/api/dashboard/sleep/duration-distribution'),
  
  getBedtimePattern: () => 
    api.get('/api/dashboard/sleep/bedtime-pattern'),
  
  getSleepScore: () => 
    api.get('/api/dashboard/sleep/score'),
  
  getNutritionRatio: () => 
    api.get('/api/dashboard/nutrition/ratio'),
  
  getMealFrequency: (days = 30) => 
    api.get(`/api/dashboard/nutrition/meal-frequency?days=${days}`),
  
  getNutritionScore: () => 
    api.get('/api/dashboard/nutrition/score'),
  
  getExerciseFrequency: (days = 30) => 
    api.get(`/api/dashboard/exercise/frequency?days=${days}`),
  
  getExerciseDistribution: () => 
    api.get('/api/dashboard/exercise/distribution'),
  
  getHydrationConsistency: (days = 30) => 
    api.get(`/api/dashboard/hydration/consistency?days=${days}`),

  // Optimized unified health & wellness endpoint (fetches all data in one request)
  getHealthWellnessAll: (days = 30, forceRefresh = false) => 
    api.get(`/api/dashboard/health-wellness?days=${days}&force_refresh=${forceRefresh}`),

  // Auth
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (email, password, fullName) =>
    api.post('/api/auth/register', { email, password, full_name: fullName }),
  
  verifyToken: () => 
    api.get('/api/auth/verify'),
  
  getUserInfo: () => 
    api.get('/api/auth/user'),
  
  forgotPassword: (email, redirectUrl = null) =>
    api.post('/api/auth/forgot-password', { email, redirect_url: redirectUrl }),
  
  resetPassword: (newPassword, token) =>
    api.post('/api/auth/reset-password', { password: newPassword, token: token }),
  
  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/change-password', { current_password: currentPassword, new_password: newPassword }),

  // Health
  healthCheck: () => 
    api.get('/'),
  
  apiHealth: () => 
    api.get('/api/health'),
};

export default api;

