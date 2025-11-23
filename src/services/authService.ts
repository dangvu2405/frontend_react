import axiosInstance from './axios';
import { API_ENDPOINTS } from '@/constants';
import { storage } from '@/utils/storage';
import type { LoginCredentials, RegisterData, AuthResponse } from '@/types/models';

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<any, AuthResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    // ✅ Backend trả về: { success, message, data: { accessToken, user } }
    const responseData = response.data;
    if (responseData && responseData.data) {
      const { accessToken, user } = responseData.data as any;
      
      if (accessToken) {
        storage.setToken(accessToken);
      }
      
      if (user) {
        storage.setUser(user);
      }
      
      // Trả về format tương thích với AuthResponse
      return {
        accessToken: accessToken || '',
        user: user || null
      } as AuthResponse;
    }

    return response;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<any, AuthResponse>(
      API_ENDPOINTS.REGISTER,
      userData
    );

    // ✅ Backend trả về: { success, message, data: { accessToken, user } }
    const responseData = response.data;
    if (responseData && responseData.data) {
      const { accessToken, user } = responseData.data as any;
      
      if (accessToken) {
        storage.setToken(accessToken);
      }
      
      if (user) {
        storage.setUser(user);
      }
      
      // Trả về format tương thích với AuthResponse
      return {
        accessToken: accessToken || '',
        user: user || null
      } as AuthResponse;
    }

    return response;
  },

  logout: async (): Promise<void> => {
    try {
      // ✅ Gọi logout API để xóa session trên server
      await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    } catch (error: any) {
      // ✅ Log error nhưng vẫn tiếp tục logout local
      if (import.meta.env.DEV) {
        console.warn('Logout API error (continuing with local logout):', error?.message);
      }
    } finally {
      // ✅ Clear tất cả storage (token, user, cart) - cart đã được lưu vào database trước đó
      storage.clearAll();
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return axiosInstance.post<any, { message: string }>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      { email }
    );
  },

  resetPassword: async (payload: {
    token: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ message: string }> => {
    return axiosInstance.post<any, { message: string }>(
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

