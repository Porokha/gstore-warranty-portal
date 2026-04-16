import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const isStaffPath = (pathname) => pathname === '/staff' || pathname.startsWith('/staff/');
const isShopAdminPath = (pathname) => pathname === '/shop/admin' || pathname.startsWith('/shop/admin/');

const getAuthRedirectPath = (error) => {
  if (error.response?.status !== 401) {
    return null;
  }

  if (error.config?.skipAuthRedirect) {
    return null;
  }

  const requestUrl = typeof error.config?.url === 'string' ? error.config.url : '';
  if (requestUrl.startsWith('/public/')) {
    return null;
  }

  const currentPath = window.location.pathname || '/';
  if (isShopAdminPath(currentPath)) {
    return '/shop/admin/login';
  }

  if (isStaffPath(currentPath)) {
    return '/staff/login';
  }

  return null;
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
    const redirectPath = getAuthRedirectPath(error);
    if (redirectPath) {
      localStorage.removeItem('access_token');
      window.location.href = redirectPath;
    }

    return Promise.reject(error);
  }
);

export default api;
