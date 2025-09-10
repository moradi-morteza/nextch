import axios from 'axios';
import { getToken, removeToken } from './auth';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://nextch_backend.test/api', // Laravel backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  requestOtp: (phoneNumber) => {
    return api.post('/request_otp', { query: phoneNumber });
  },
  
  verifyOtp: (phoneNumber, otp) => {
    return api.post('/verify_otp', { query: phoneNumber, otp });
  },

  getUser: () => {
    return api.get('/user');
  },

  logout: () => {
    return api.post('/logout');
  },
};

export default api;