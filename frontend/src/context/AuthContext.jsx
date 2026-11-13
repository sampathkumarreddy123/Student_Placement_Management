import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.getCurrentUser();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    setAuthError(null);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  const officerLogin = async (credentials) => {
    setAuthError(null);
    try {
      const data = await authService.officerLogin(credentials);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Officer login failed');
      throw err;
    }
  };

  const studentLogin = async (credentials) => {
    setAuthError(null);
    try {
      const data = await authService.studentLogin(credentials);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Student login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUserProfile = (newProfile) => {
    setUser((prev) => (prev ? { ...prev, profile: newProfile } : null));
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isOfficer: user?.role === 'officer',
    login,
    officerLogin,
    studentLogin,
    register,
    logout,
    checkAuth,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

