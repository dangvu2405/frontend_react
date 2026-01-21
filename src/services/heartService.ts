import axiosInstance from './axios';
import type { ApiItemResponse, Product } from '@/types/models';

export interface Heart {
  _id: string;
  MaKhachHang: string;
  MaSanPham: string | Product;
  createdAt?: string;
  updatedAt?: string;
}

export const heartService = {
  /**
   * Lấy danh sách sản phẩm yêu thích của user
   */
  getUserHearts: async (): Promise<Heart[]> => {
    const response = await axiosInstance.get<ApiItemResponse<{ hearts: Heart[] }>>('/user/hearts');
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      if (typeof responseData.data === 'object' && 'hearts' in responseData.data) {
        const hearts = (responseData.data as Record<string, unknown>).hearts;
        return Array.isArray(hearts) ? hearts : [];
      }
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
    }
    
    return [];
  },

  /**
   * Lấy danh sách product IDs đã yêu thích
   */
  getUserHeartProductIds: async (): Promise<string[]> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<{ productIds: string[] }>>('/user/hearts/ids');
      const responseData = response.data;
      
      if (responseData && responseData.data) {
        if (typeof responseData.data === 'object' && 'productIds' in responseData.data) {
          const productIds = (responseData.data as Record<string, unknown>).productIds;
          return Array.isArray(productIds) ? productIds : [];
        }
        if (Array.isArray(responseData.data)) {
          return responseData.data;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching heart product IDs:', error);
      return [];
    }
  },

  /**
   * Kiểm tra user đã yêu thích sản phẩm chưa
   */
  checkHeart: async (productId: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<{ isHeart: boolean }>>(`/user/hearts/check/${productId}`);
      const responseData = response.data;
      
      if (responseData && responseData.data) {
        if (typeof responseData.data === 'object' && 'isHeart' in responseData.data) {
          return (responseData.data as Record<string, unknown>).isHeart;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking heart:', error);
      return false;
    }
  },

  /**
   * Thêm sản phẩm vào yêu thích
   */
  addHeart: async (productId: string): Promise<Heart | null> => {
    try {
      const response = await axiosInstance.post<ApiItemResponse<{ heart: Heart }>>('/user/hearts', {
        productId,
      });
      const responseData = response.data;
      
      if (responseData && responseData.data) {
        if (typeof responseData.data === 'object' && 'heart' in responseData.data) {
          return (responseData.data as Record<string, unknown>).heart;
        }
        return responseData.data as Heart;
      }
      
      return null;
    } catch (error: unknown) {
      // Nếu lỗi 401 (chưa đăng nhập), không throw error
      if (error?.response?.status === 401 || error?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Xóa sản phẩm khỏi yêu thích
   */
  removeHeart: async (productId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/user/hearts/${productId}`);
    } catch (error: unknown) {
      // Nếu lỗi 401 (chưa đăng nhập), không throw error
      if (error?.response?.status === 401 || error?.status === 401) {
        return;
      }
      throw error;
    }
  },

  /**
   * Đồng bộ hearts từ localStorage lên database
   */
  syncHearts: async (productIds: string[]): Promise<Heart[]> => {
    const response = await axiosInstance.post<ApiItemResponse<{ hearts: Heart[] }>>('/user/hearts/sync', {
      productIds,
    });
    const responseData = response.data;
    
    if (responseData && responseData.data) {
      if (typeof responseData.data === 'object' && 'hearts' in responseData.data) {
        const hearts = (responseData.data as Record<string, unknown>).hearts;
        return Array.isArray(hearts) ? hearts : [];
      }
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
    }
    
    return [];
  },
};


