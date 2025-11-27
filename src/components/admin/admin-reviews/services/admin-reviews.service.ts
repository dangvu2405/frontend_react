import axiosInstance from '@/lib/api/axios';
import type { Review, ReviewStats } from '@/types/models';

export interface AdminReviewsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  productId?: string;
  customerId?: string;
  minRating?: number;
  maxRating?: number;
}

const REVIEWS_ENDPOINT = '/admin/reviews';
const REVIEW_STATS_ENDPOINT = '/admin/reviews/stats';

const extractArray = <T>(payload: unknown, nestedKey?: string): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== 'object') return [];

  const data = (payload as Record<string, unknown>).data ?? payload;
  if (Array.isArray(data)) return data as T[];

  if (nestedKey && data && typeof data === 'object' && nestedKey in (data as Record<string, unknown>)) {
    const nested = (data as Record<string, unknown>)[nestedKey];
    if (Array.isArray(nested)) return nested as T[];
  }

  return [];
};

const extractPagination = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return { totalPages: 1, total: 0 };
  const source = (payload as Record<string, unknown>).pagination ?? payload;
  return {
    totalPages: Number((source as Record<string, number>)?.totalPages ?? 1),
    total: Number((source as Record<string, number>)?.total ?? 0),
  };
};

const extractStats = (payload: unknown): ReviewStats | null => {
  if (!payload || typeof payload !== 'object') return null;
  if ('summary' in (payload as Record<string, unknown>)) {
    return payload as ReviewStats;
  }
  if ('data' in (payload as Record<string, unknown>)) {
    const data = (payload as Record<string, unknown>).data;
    if (data && typeof data === 'object' && 'summary' in (data as Record<string, unknown>)) {
      return data as ReviewStats;
    }
  }
  return null;
};

export const adminReviewsService = {
  async getReviews(params: AdminReviewsParams) {
    const response = await axiosInstance.get(REVIEWS_ENDPOINT, { params });
    const payload = response.data;

    return {
      reviews: extractArray<Review>(payload, 'reviews'),
      pagination: extractPagination(payload),
    };
  },

  async getReviewStats() {
    const response = await axiosInstance.get(REVIEW_STATS_ENDPOINT);
    return extractStats(response.data);
  },

  deleteReview(reviewId: string) {
    return axiosInstance.delete(`${REVIEWS_ENDPOINT}/${reviewId}`);
  },

  deleteMultipleReviews(reviewIds: string[]) {
    return axiosInstance.delete(REVIEWS_ENDPOINT, { data: { reviewIds } });
  },
};

export type { Review, ReviewStats };


