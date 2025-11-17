import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { useAuth } from '../stores/auth';

// Create axios instance with base URL and common headers
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const auth = useAuth();
    const user = auth.users;
    
    if (user?.id && config.headers) {
      // Add any necessary auth headers here if needed
      // For now, we're not adding any specific auth headers
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // If you implement token refresh in the future, handle it here
        // For now, just redirect to login
        const auth = useAuth();
        await auth.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        const auth = useAuth();
        await auth.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { api };
