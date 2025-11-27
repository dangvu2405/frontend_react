import type { ChartItem, CustomerWithStats, Role } from '@/types/models';

export type CustomerStatusFilter = 'all' | 'active' | 'inactive';

export interface AdminCustomersFilters {
  search: string;
  status: CustomerStatusFilter;
}

export interface AdminCustomerFormState {
  hoten: string;
  email: string;
  sdt: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface AdminCustomersHookState {
  loading: boolean;
  customers: CustomerWithStats[];
  roles: Role[];
  topCustomersChart: ChartItem[];
  statusChart: ChartItem[];
  pagination: PaginationState;
  filters: AdminCustomersFilters;
  setFilters: (update: Partial<AdminCustomersFilters>) => void;
  resetFilters: () => void;
  filteredCustomers: CustomerWithStats[];
  openDetailDialog: (customer: CustomerWithStats) => void;
  closeDetailDialog: () => void;
  isDetailDialogOpen: boolean;
  selectedCustomer: CustomerWithStats | null;
  openEditDialog: (customer: CustomerWithStats) => void;
  closeEditDialog: () => void;
  isEditDialogOpen: boolean;
  editingCustomer: CustomerWithStats | null;
  formData: AdminCustomerFormState;
  updateFormData: (field: keyof AdminCustomerFormState, value: string) => void;
  handleUpdateCustomer: () => Promise<void>;
  submitting: boolean;
  openDeleteDialog: (customer: CustomerWithStats) => void;
  closeDeleteDialog: () => void;
  isDeleteDialogOpen: boolean;
  deletingCustomer: CustomerWithStats | null;
  handleDeleteCustomer: () => Promise<void>;
  openLockDialog: (customer: CustomerWithStats) => void;
  closeLockDialog: () => void;
  isLockDialogOpen: boolean;
  lockingCustomer: CustomerWithStats | null;
  handleLockCustomer: () => Promise<void>;
  openRoleDialog: (customer: CustomerWithStats) => void;
  closeRoleDialog: () => void;
  isRoleDialogOpen: boolean;
  changingRoleCustomer: CustomerWithStats | null;
  selectedRoleId: string;
  setSelectedRoleId: (roleId: string) => void;
  handleChangeRole: () => Promise<void>;
  getStatusBadgeProps: (status: string) => { className: string; label: string };
  changePage: (page: number) => void;
  stats: {
    totalCustomers: number;
    vipCustomers: number;
    totalRevenue: number;
    totalOrders: number;
  };
}


