// API Base URL - Get from environment variable or use default
const getApiBaseUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  const viteApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If VITE_API_URL is empty string, treat as not set
  if (viteApiUrl && viteApiUrl.trim() !== '') {
    return viteApiUrl.trim();
  }
  
  // Try VITE_API_BASE_URL
  if (viteApiBaseUrl && viteApiBaseUrl.trim() !== '') {
    return viteApiBaseUrl.trim();
  }
  
  // Development: localhost
  // Projection: should be set via env var, but fallback to empty (relative URL)
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:3001';
  }
  
  // In projection, if not set, use empty string (relative URL)
  // This assumes frontend and backend are on same domain
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  GOOGLE_AUTH: '/auth/google',
  GOOGLE_EXCHANGE: '/auth/google/exchange',
} as const;

