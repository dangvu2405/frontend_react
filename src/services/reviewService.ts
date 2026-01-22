import axiosInstance from './axios';
import type { 
  ApiItemResponse, 
  Review,
  RatingStats,
  CreateReviewData,
  Pagination
} from '@/types/models';

export const reviewService = {
  // Lấy danh sách đánh giá của đồ án
  getProjectReviews: async (projectId: string, params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const response = await axiosInstance.get<ApiItemResponse<{ reviews: Review[]; pagination?: Pagination }>>(`/api/reviews/project/${projectId}`, { params });
    const responseData = response.data;
    
    // Backend trả về: { success, message, data: { reviews, pagination } }
    if (responseData.success && responseData.data) {
      if ('reviews' in responseData.data) {
        return {
          reviews: responseData.data.reviews ?? [],
          pagination: responseData.data.pagination
        };
      }
      // Fallback: nếu data là array trực tiếp
      if (Array.isArray(responseData.data)) {
        return {
          reviews: responseData.data,
          pagination: undefined
        };
      }
    }
    
    return {
      reviews: [],
      pagination: undefined
    };
  },

  // Lấy thống kê rating của đồ án
  getProjectRatingStats: async (projectId: string): Promise<RatingStats> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<RatingStats>>(`/api/reviews/project/${projectId}/stats`);
      const responseData = response.data;
      
      if (responseData.success && responseData.data) {
        return responseData.data as RatingStats;
      }
      
      // Return default stats if response doesn't have data
      return {
        avgRating: 0,
        totalReviews: 0,
        star5: 0,
        star4: 0,
        star3: 0,
        star2: 0,
        star1: 0
      };
    } catch (error: unknown) {
      // Handle 404 gracefully - API endpoint not implemented yet
      const errorRecord = error as Record<string, unknown>;
      const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
      
      if (status === 404) {
        if (import.meta.env.DEV) {
          console.warn(`[reviewService] API endpoint /api/reviews/project/${projectId}/stats not implemented yet (404). Returning default stats.`);
        }
        // Return default stats instead of throwing error
        return {
          avgRating: 0,
          totalReviews: 0,
          star5: 0,
          star4: 0,
          star3: 0,
          star2: 0,
          star1: 0
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  // Tạo đánh giá mới
  createReview: async (data: CreateReviewData): Promise<Review> => {
    const response = await axiosInstance.post<ApiItemResponse<Review>>('/api/reviews', data);
    const responseData = response.data;

    if (responseData?.success && responseData.data) {
      return responseData.data as Review;
    }

    throw new Error(responseData?.message || 'Không thể tạo đánh giá');
  },

  // Lấy đánh giá của user cho đồ án
  getMyReview: async (projectId: string): Promise<Review | null> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<Review>>(`/api/reviews/project/${projectId}/my-review`);
      const responseData = response.data;
      
      if (responseData.success && responseData.data) {
        return responseData.data as Review;
      }
      return null;
    } catch (error: unknown) {
      // Axios interceptor đã transform error
      if (error && typeof error === 'object' && ('status' in error || 'response' in error)) {
        const errorRecord = error as Record<string, unknown>;
        const status = errorRecord.status || ((errorRecord.response as Record<string, unknown>)?.status);
        if (status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  // Lấy tất cả đánh giá của user
  getMyReviews: async (params?: { page?: number; limit?: number }) => {
    const response = await axiosInstance.get<ApiItemResponse<{ reviews: Review[]; pagination?: Pagination }>>('/api/reviews/my-reviews', { params });
    const responseData = response.data;
    
    // Backend trả về: { success, message, data: { reviews, pagination } }
    if (responseData.success && responseData.data) {
      if ('reviews' in responseData.data) {
        return {
          reviews: responseData.data.reviews ?? [],
          pagination: responseData.data.pagination
        };
      }
      // Fallback: nếu data là array trực tiếp
      if (Array.isArray(responseData.data)) {
        return {
          reviews: responseData.data,
          pagination: undefined
        };
      }
    }
    
    return {
      reviews: [],
      pagination: undefined
    };
  },

  // Cập nhật đánh giá
  updateReview: async (reviewId: string, data: { NoiDung?: string; SoSao?: number }) => {
    const response = await axiosInstance.put<ApiItemResponse<Review>>(`/api/reviews/${reviewId}`, data);
    return response.data;
  },

  // Xóa đánh giá
  deleteReview: async (reviewId: string) => {
    const response = await axiosInstance.delete<ApiItemResponse<void>>(`/api/reviews/${reviewId}`);
    return response.data;
  },
};

export type { RatingStats };

