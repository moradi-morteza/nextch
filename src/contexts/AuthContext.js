'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUser, isAuthenticated, logout, saveToken, saveUser } from '@/utils/auth';
import { authAPI } from '@/utils/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const token = getToken();
    const savedUser = getUser();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getUser();
      const userData = response.data.user;
      saveUser(userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  };

  const login = async (userData, token) => {
    saveToken(token);
    
    // If userData is provided (from OTP verification), use it temporarily
    if (userData) {
      saveUser(userData);
      setUser(userData);
    }
    
    // Then fetch complete user data from server
    try {
      await fetchUserData();
    } catch (error) {
      // If fetching fails, keep the basic user data
      console.warn('Failed to fetch complete user data, using basic data');
    }
  };

  const logoutUser = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Server logout failed, proceeding with client logout');
    }
    logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    login,
    logout: logoutUser,
    fetchUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};