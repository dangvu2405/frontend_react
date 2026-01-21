import axiosInstance from './axios';
import type { 
  ApiItemResponse, 
  Review,
  RatingStats,
  CreateReviewData,
  Pagination
} from '@/types/models';

export const reviewService = {
  // Lấy danh sách đánh giá của sản phẩm
  getProductReviews: async (productId: string, params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const response = await axiosInstance.get<ApiItemResponse<{ reviews: Review[]; pagination?: Pagination }>>(`/api/reviews/product/${productId}`, { params });
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

  // Lấy thống kê rating của sản phẩm
  getProductRatingStats: async (productId: string): Promise<RatingStats> => {
    const response = await axiosInstance.get<ApiItemResponse<RatingStats>>(`/api/reviews/product/${productId}/stats`);
    const responseData = response.data;
    
    if (responseData.success && responseData.data) {
      return responseData.data as RatingStats;
    }
    
    return {
      avgRating: 0,
      totalReviews: 0,
      star5: 0,
      star4: 0,
      star3: 0,
      star2: 0,
      star1: 0
    };
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

  // Lấy đánh giá của user cho sản phẩm
  getMyReview: async (productId: string): Promise<Review | null> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<Review>>(`/api/reviews/product/${productId}/my-review`);
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

