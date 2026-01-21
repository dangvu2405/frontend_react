import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getCloudinaryProductImageUrl } from '@/utils/imageUtils';
import type { Category, ChartItem, Product } from '@/types/models';

import adminProductsService from '../services/admin-products.service';
import type {
  AdminProductsFilters,
  AdminProductsFormState,
  AdminProductsHookState,
  PaginationState,
} from '../types';

const PAGE_SIZE = 10;
const SUB_IMAGE_LIMIT = 3;

const INITIAL_FILTERS: AdminProductsFilters = {
  search: '',
  categoryId: 'all',
  stock: 'all',
};

const INITIAL_FORM_STATE: AdminProductsFormState = {
  TenSanPham: '',
  MoTa: '',
  Gia: 0,
  KhuyenMai: 0,
  SoLuong: 0,
  MaLoaiSanPham: '',
  HinhAnhChinh: '',
  HinhAnhPhu: [],
};

const INITIAL_SUB_IMAGE_PREVIEWS = Array.from({ length: SUB_IMAGE_LIMIT }, () => '');
const INITIAL_SUB_IMAGE_UPLOADING = Array.from({ length: SUB_IMAGE_LIMIT }, () => false);

const extractArrayFromResponse = <T,>(payload: unknown, nestedKey?: string): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  if (nestedKey && obj[nestedKey]) {
    return extractArrayFromResponse<T>(obj[nestedKey], undefined);
  }
  if ('data' in obj) {
    return extractArrayFromResponse<T>(obj.data, nestedKey);
  }
  return [];
};

const extractUploadUrl = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';
  const obj = payload as Record<string, unknown>;
  const data =
    obj.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>)
      : obj;
  const url = data.url || data.secure_url;
  return typeof url === 'string' ? url : '';
};

const resolvePreviewUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return path;
  return getCloudinaryProductImageUrl(path);
};

const buildSubImagePreviews = (images: string[]) => {
  const previews = images.map(resolvePreviewUrl);
  while (previews.length < SUB_IMAGE_LIMIT) {
    previews.push('');
  }
  return previews.slice(0, SUB_IMAGE_LIMIT);
};

export const useAdminProducts = (): AdminProductsHookState => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySalesChart, setCategorySalesChart] = useState<ChartItem[]>([]);
  const [priceTrendChart, setPriceTrendChart] = useState<ChartItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<AdminProductsFilters>(INITIAL_FILTERS);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<AdminProductsFormState>(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  const [mainImagePreview, setMainImagePreview] = useState('');
  const [subImagePreviews, setSubImagePreviews] = useState<string[]>(INITIAL_SUB_IMAGE_PREVIEWS);
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [subImageUploading, setSubImageUploading] = useState<boolean[]>(INITIAL_SUB_IMAGE_UPLOADING);

  const categoriesFetchedRef = useRef(false);

  const updateFilters = useCallback((update: Partial<AdminProductsFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...update };
      return next;
    });

    if (update.categoryId !== undefined) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const setSelectionDefaults = useCallback(() => {
    setSelectedProducts(new Set());
    setIsSelectMode(false);
  }, []);

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedProducts(new Set());
      }
      return !prev;
    });
  };

  const updateFormData = useCallback(
    <K extends keyof AdminProductsFormState>(field: K, value: AdminProductsFormState[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const updateCharts = useCallback((productsData: Product[]) => {
    const safeProducts = Array.isArray(productsData) ? productsData : [];

    const categoryMap = new Map<string, ChartItem>();
    safeProducts.forEach((product) => {
      const categoryName =
        typeof product.MaLoaiSanPham === 'string'
          ? 'Không phân loại'
          : product.MaLoaiSanPham?.TenLoaiSanPham ?? 'Không phân loại';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { name: categoryName, sold: 0, revenue: 0 });
      }

      const categoryData = categoryMap.get(categoryName)!;
      categoryData.sold = (categoryData.sold ?? 0) + product.DaBan;
      categoryData.revenue = (categoryData.revenue ?? 0) + product.DaBan * product.Gia;
    });

    setCategorySalesChart(Array.from(categoryMap.values()));

    const priceRanges: ChartItem[] = [
      { name: '< 1 triệu', sold: 0 },
      { name: '1-2 triệu', sold: 0 },
      { name: '2-3 triệu', sold: 0 },
      { name: '3-4 triệu', sold: 0 },
      { name: '4-5 triệu', sold: 0 },
      { name: '> 5 triệu', sold: 0 },
    ];

    safeProducts.forEach((product) => {
      const price = product.Gia;
      let rangeIndex = 0;
      if (price >= 5_000_000) rangeIndex = 5;
      else if (price >= 4_000_000) rangeIndex = 4;
      else if (price >= 3_000_000) rangeIndex = 3;
      else if (price >= 2_000_000) rangeIndex = 2;
      else if (price >= 1_000_000) rangeIndex = 1;

      priceRanges[rangeIndex].sold = (priceRanges[rangeIndex].sold ?? 0) + product.DaBan;
    });

    setPriceTrendChart(priceRanges);
  }, []);

  const refreshCharts = useCallback(async () => {
    try {
      const params: Record<string, number | string> = { page: 1, limit: 1000 };
      if (filters.categoryId !== 'all') {
        params.categoryId = filters.categoryId;
      }
      const response = await adminProductsService.getProducts(params);
      const responseData = response?.data;
      const allProducts = extractArrayFromResponse<Product>(responseData?.data ?? responseData);
      updateCharts(allProducts);
    } catch (error) {
      console.error('Error refreshing charts:', error);
    }
  }, [filters.categoryId, updateCharts]);

  const fetchCategories = useCallback(async () => {
    if (categoriesFetchedRef.current || categories.length > 0) return;

    try {
      categoriesFetchedRef.current = true;
      const response = await adminProductsService.getCategories();
      const responseData = response?.data;
      const categoryList = extractArrayFromResponse<Category>(responseData?.data ?? responseData, 'categories');
      setCategories(categoryList);
      if (categoryList.length === 0) {
        console.warn('Không có danh mục nào. Vui lòng tạo danh mục trước khi thêm sản phẩm.');
      }
    } catch (error) {
      categoriesFetchedRef.current = false;
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục');
    }
  }, [categories.length]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, number | string> = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
      };

      if (filters.categoryId !== 'all') {
        params.categoryId = filters.categoryId;
      }

      const response = await adminProductsService.getProducts(params);
      const responseData = response?.data;
      const productsData = extractArrayFromResponse<Product>(responseData?.data ?? responseData);
      const paginationInfo = (responseData as Record<string, unknown>)?.pagination as Record<string, unknown> | undefined;

      setProducts(productsData);
      setPagination((prev) => ({
        ...prev,
        totalPages: typeof paginationInfo?.totalPages === 'number' ? paginationInfo.totalPages : 1,
        total: typeof paginationInfo?.total === 'number' ? paginationInfo.total : productsData.length,
      }));

      if (pagination.currentPage === 1) {
        await refreshCharts();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [filters.categoryId, pagination.currentPage, pagination.pageSize, refreshCharts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setSelectionDefaults();
  }, [filters.categoryId, filters.stock, filters.search, setSelectionDefaults]);

  const filteredProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts.filter((product) => {
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const categoryName =
          typeof product.MaLoaiSanPham === 'string'
            ? 'Không phân loại'
            : product.MaLoaiSanPham?.TenLoaiSanPham ?? 'Không phân loại';
        const matchesSearch =
          product.TenSanPham?.toLowerCase().includes(query) ||
          product.MoTa?.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.stock !== 'all') {
        switch (filters.stock) {
          case 'out':
            if (product.SoLuong !== 0) return false;
            break;
          case 'low':
            if (product.SoLuong >= 10 || product.SoLuong === 0) return false;
            break;
          case 'in':
            if (product.SoLuong < 10) return false;
            break;
        }
      }

      return true;
    });
  }, [products, filters]);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedProducts((prev) => {
      if (prev.size === filteredProducts.length) {
        return new Set();
      }
      return new Set(filteredProducts.map((product) => product._id));
    });
  }, [filteredProducts]);

  const handleToggleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.size === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      setSubmitting(true);
      await Promise.all(
        Array.from(selectedProducts).map((productId) => adminProductsService.deleteProduct(productId)),
      );
      toast.success(`Đã xóa ${selectedProducts.size} sản phẩm thành công`);
      setSelectionDefaults();
      await fetchProducts();
      await refreshCharts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      toast.error('Không thể xóa một số sản phẩm');
    } finally {
      setSubmitting(false);
    }
  }, [fetchProducts, refreshCharts, selectedProducts, setSelectionDefaults]);

  const openCreateDialog = useCallback(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    setEditingProduct(null);
    setFormData(INITIAL_FORM_STATE);
    setMainImagePreview('');
    setSubImagePreviews(INITIAL_SUB_IMAGE_PREVIEWS);
    setSubImageUploading(INITIAL_SUB_IMAGE_UPLOADING);
    setIsDialogOpen(true);
  }, [categories.length, fetchCategories]);

  const openEditDialog = useCallback((product: Product) => {
    setEditingProduct(product);
    const subImages = product.HinhAnhPhu || [];
    setFormData({
      TenSanPham: product.TenSanPham,
      MoTa: product.MoTa || '',
      Gia: product.Gia,
      KhuyenMai: product.KhuyenMai || 0,
      SoLuong: product.SoLuong,
      MaLoaiSanPham:
        typeof product.MaLoaiSanPham === 'string'
          ? product.MaLoaiSanPham
          : product.MaLoaiSanPham?._id || '',
      HinhAnhChinh: product.HinhAnhChinh || '',
      HinhAnhPhu: subImages,
    });
    setMainImagePreview(resolvePreviewUrl(product.HinhAnhChinh));
    setSubImagePreviews(buildSubImagePreviews(subImages));
    setSubImageUploading(INITIAL_SUB_IMAGE_UPLOADING);
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(INITIAL_FORM_STATE);
    setMainImagePreview('');
    setSubImagePreviews(INITIAL_SUB_IMAGE_PREVIEWS);
    setSubImageUploading(INITIAL_SUB_IMAGE_UPLOADING);
  }, []);

  const openDeleteDialog = useCallback((product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeletingProduct(null);
    setIsDeleteDialogOpen(false);
  }, []);

  const uploadImageToCloudinary = useCallback(async (base64: string) => {
    const response = await adminProductsService.uploadImage(base64);
    const responseData = response?.data;
    const url = extractUploadUrl(responseData) || extractUploadUrl(responseData?.data);
    if (!url) {
      throw new Error(responseData?.message || 'Không thể upload ảnh lên Cloudinary');
    }
    return url;
  }, []);

  const handleImageChange = useCallback(
    (file: File | null, index = -1) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        if (index === -1) {
          setMainImagePreview(result);
          setMainImageUploading(true);
        } else {
          setSubImagePreviews((prev) => {
            const next = [...prev];
            next[index] = result;
            return next;
          });
          setSubImageUploading((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });
        }

        try {
          const uploadedUrl = await uploadImageToCloudinary(result);
          if (index === -1) {
            updateFormData('HinhAnhChinh', uploadedUrl);
          } else {
            setFormData((prev) => {
              const updated = [...(prev.HinhAnhPhu || [])];
              updated[index] = uploadedUrl;
              return {
                ...prev,
                HinhAnhPhu: updated.filter((img) => img && img.trim() !== ''),
              };
            });
          }
          toast.success('Upload ảnh thành công');
        } catch (error: unknown) {
          const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
          toast.error(errorMsg || 'Không thể upload ảnh. Vui lòng thử lại');
          if (index === -1) {
            setMainImagePreview('');
            updateFormData('HinhAnhChinh', '');
          } else {
            setSubImagePreviews((prev) => {
              const next = [...prev];
              next[index] = '';
              return next;
            });
            setFormData((prev) => {
              const updated = [...(prev.HinhAnhPhu || [])];
              updated.splice(index, 1);
              return { ...prev, HinhAnhPhu: updated };
            });
          }
        } finally {
          if (index === -1) {
            setMainImageUploading(false);
          } else {
            setSubImageUploading((prev) => {
              const next = [...prev];
              next[index] = false;
              return next;
            });
          }
        }
      };
      reader.readAsDataURL(file);
    },
    [updateFormData, uploadImageToCloudinary],
  );

  const removeImage = useCallback(
    (index = -1) => {
      if (index === -1) {
        setMainImagePreview('');
        updateFormData('HinhAnhChinh', '');
        return;
      }

      setSubImagePreviews((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      setFormData((prev) => {
        const updated = [...(prev.HinhAnhPhu || [])];
        updated.splice(index, 1);
        return { ...prev, HinhAnhPhu: updated };
      });
    },
    [updateFormData],
  );

  const validateForm = () => {
    if (!formData.TenSanPham.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return false;
    }
    if (!formData.MaLoaiSanPham) {
      toast.error('Vui lòng chọn loại sản phẩm');
      return false;
    }
    if (!formData.HinhAnhChinh?.trim()) {
      toast.error('Vui lòng chọn và upload ảnh chính cho sản phẩm');
      return false;
    }
    if (mainImageUploading || subImageUploading.some(Boolean)) {
      toast.error('Đang upload ảnh, vui lòng đợi hoàn tất');
      return false;
    }
    if (formData.Gia < 0) {
      toast.error('Giá sản phẩm phải lớn hơn hoặc bằng 0');
      return false;
    }
    if (formData.SoLuong < 0) {
      toast.error('Số lượng phải lớn hơn hoặc bằng 0');
      return false;
    }
    if (formData.KhuyenMai < 0 || formData.KhuyenMai > 100) {
      toast.error('Khuyến mãi phải từ 0 đến 100%');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        TenSanPham: formData.TenSanPham.trim(),
        MoTa: formData.MoTa?.trim() || '',
        Gia: Number(formData.Gia) || 0,
        KhuyenMai: Number(formData.KhuyenMai) || 0,
        SoLuong: Number(formData.SoLuong) || 0,
        MaLoaiSanPham: formData.MaLoaiSanPham,
        HinhAnhChinh: formData.HinhAnhChinh?.trim() || '',
        HinhAnhPhu: (formData.HinhAnhPhu || []).filter((img) => img && img.trim() !== ''),
      };

      if (editingProduct) {
        await adminProductsService.updateProduct(editingProduct._id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await adminProductsService.createProduct(payload);
        toast.success('Thêm sản phẩm thành công');
      }

      closeDialog();
      await fetchProducts();
      await refreshCharts();
    } catch (error: unknown) {
      console.error('Error submitting product:', error);
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = ((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deletingProduct) return;
    try {
      setSubmitting(true);
      await adminProductsService.deleteProduct(deletingProduct._id);
      toast.success('Xóa sản phẩm thành công');
      closeDeleteDialog();
      await fetchProducts();
      await refreshCharts();
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = ((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể xóa sản phẩm');
    } finally {
      setSubmitting(false);
    }
  }, [closeDeleteDialog, deletingProduct, fetchProducts, refreshCharts]);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { text: 'Hết hàng', color: 'text-red-600' };
    if (stock < 10) return { text: 'Sắp hết', color: 'text-orange-600' };
    return { text: 'Còn hàng', color: 'text-green-600' };
  }, []);

  const changePage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  return {
    loading,
    categories,
    categorySalesChart,
    priceTrendChart,
    pagination,
    filters,
    setFilters: updateFilters,
    resetFilters,
    filteredProducts,
    isSelectMode,
    toggleSelectMode,
    selectedProducts,
    handleToggleSelectAll,
    handleToggleSelectProduct,
    handleBulkDelete,
    isDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    formData,
    updateFormData,
    submitting,
    handleSubmit,
    imageState: {
      mainImagePreview,
      subImagePreviews,
      mainImageUploading,
      subImageUploading,
    },
    handleImageChange,
    removeImage,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    deletingProduct,
    handleDelete,
    getStockStatus,
    changePage,
    editingProduct,
  };
};




