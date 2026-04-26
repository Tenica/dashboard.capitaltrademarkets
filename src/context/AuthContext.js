import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount - Recover state atomically
    const syncAuthState = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser._id) {
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            // Corrupted user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error("Auth sync error:", err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    syncAuthState();
  }, []);

  useEffect(() => {
    let inactivityTimer;

    const handleActivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      // 30 minutes in milliseconds
      inactivityTimer = setTimeout(() => {
        if (token) {
          logout();
          window.location.href = '/login'; // Force redirect to login page
        }
      }, 30 * 60 * 1000);
    };

    if (token) {
      handleActivity(); // Initialize the timer

      // Add event listeners for user activity
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
    }

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [token]);

  const login = async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await authAPI.login(normalizedEmail, password);
      
      if (response.data.require2Fa) {
        return { success: true, require2Fa: true, userId: response.data.userId };
      }

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const loginWith2Fa = async (userId, tokenStr) => {
    try {
      const response = await authAPI.verifyLogin2Fa(userId, tokenStr);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
       return {
         success: false,
         error: error.response?.data?.message || 'Invalid Authenticator code'
       };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWith2Fa,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
