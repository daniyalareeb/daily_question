/**
 * Authentication Context Provider using Backend API
 * 
 * This React Context provides authentication state and functions to the entire app.
 * It uses the backend API which handles Supabase Auth server-side.
 * 
 * Key Features:
 * - User sign-up: Uses backend /api/auth/register endpoint
 * - User sign-in: Uses backend /api/auth/login endpoint
 * - User sign-out: Removes token from localStorage
 * - Current user state: Tracks authenticated user from JWT token
 * - Token management: Stores JWT tokens in localStorage
 * - Token verification: Verifies token with backend on app load
 */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationRef = useRef(false);

  // Verify token and get user info on mount (only once)
  useEffect(() => {
    // Prevent multiple verifications
    if (verificationRef.current || isVerifying) {
      return;
    }

    const verifyAuth = async () => {
      setIsVerifying(true);
      verificationRef.current = true;
      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const response = await apiService.verifyToken();
          if (response.data.valid && response.data.user) {
            setCurrentUser(response.data.user);
            setLoading(false);
            setIsVerifying(false);
            return; // Success, exit
          } else {
            setCurrentUser(null);
            setLoading(false);
            setIsVerifying(false);
            return;
          }
        } catch (error) {
          lastError = error;
          
          // Only retry on network errors, not auth errors
          const isAuthError = error.response?.status === 401 && 
                            error.response?.data && 
                            !error.code === 'ERR_NETWORK' && 
                            !error.code === 'ECONNABORTED';
          
          if (isAuthError) {
            // Actual auth error, don't retry
            setCurrentUser(null);
            setLoading(false);
            setIsVerifying(false);
            return;
          }
          
          // Network error - retry
          retries--;
          if (retries > 0) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
      }
      
      // All retries failed
      setLoading(false);
      setIsVerifying(false);
      
      // Only clear user if it was an auth error
      if (lastError?.response?.status === 401 && lastError?.response?.data) {
        setCurrentUser(null);
      }
    };

    verifyAuth();

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      setCurrentUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  // Sign up function
  async function signup(email, password) {
    try {
      const response = await apiService.register(email, password);
      const { access_token, user } = response.data;
      
      // Store JWT token
      if (access_token) {
        localStorage.setItem('jwtToken', access_token);
        setCurrentUser(user);
      }
      
      return { user, token: access_token, needsVerification: !access_token };
    } catch (error) {
      throw error;
    }
  }

  // Sign in function
  async function login(email, password) {
    try {
      const response = await apiService.login(email, password);
      const { access_token, user } = response.data;
      
      // Store JWT token
      if (access_token) {
        localStorage.setItem('jwtToken', access_token);
        setCurrentUser(user);
      }
      
      return { user, token: access_token };
    } catch (error) {
      throw error;
    }
  }

  // Sign out function
  async function logout() {
    try {
      localStorage.removeItem('jwtToken');
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  }

  // Password reset function
  async function resetPassword(email, redirectUrl = null) {
    try {
      await apiService.forgotPassword(email, redirectUrl);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Update password function (for reset password page)
  async function updatePassword(newPassword) {
    try {
      await apiService.resetPassword(newPassword);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}