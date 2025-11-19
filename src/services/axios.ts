import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import { storage } from '@/utils/storage';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Cho phép gửi cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API configuration for debugging
if (typeof window !== 'undefined') {
  console.log('🌐 Axios Base URL:', axiosInstance.defaults.baseURL);
  console.log('🌐 Full API URL example:', `${axiosInstance.defaults.baseURL}/api/products`);
}

// Request interceptor - Thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý response và errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data;
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
        // Try to refresh token
        const refreshToken = storage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
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

