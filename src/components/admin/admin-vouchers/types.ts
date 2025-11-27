import type { Voucher, VoucherStats } from '@/types/models';

export interface AdminVouchersFilters {
  search: string;
  minGiaTri: string;
  maxGiaTri: string;
  minSoLuong: string;
  maxSoLuong: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showFilters: boolean;
}

export interface AdminVoucherFormState {
  MaVoucher: string;
  NoiDung: string;
  GiaTri: string;
  SoLuong: string;
  NgayTao: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface AdminVouchersHookState {
  loading: boolean;
  vouchers: Voucher[];
  stats: VoucherStats | null;
  pagination: PaginationState;
  filters: AdminVouchersFilters;
  setFilters: (update: Partial<AdminVouchersFilters>) => void;
  resetFilters: () => void;
  filteredCount: number;
  openDialog: (voucher?: Voucher) => void;
  closeDialog: () => void;
  isDialogOpen: boolean;
  editingVoucher: Voucher | null;
  formData: AdminVoucherFormState;
  updateFormData: (field: keyof AdminVoucherFormState, value: string) => void;
  handleSubmit: () => Promise<void>;
  openDeleteDialog: (voucher: Voucher) => void;
  closeDeleteDialog: () => void;
  isDeleteDialogOpen: boolean;
  deletingVoucher: Voucher | null;
  confirmDeleteVoucher: () => Promise<void>;
  changePage: (page: number) => void;
}


