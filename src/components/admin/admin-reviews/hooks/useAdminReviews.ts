import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Review } from '@/types/models';

import { adminReviewsService } from '../services/admin-reviews.service';
import type { AdminReviewsFilters, AdminReviewsHookState } from '../types';

const PAGE_SIZE = 20;

const INITIAL_FILTERS: AdminReviewsFilters = {
  productId: '',
  customerId: '',
  minRating: 'all',
  maxRating: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  showFilters: false,
};

export const useAdminReviews = (): AdminReviewsHookState => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<AdminReviewsHookState['stats']>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<AdminReviewsFilters>(INITIAL_FILTERS);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  const [viewingReview, setViewingReview] = useState<Review | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const setFilters = (update: Partial<AdminReviewsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
    if (
      update.productId !== undefined ||
      update.customerId !== undefined ||
      update.minRating !== undefined ||
      update.maxRating !== undefined ||
      update.sortBy !== undefined ||
      update.sortOrder !== undefined
    ) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const resetFilters = () => {
    setFiltersState(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const buildQueryParams = useCallback(() => {
    const params: Record<string, string | number> = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };

    if (filters.productId.trim()) params.productId = filters.productId.trim();
    if (filters.customerId.trim()) params.customerId = filters.customerId.trim();
    if (filters.minRating !== 'all') params.minRating = Number(filters.minRating);
    if (filters.maxRating !== 'all') params.maxRating = Number(filters.maxRating);

    return params;
  }, [filters, pagination.currentPage, pagination.pageSize]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = buildQueryParams();
      const { reviews: list, pagination: pageInfo } = await adminReviewsService.getReviews(params);

      setReviews(list);
      setPagination((prev) => ({
        ...prev,
        totalPages: pageInfo.totalPages || 1,
        total: pageInfo.total || list.length,
      }));
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Không thể tải danh sách đánh giá. Vui lòng thử lại sau.');
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  const fetchStats = useCallback(async () => {
    try {
      const fetchedStats = await adminReviewsService.getReviewStats();
      setStats(fetchedStats);
    } catch (err) {
      console.error('Error fetching review stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedReviews(new Set());
      }
      return !prev;
    });
  };

  const toggleSelectAll = () => {
    setSelectedReviews((prev) => {
      if (prev.size === reviews.length) return new Set();
      return new Set(reviews.map((review) => review._id));
    });
  };

  const toggleSelectReview = (reviewId: string) => {
    setSelectedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const openViewDialog = (review: Review) => {
    setViewingReview(review);
    setIsViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setViewingReview(null);
    setIsViewDialogOpen(false);
  };

  const openDeleteDialog = (review: Review) => {
    setDeletingReview(review);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeletingReview(null);
    setIsDeleteDialogOpen(false);
  };

  const deleteReview = async () => {
    if (!deletingReview) return;
    try {
      await adminReviewsService.deleteReview(deletingReview._id);
      toast.success('Xóa đánh giá thành công');
      closeDeleteDialog();
      refresh();
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Không thể xóa đánh giá');
    }
  };

  const deleteSelectedReviews = async () => {
    if (selectedReviews.size === 0) {
      toast.error('Vui lòng chọn đánh giá cần xóa');
      return;
    }
    try {
      await adminReviewsService.deleteMultipleReviews(Array.from(selectedReviews));
      toast.success(`Đã xóa ${selectedReviews.size} đánh giá`);
      setSelectedReviews(new Set());
      setIsSelectMode(false);
      refresh();
    } catch (err) {
      console.error('Error deleting reviews:', err);
      toast.error('Không thể xóa đánh giá');
    }
  };

  const changePage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const refresh = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    loading,
    reviews,
    stats,
    error,
    pagination,
    filters,
    setFilters,
    resetFilters,
    isSelectMode,
    selectedReviews,
    toggleSelectMode,
    toggleSelectAll,
    toggleSelectReview,
    openViewDialog,
    closeViewDialog,
    isViewDialogOpen,
    viewingReview,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deletingReview,
    deleteReview,
    deleteSelectedReviews,
    changePage,
    refresh,
  };
};


