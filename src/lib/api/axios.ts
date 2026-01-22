import axios, { AxiosHeaders, type AxiosError } from 'axios';

import { storage } from '@/utils/storage';

declare global {
  interface Window {
    __API_BASE_URL__?: string;
  }
}

const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined'
    ? window.__API_BASE_URL__ ?? import.meta.env.VITE_API_URL ?? '/api'
    : import.meta.env.VITE_API_URL ?? '/api';

const axiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const resolveAccessToken = () => storage.getToken();

axiosInstance.interceptors.request.use((config) => {
  const token = resolveAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    config.headers = headers;
  }
  
  // Debug logging for API requests
  if (import.meta.env.DEV) {
    const method = config.method?.toUpperCase() || 'GET';
    const url = `${config.baseURL || ''}${config.url || ''}`;
    const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';
    console.log(`🔵 [API Request] ${method} ${url}${params}`, {
      headers: config.headers,
      data: config.data,
      timestamp: new Date().toISOString(),
    });
  }
  
  return config;
});

const refreshAccessToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${DEFAULT_API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
          withCredentials: true,
        },
      );

      const token =
        response?.data?.accessToken ||
        response?.data?.data?.accessToken ||
        response?.data?.token ||
        null;

      if (token) {
        storage.setToken(token);
        window.dispatchEvent(new Event('token:updated'));
        return token;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Debug logging for successful API responses
    if (import.meta.env.DEV) {
      const method = response.config.method?.toUpperCase() || 'GET';
      const url = `${response.config.baseURL || ''}${response.config.url || ''}`;
      console.log(`🟢 [API Success] ${method} ${url}`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        timestamp: new Date().toISOString(),
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const status = error.response?.status ?? error.status;

    if (status === 401 && originalRequest && !originalRequest.headers?.['x-retried']) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const headers = AxiosHeaders.from(originalRequest.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        headers.set('x-retried', 'true');
        originalRequest.headers = headers;
        return axiosInstance(originalRequest);
      }
      storage.clearAll();
    }

    if (status === 403) {
      console.warn('Access denied:', error.response?.data || error.message);
    }

    // Debug logging for API errors
    // Skip logging 401 for public endpoints that might not require auth
    const url = originalRequest 
      ? `${originalRequest.baseURL || ''}${originalRequest.url || ''}`
      : 'Unknown URL';
    const isPublicEndpoint = url.includes('/reviews/project/') && url.includes('/stats');
    const shouldLogError = !(status === 401 && isPublicEndpoint);
    
    if (import.meta.env.DEV && shouldLogError) {
      const method = originalRequest?.method?.toUpperCase() || 'GET';
      console.error(`🔴 [API Error] ${method} ${url}`, {
        status,
        statusText: error.response?.statusText || error.message,
        error: error.response?.data || error.message,
        headers: error.response?.headers,
        timestamp: new Date().toISOString(),
      });
    } else if (import.meta.env.DEV && status === 401 && isPublicEndpoint) {
      // Silently handle 401 for public rating stats endpoints
      console.debug(`🔵 [API] Rating stats endpoint returned 401 (may not require auth): ${url}`);
    }

    return Promise.reject(
      error?.response?.data || {
        message: error.message || 'Request failed',
        status,
      },
    );
  },
);

export default axiosInstance;

