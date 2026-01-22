import type { Review, ReviewStats } from '@/types/models';

export interface AdminReviewsFilters {
  projectId: string;
  customerId: string;
  minRating: string;
  maxRating: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showFilters: boolean;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface AdminReviewsHookState {
  loading: boolean;
  reviews: Review[];
  stats: ReviewStats | null;
  error: string | null;
  pagination: PaginationState;
  filters: AdminReviewsFilters;
  setFilters: (update: Partial<AdminReviewsFilters>) => void;
  resetFilters: () => void;
  isSelectMode: boolean;
  selectedReviews: Set<string>;
  toggleSelectMode: () => void;
  toggleSelectAll: () => void;
  toggleSelectReview: (reviewId: string) => void;
  openViewDialog: (review: Review) => void;
  closeViewDialog: () => void;
  isViewDialogOpen: boolean;
  viewingReview: Review | null;
  openDeleteDialog: (review: Review) => void;
  closeDeleteDialog: () => void;
  isDeleteDialogOpen: boolean;
  deletingReview: Review | null;
  deleteReview: () => Promise<void>;
  deleteSelectedReviews: () => Promise<void>;
  changePage: (page: number) => void;
  refresh: () => void;
}


