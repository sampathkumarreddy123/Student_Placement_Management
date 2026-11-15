import axios from 'axios';

// Normalizes API base URL to ensure clean communication in both local and deployed environments
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if found in localStorage as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.message;

    if (!message) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        message =
          'Cannot connect to the backend server. Please ensure the backend is running on port 5000 (cd backend; npm.cmd run dev).';
      } else {
        message =
          error.message ||
          'An unexpected error occurred. Please check your connection.';
      }
    }

    const customError = {
      status: error.response?.status || 500,
      message,
      errors: error.response?.data?.errors || null,
      reasons: error.response?.data?.reasons || null,
    };
    return Promise.reject(customError);
  }
);

export default api;
