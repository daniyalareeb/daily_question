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
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false - don't block app

  // Verify token and get user info on mount (non-blocking)
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      // Check if there's a token first
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        // No token, user is not logged in
        if (isMounted) {
          setCurrentUser(null);
          setLoading(false);
        }
        return;
      }

      // Set loading only if we have a token (user might be logged in)
      if (isMounted) {
        setLoading(true);
      }

      try {
        // Verify token (with longer timeout for slow connections)
        const verifyResponse = await apiService.verifyToken();
        
        if (!isMounted) return;

        if (verifyResponse && verifyResponse.data && verifyResponse.data.valid && verifyResponse.data.user) {
          // Fetch full user info including full_name (non-blocking)
          apiService.getUserInfo()
            .then(userResponse => {
              if (isMounted && userResponse && userResponse.data) {
                setCurrentUser(userResponse.data);
              }
            })
            .catch(() => {
              // Fallback to verify response if getUserInfo fails
              if (isMounted && verifyResponse.data.user) {
                setCurrentUser(verifyResponse.data.user);
              }
            })
            .finally(() => {
              if (isMounted) {
                setLoading(false);
              }
            });
        } else {
          // Invalid token
          if (isMounted) {
            localStorage.removeItem('jwtToken');
            setCurrentUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        // Token invalid, expired, or network error
        if (isMounted) {
          localStorage.removeItem('jwtToken');
          setCurrentUser(null);
          setLoading(false);
        }
      }
    };

    // Verify auth in background, don't block app
    verifyAuth();

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      setCurrentUser(null);
      setLoading(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    
    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  // Sign up function
  async function signup(email, password, fullName) {
    try {
      const response = await apiService.register(email, password, fullName);
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

  // Sign in function - optimized for speed
  async function login(email, password) {
    try {
      const response = await apiService.login(email, password);
      const { access_token, user } = response.data;
      
      // Store JWT token immediately
      if (access_token) {
        localStorage.setItem('jwtToken', access_token);
        // Set user immediately (full_name will be fetched later)
        setCurrentUser(user);
      }
      
      // Fetch full_name in background (non-blocking)
      if (user && user.uid) {
        apiService.getUserInfo()
          .then(userResponse => {
            if (userResponse && userResponse.data) {
              setCurrentUser(userResponse.data);
            }
          })
          .catch(() => {
            // Silently fail - user is already logged in
          });
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
      {children}
    </AuthContext.Provider>
  );
}
