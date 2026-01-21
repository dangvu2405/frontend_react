import axiosInstance from './axios';
import { API_ENDPOINTS } from '@/constants';
import { storage } from '@/utils/storage';
import type { LoginCredentials, RegisterData, AuthResponse, ApiItemResponse } from '@/types/models';

const authService = {
  login: async (credentials: LoginCredentials & { 'cf-turnstile-response'?: string }): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiItemResponse<{ accessToken: string; user?: AuthResponse['user']; message?: string }>>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    const responseData = response.data;

    if (responseData?.data) {
      const { accessToken, user } = responseData.data;

      if (accessToken) {
        storage.setToken(accessToken);
      }

      if (user) {
        storage.setUser(user);
      }

      return {
        message: responseData.message || 'Đăng nhập thành công',
        accessToken: accessToken || '',
        user: user || undefined,
      };
    }

    return {
      message: responseData?.message || 'Đăng nhập thành công',
      accessToken: '',
    };
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiItemResponse<{ accessToken: string; user?: AuthResponse['user']; message?: string }>>(
      API_ENDPOINTS.REGISTER,
      userData
    );

    const responseData = response.data;

    if (responseData?.data) {
      const { accessToken, user } = responseData.data;

      if (accessToken) {
        storage.setToken(accessToken);
      }

      if (user) {
        storage.setUser(user);
      }

      return {
        message: responseData.message || 'Đăng ký thành công',
        accessToken: accessToken || '',
        user: user || undefined,
      };
    }

    return {
      message: responseData?.message || 'Đăng ký thành công',
      accessToken: '',
    };
  },

  logout: async (): Promise<void> => {
    try {
      // ✅ Gọi logout API để xóa session trên server (trước khi clear token)
      await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    } catch (error: unknown) {
      // ✅ Log error nhưng vẫn tiếp tục logout local
      if (import.meta.env.DEV) {
        const errorMsg = (error as Record<string, unknown>)?.message;
        console.warn('Logout API error (continuing with local logout):', errorMsg);
      }
    }
    // ✅ Clear storage sau khi đã gọi API (không dùng finally để tránh clear quá sớm)
    storage.clearAll();
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return axiosInstance.post<unknown, { message: string }>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      { email }
    );
  },

  resetPassword: async (payload: {
    token: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ message: string }> => {
    return axiosInstance.post<unknown, { message: string }>(
      API_ENDPOINTS.RESET_PASSWORD,
      payload
    );
  },

  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  },

  getCurrentUser: () => {
    return storage.getUser();
  },
};

export default authService;

