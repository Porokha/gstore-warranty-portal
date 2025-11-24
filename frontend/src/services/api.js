import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Log API URL on module load (for debugging)
console.log('🔧 Frontend API_URL:', API_URL);
console.log('🔧 REACT_APP_API_URL env:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log every request (for debugging)
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url, {
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token (merged with logging interceptor above)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || errorData?.error || error.message;
    console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: errorMessage,
      fullData: errorData,
    });
    // Log the full error data for debugging
    if (errorData) {
      console.error('❌ Full error response data:', JSON.stringify(errorData, null, 2));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/staff/login';
    }
    return Promise.reject(error);
  }
);

export default api;

