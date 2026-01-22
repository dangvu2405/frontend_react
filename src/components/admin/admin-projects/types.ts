import type { Category, Project } from '@/types/models/product';
import type { ChartItem } from '@/types/models';

export type StockFilter = 'all' | 'in' | 'out' | 'low';

export interface AdminProjectsFilters {
  search: string;
  categoryId: string;
  stock: StockFilter;
}

export interface AdminProjectsFormState {
  TenSanPham: string;
  MoTa: string;
  Gia: number;
  KhuyenMai: number;
  SoLuong: number;
  MaLoaiSanPham: string;
  HinhAnhChinh: string;
  HinhAnhPhu: string[];
}

export interface ImageState {
  mainImagePreview: string;
  subImagePreviews: string[];
  mainImageUploading: boolean;
  subImageUploading: boolean[];
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface AdminProjectsHookState {
  loading: boolean;
  categories: Category[];
  categorySalesChart: ChartItem[];
  priceTrendChart: ChartItem[];
  pagination: PaginationState;
  filters: AdminProjectsFilters;
  setFilters: (filters: Partial<AdminProjectsFilters>) => void;
  resetFilters: () => void;
  filteredProjects: Project[];
  isSelectMode: boolean;
  toggleSelectMode: () => void;
  selectedProjects: Set<string>;
  handleToggleSelectAll: () => void;
  handleToggleSelectProject: (projectId: string) => void;
  handleBulkDelete: () => Promise<void>;
  isDialogOpen: boolean;
  openCreateDialog: () => void;
  openEditDialog: (project: Project) => void;
  closeDialog: () => void;
  formData: AdminProjectsFormState;
  updateFormData: <K extends keyof AdminProjectsFormState>(field: K, value: AdminProjectsFormState[K]) => void;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  imageState: ImageState;
  handleImageChange: (file: File | null, index?: number) => void;
  removeImage: (index?: number) => void;
  isDeleteDialogOpen: boolean;
  openDeleteDialog: (project: Project) => void;
  closeDeleteDialog: () => void;
  deletingProject: Project | null;
  handleDelete: () => Promise<void>;
  getStockStatus: (stock: number) => { text: string; color: string };
  changePage: (page: number) => void;
  editingProject: Project | null;
}

