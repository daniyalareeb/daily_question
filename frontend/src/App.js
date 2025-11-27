import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionsProvider } from './contexts/QuestionsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Questions from './pages/Questions';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import './App.css';

// Create Material-UI theme with teal/grey palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#365E63', // Dark teal - buttons, selected states
      light: '#6B8E91', // Medium teal - labels, secondary
      dark: '#3C666C', // Deep teal - button hover
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8CD1BC', // Soft mint green - success states, accents
      light: '#CFE0E0', // Light teal - input backgrounds
      dark: '#7BC4D6', // Cyan-blue gradient end
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F2F9F9', // Pale cyan-white - page backgrounds
      paper: '#FFFFFF', // White for cards
    },
    text: {
      primary: '#666666', // Dark grey - headings
      secondary: '#999999', // Medium grey - body text
      disabled: '#AAAAAA', // Light grey - secondary text
    },
    success: {
      main: '#8CD1BC', // Soft mint green
      light: '#8BDCB6', // Gradient start
    },
    grey: {
      50: '#F2F9F9',
      100: '#CFE0E0',
      200: '#AAAAAA',
      300: '#999999',
      400: '#6B8E91',
      500: '#666666',
      600: '#365E63',
      700: '#3C666C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      color: '#666666',
    },
    h2: {
      fontWeight: 600,
      color: '#666666',
    },
    h3: {
      fontWeight: 600,
      color: '#666666',
    },
    h4: {
      fontWeight: 600,
      color: '#666666',
    },
    h5: {
      fontWeight: 600,
      color: '#666666',
    },
    h6: {
      fontWeight: 600,
      color: '#666666',
    },
    body1: {
      color: '#999999',
    },
    body2: {
      color: '#999999',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#365E63',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#3C666C',
          },
        },
        outlined: {
          borderColor: '#365E63',
          color: '#365E63',
          '&:hover': {
            borderColor: '#3C666C',
            backgroundColor: '#F2F9F9',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#CFE0E0',
            '& fieldset': {
              borderColor: '#6B8E91',
            },
            '&:hover fieldset': {
              borderColor: '#365E63',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#365E63',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(54, 94, 99, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <QuestionsProvider>
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route 
                  path="/questions" 
                  element={
                    <ProtectedRoute>
                      <Questions />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/questions" replace />} />
              </Routes>
            </div>
          </Router>
        </QuestionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
