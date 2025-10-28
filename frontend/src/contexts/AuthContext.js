/**
 * Authentication Context Provider
 * 
 * This React Context provides authentication state and functions to the entire app.
 * It wraps the Firebase authentication functionality and makes it available to all components.
 * 
 * Key Features:
 * - User sign-up: createUserWithEmailAndPassword()
 * - User sign-in: signInWithEmailAndPassword()
 * - User sign-out: signOut()
 * - Current user state: Tracks authenticated user or null
 * - Firebase token management: Gets and stores ID tokens for API calls
 * - Auto token refresh: Automatically updates tokens when they expire
 * 
 * Critical Token Management:
 * - Stores Firebase ID token in localStorage key 'firebaseToken'
 * - Token is used by apiService to authenticate all backend API calls
 * - Token is refreshed automatically when user logs in or when token expires
 * - Token is removed when user logs out
 * 
 * Authentication Flow:
 * 1. User signs in/signs up via Firebase
 * 2. onAuthStateChanged callback fires when auth state changes
 * 3. If user exists, get ID token and store in localStorage
 * 4. apiService.interceptor automatically adds token to API requests
 * 5. Backend verifies token via Firebase Admin SDK
 * 
 * State Management:
 * - currentUser: Firebase user object or null
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
 * Dependencies:
 * - firebase.js: Provides the auth instance
 * - firebase/auth: Provides Firebase auth functions
 * - localStorage: Stores authentication tokens
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  /**
   * Custom hook to access authentication context
   * 
   * Returns:
   * { currentUser, login, signup, logout, getIdToken }
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
   * Manages Firebase authentication lifecycle.
   */
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  async function signup(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Sign in function
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Sign out function
  async function logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('firebaseToken');
    } catch (error) {
      throw error;
    }
  }

  // Get Firebase ID token
  async function getIdToken() {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return token;
      } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
      }
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Get and store the ID token
          const token = await user.getIdToken();
          localStorage.setItem('firebaseToken', token);
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        localStorage.removeItem('firebaseToken');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
