import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const sessionStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('hrms_session='))
          ?.split('=')?.[1];

        if (sessionStr) {
          const session = JSON.parse(decodeURIComponent(sessionStr));
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
        }
      } catch (err) {
        // ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Clear local session storage/cookies
        document.cookie = 'hrms_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
