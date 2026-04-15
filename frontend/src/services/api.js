import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const isStaffPath = (pathname) => pathname === '/staff' || pathname.startsWith('/staff/');

const shouldRedirectToStaffLogin = (error) => {
  if (error.response?.status !== 401) {
    return false;
  }

  if (error.config?.skipAuthRedirect) {
    return false;
  }

  const requestUrl = typeof error.config?.url === 'string' ? error.config.url : '';
  if (requestUrl.startsWith('/public/')) {
    return false;
  }

  const currentPath = window.location.pathname || '/';
  return isStaffPath(currentPath);
};

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
    if (shouldRedirectToStaffLogin(error)) {
      localStorage.removeItem('access_token');
      window.location.href = '/staff/login';
    }

    return Promise.reject(error);
  }
);

export default api;
