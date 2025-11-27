import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || errorData?.error || error.message;

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/staff/login';
    }

    return Promise.reject(errorMessage || error);
  }
);

export default api;
