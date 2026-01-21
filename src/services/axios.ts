import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/constants';
import { storage } from '@/utils/storage';
import type { ApiResponse } from '@/types/models';

const FALLBACK_DATA_KEYS = [
  'data',
  'product',
  'products',
  'order',
  'orders',
  'cart',
  'items',
  'item',
  'result',
  'results',
  'payload',
  'record',
  'records',
  'user',
  'users',
  'voucher',
  'vouchers',
  'session',
  'sessions',
  'role',
  'roles',
  'category',
  'categories',
] as const;

type NormalizablePayload<T> = ApiResponse<T> | Record<string, unknown> | undefined | null;

const normalizeResponse = <T>(payload: NormalizablePayload<T>): ApiResponse<T> & Record<string, unknown> => {
  if (!payload || typeof payload !== 'object') {
    return {
      success: true,
      message: undefined,
      data: (payload ?? null) as T,
    } as ApiResponse<T> & Record<string, unknown>;
  }

  // Nếu payload đã có cấu trúc ApiResponse (có success và data), giữ nguyên và giữ lại các field khác (như pagination)
  if ('data' in payload && payload.data !== undefined && ('success' in payload || 'message' in payload)) {
    // Giữ lại tất cả các field khác (pagination, etc.)
    return payload as ApiResponse<T> & Record<string, unknown>;
  }

  // Nếu chưa có cấu trúc ApiResponse, normalize và giữ lại các field khác
  const normalized = {
    ...(payload as Record<string, unknown>),
  } as ApiResponse<T> & Record<string, unknown>;

  normalized.success = (payload as ApiResponse<T>).success ?? true;
  normalized.message = (payload as ApiResponse<T>).message;

  for (const key of FALLBACK_DATA_KEYS) {
    if (key in payload && (payload as Record<string, unknown>)[key] !== undefined) {
      normalized.data = (payload as Record<string, unknown>)[key] as T;
      break;
    }
  }

  if (normalized.data === undefined) {
    normalized.data = null as T | null;
  }

  // Giữ lại các field khác từ payload gốc (như pagination)
  Object.keys(payload as Record<string, unknown>).forEach(key => {
    if (!['success', 'message', 'data'].includes(key) && !FALLBACK_DATA_KEYS.includes(key as Record<string, unknown>)) {
      normalized[key] = (payload as Record<string, unknown>)[key];
    }
  });

  return normalized;
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Cho phép gửi cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API configuration for debugging (only in development)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const baseURL = axiosInstance.defaults.baseURL || 'empty (relative)';
  console.log('🌐 Axios Base URL:', baseURL);
  console.log('🌐 Environment:', import.meta.env.MODE);
  console.log('🌐 VITE_API_URL:', import.meta.env.VITE_API_URL || 'not set');
  if (baseURL !== 'empty (relative)') {
    console.log('🌐 Full API URL example:', `${axiosInstance.defaults.baseURL}/user/me`);
  }
}

// Request interceptor - Thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug: Log token được thêm (chỉ trong dev)
      if (import.meta.env.DEV && config.url?.includes('/api/upload')) {
        console.log('✅ Token added to upload request:', {
          url: config.url,
          hasToken: !!token,
          tokenLength: token?.length,
          header: config.headers.Authorization ? 'Bearer ***' : 'missing'
        });
      }
    } else {
      // Debug: Log khi không có token (chỉ trong dev)
      if (import.meta.env.DEV && config.url?.includes('/api/upload')) {
        console.warn('⚠️ No token found for upload request:', {
          url: config.url,
          localStorage: {
            access_token: localStorage.getItem('access_token') ? 'present' : 'missing',
            refresh_token: localStorage.getItem('refresh_token') ? 'present' : 'missing'
          }
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý response và errors
axiosInstance.interceptors.response.use(
  (response): AxiosResponse<ApiResponse<unknown>> => {
    // Normalize response.data và giữ lại trong response.data
    const normalizedData = normalizeResponse(response.data);
    // Trả về response với data đã được normalize (giữ lại pagination)
    return {
      ...response,
      data: normalizedData,
    } as AxiosResponse<ApiResponse<unknown>>;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/') || originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/register');
    const isAuthCallback = originalRequest?.url?.includes('/auth/callback');
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    
    // Bỏ qua lỗi 404 cho /auth/callback vì đây là frontend route, không phải API endpoint
    if (error.response?.status === 404 && isAuthCallback) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Ignoring 404 for /auth/callback - this is a frontend route, not an API endpoint');
      }
      return Promise.reject({
        message: 'Frontend route, not an API endpoint',
        status: 404,
        skipError: true,
      });
    }
    
    // If 401 and token was cleared by backend
    if (error.response?.status === 401 && error.response?.data?.cleared === true) {
      // Backend đã xóa token (token không hợp lệ), xóa localStorage
      storage.clearAll();
      // Chỉ redirect nếu không phải auth endpoint và không đang ở trang login
      if (!isAuthEndpoint && !isLoginPage) {
        window.location.href = '/login';
      }
      return Promise.reject({
        message: error.response?.data?.message || 'Phiên đăng nhập hết hạn',
        status: 401,
        data: error.response?.data,
      });
    }
    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Không retry nếu đang gọi auth endpoints - format error message từ backend
      if (isAuthEndpoint) {
        // Ưu tiên message từ backend response (error.response.data.message)
        // Backend trả về: { success: false, message: "Thông tin đăng nhập không đúng" }
        const errorMessage =
          error.response?.data?.message || // Lấy từ backend constants MESSAGES.INVALID_CREDENTIALS
          error.message ||
          'Đăng nhập thất bại';
        return Promise.reject({
          message: errorMessage,
          status: 401,
          data: error.response?.data,
        });
      }
      
      originalRequest._retry = true;

      try {
        // ✅ Backend đọc refreshToken từ cookie, không cần gửi trong body
        // Try to refresh token
        const response = await axiosInstance.post(`${API_BASE_URL}/auth/refresh-token`, {});

        // ✅ Backend trả về: { success, message, data: { accessToken } }
        const responseData = response.data;
        const accessToken = responseData?.data?.accessToken || responseData?.accessToken;
        
        if (accessToken) {
          storage.setToken(accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        storage.clearAll();
        // Chỉ redirect nếu không đang ở trang login
        if (!isLoginPage) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra, vui lòng thử lại';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default axiosInstance;

