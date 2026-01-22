import axiosInstance from './axios';
import type { ApiItemResponse, Project } from '@/types/models';

export interface Heart {
  _id: string;
  MaKhachHang: string;
  MaSanPham: string | Project;
  createdAt?: string;
  updatedAt?: string;
}

export const heartService = {
  /**
   * Lấy danh sách đồ án yêu thích của user
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
   * Lấy danh sách project IDs đã yêu thích
   */
  getUserHeartProjectIds: async (): Promise<string[]> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<{ projectIds: string[] }>>('/user/hearts/ids');
      const responseData = response.data;
      
      if (responseData && responseData.data) {
        if (typeof responseData.data === 'object' && 'projectIds' in responseData.data) {
          const projectIds = (responseData.data as Record<string, unknown>).projectIds;
          return Array.isArray(projectIds) ? projectIds : [];
        }
        if (Array.isArray(responseData.data)) {
          return responseData.data;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching heart project IDs:', error);
      return [];
    }
  },

  /**
   * Kiểm tra user đã yêu thích đồ án chưa
   */
  checkHeart: async (projectId: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<{ isHeart: boolean }>>(`/user/hearts/check/${projectId}`);
      const responseData = response.data;
      
      if (responseData && responseData.data) {
        if (typeof responseData.data === 'object' && 'isHeart' in responseData.data) {
          return Boolean((responseData.data as Record<string, unknown>).isHeart);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking heart:', error);
      return false;
    }
  },

  /**
   * Thêm đồ án vào yêu thích
   */
  addHeart: async (projectId: string): Promise<Heart | null> => {
    try {
      const response = await axiosInstance.post<ApiItemResponse<{ heart: Heart }>>('/user/hearts', {
        projectId,
      });
      const responseData = response.data;
      
      if (responseData && responseData.data) {
        if (typeof responseData.data === 'object' && 'heart' in responseData.data) {
          return (responseData.data as Record<string, unknown>).heart as Heart | null;
        }
        return responseData.data as Heart;
      }
      
      return null;
    } catch (error: unknown) {
      // Nếu lỗi 401 (chưa đăng nhập), không throw error
      const errorRecord = error as Record<string, unknown>;
      const status = ((errorRecord?.response as Record<string, unknown>)?.status) || errorRecord?.status;
      if (status === 401) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Xóa đồ án khỏi yêu thích
   */
  removeHeart: async (projectId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/user/hearts/${projectId}`);
    } catch (error: unknown) {
      // Nếu lỗi 401 (chưa đăng nhập), không throw error
      const errorRecord = error as Record<string, unknown>;
      const status = ((errorRecord?.response as Record<string, unknown>)?.status) || errorRecord?.status;
      if (status === 401) {
        return;
      }
      throw error;
    }
  },

  /**
   * Đồng bộ hearts từ localStorage lên database
   */
  syncHearts: async (projectIds: string[]): Promise<Heart[]> => {
    const response = await axiosInstance.post<ApiItemResponse<{ hearts: Heart[] }>>('/user/hearts/sync', {
      projectIds,
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


