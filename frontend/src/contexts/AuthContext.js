/**
 * Authentication Context Provider
 * 
 * This React Context provides authentication state and functions to the entire app.
 * It uses backend API endpoints for authentication instead of Firebase SDK directly.
 * All Firebase operations are handled securely on the backend.
 * 
 * Key Features:
 * - User sign-up: Uses backend /api/auth/register endpoint
 * - User sign-in: Uses backend /api/auth/login endpoint
 * - User sign-out: Removes JWT token from localStorage
 * - Current user state: Tracks authenticated user from JWT token
 * - JWT token management: Stores JWT tokens in localStorage
 * - Token verification: Verifies token with backend on app load
 * 
 * Critical Token Management:
 * - Stores JWT token in localStorage key 'jwtToken'
 * - Token is used by apiService to authenticate all backend API calls
 * - Token is stored after successful login/register
 * - Token is removed when user logs out
 * 
 * Authentication Flow:
 * 1. User signs in/signs up via backend API
 * 2. Backend handles Firebase authentication server-side
 * 3. Backend returns JWT token
 * 4. Frontend stores JWT token in localStorage
 * 5. apiService.interceptor automatically adds token to API requests
 * 6. Backend verifies JWT token for protected endpoints
 * 
 * State Management:
 * - currentUser: User object with uid and email or null
 * - loading: Shows loading spinner while checking auth state
 * - Prevents rendering children until auth state is determined
 * 
 * Used by:
 * - All pages: Access currentUser to check if logged in
 * - Login.js, Register.js: Use login, signup, logout functions
 * - ProtectedRoute.js: Redirects if not authenticated
 * - Dashboard, Questions, Profile: All require authentication
 * - apiService: Uses token for authenticated API calls
 * 
 * Security:
 * - No Firebase credentials are stored in the frontend
 * - All Firebase operations happen server-side
 * - JWT tokens are used for authentication
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  /**
   * Custom hook to access authentication context
   * 
   * Returns:
   * { currentUser, login, signup, logout }
   * 
   * Usage in components:
   * const { currentUser, login, logout } = useAuth();
   */
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  /**
   * Authentication Provider Component
   * 
   * Wraps the entire app to provide auth state to all components.
   * Manages authentication lifecycle using backend API.
   */
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token and get user info on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.verifyToken();
        if (response.data.valid && response.data.user) {
          setCurrentUser(response.data.user);
        } else {
          localStorage.removeItem('jwtToken');
        }
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('jwtToken');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('jwtToken');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Sign up function
  async function signup(email, password) {
    try {
      const response = await apiService.register(email, password);
      const { access_token, user } = response.data;
      
      // Store JWT token
      localStorage.setItem('jwtToken', access_token);
      setCurrentUser(user);
      
      return { user, token: access_token };
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
      localStorage.setItem('jwtToken', access_token);
      setCurrentUser(user);
      
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

  const value = {
    currentUser,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}