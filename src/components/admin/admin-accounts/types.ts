import type { AdminUserPayload, ChartItem, Role, User } from '@/types/models';

export interface AdminAccountsFilters {
  search: string;
  roleId: string;
  status: string;
}

export interface AdminAccountFormState extends AdminUserPayload {
  tenDangNhap?: string;
  matKhau?: string;
  trangThai?: string;
  maVaiTro?: string;
  gioiTinh?: string;
  ngaySinh?: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface AdminAccountsHookState {
  loading: boolean;
  users: User[];
  roles: Role[];
  roleChart: ChartItem[];
  statusChart: ChartItem[];
  pagination: PaginationState;
  filters: AdminAccountsFilters;
  setFilters: (update: Partial<AdminAccountsFilters>) => void;
  resetFilters: () => void;
  filteredUsers: User[];
  isSelectMode: boolean;
  selectedUsers: Set<string>;
  toggleSelectMode: () => void;
  toggleSelectAll: () => void;
  toggleSelectUser: (userId: string) => void;
  handleBulkDelete: () => Promise<void>;
  handleBulkUpdateStatus: (status: string) => Promise<void>;
  openCreateDialog: () => void;
  openEditDialog: (user: User) => void;
  closeDialog: () => void;
  isDialogOpen: boolean;
  editingUser: User | null;
  formData: AdminAccountFormState;
  updateFormData: (field: keyof AdminAccountFormState, value: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  submitting: boolean;
  openDeleteDialog: (user: User) => void;
  closeDeleteDialog: () => void;
  isDeleteDialogOpen: boolean;
  deletingUser: User | null;
  handleDelete: () => Promise<void>;
  getStatusBadge: (status?: string) => { className: string; label: string };
  changePage: (page: number) => void;
}




