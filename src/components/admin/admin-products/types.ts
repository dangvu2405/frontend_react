import type { Category, ChartItem, Product } from '@/types/models';

export type StockFilter = 'all' | 'in' | 'out' | 'low';

export interface AdminProductsFilters {
  search: string;
  categoryId: string;
  stock: StockFilter;
}

export interface AdminProductsFormState {
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

export interface AdminProductsHookState {
  loading: boolean;
  categories: Category[];
  categorySalesChart: ChartItem[];
  priceTrendChart: ChartItem[];
  pagination: PaginationState;
  filters: AdminProductsFilters;
  setFilters: (filters: Partial<AdminProductsFilters>) => void;
  resetFilters: () => void;
  filteredProducts: Product[];
  isSelectMode: boolean;
  toggleSelectMode: () => void;
  selectedProducts: Set<string>;
  handleToggleSelectAll: () => void;
  handleToggleSelectProduct: (productId: string) => void;
  handleBulkDelete: () => Promise<void>;
  isDialogOpen: boolean;
  openCreateDialog: () => void;
  openEditDialog: (product: Product) => void;
  closeDialog: () => void;
  formData: AdminProductsFormState;
  updateFormData: <K extends keyof AdminProductsFormState>(field: K, value: AdminProductsFormState[K]) => void;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  imageState: ImageState;
  handleImageChange: (file: File | null, index?: number) => void;
  removeImage: (index?: number) => void;
  isDeleteDialogOpen: boolean;
  openDeleteDialog: (product: Product) => void;
  closeDeleteDialog: () => void;
  deletingProduct: Product | null;
  handleDelete: () => Promise<void>;
  getStockStatus: (stock: number) => { text: string; color: string };
  changePage: (page: number) => void;
  editingProduct: Product | null;
}

