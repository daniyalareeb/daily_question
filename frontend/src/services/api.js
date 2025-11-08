// API service for communicating with the backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
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
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('jwtToken');
      // Dispatch custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Questions
  getQuestions: (randomize = false) => 
    api.get(`/api/questions/?randomize=${randomize}`),
  
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
  
  getTrendLine: (keyword, questionId = null) => {
    const params = new URLSearchParams();
    if (questionId) params.append('question_id', questionId);
    return api.get(`/api/dashboard/trend-line/${keyword}?${params.toString()}`);
  },
  
  getDashboardSummary: () => 
    api.get('/api/dashboard/summary'),
  
  getWeeklySentiment: () => 
    api.get('/api/dashboard/weekly-sentiment'),
  
  getInsights: (keyword = null, questionId = null) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (questionId) params.append('question_id', questionId);
    return api.get(`/api/dashboard/insights?${params.toString()}`);
  },

  // Auth
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (email, password) =>
    api.post('/api/auth/register', { email, password }),
  
  verifyToken: () => 
    api.get('/api/auth/verify'),
  
  getUserInfo: () => 
    api.get('/api/auth/user'),
  
  forgotPassword: (email, continueUrl = null) =>
    api.post('/api/auth/forgot-password', { email, continueUrl }),
  
  resetPassword: (oobCode, newPassword) =>
    api.post('/api/auth/reset-password', { oobCode, newPassword }),

  // Health
  healthCheck: () => 
    api.get('/'),
  
  apiHealth: () => 
    api.get('/api/health'),
};

export default api;

