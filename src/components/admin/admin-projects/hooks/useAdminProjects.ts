import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getCloudinaryProjectImageUrl } from '@/utils/imageUtils';
import type { Category, Project } from '@/types/models/product';
import type { ChartItem } from '@/types/models';

import adminProjectsService from '../services/admin-projects.service';
import type {
  AdminProjectsFilters,
  AdminProjectsFormState,
  AdminProjectsHookState,
  PaginationState,
} from '../types';

const PAGE_SIZE = 10;
const SUB_IMAGE_LIMIT = 3;

const INITIAL_FILTERS: AdminProjectsFilters = {
  search: '',
  categoryId: 'all',
  stock: 'all',
};

const INITIAL_FORM_STATE: AdminProjectsFormState = {
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
  return getCloudinaryProjectImageUrl(path);
};

const buildSubImagePreviews = (images: string[]) => {
  const previews = images.map(resolvePreviewUrl);
  while (previews.length < SUB_IMAGE_LIMIT) {
    previews.push('');
  }
  return previews.slice(0, SUB_IMAGE_LIMIT);
};

export const useAdminProjects = (): AdminProjectsHookState => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySalesChart, setCategorySalesChart] = useState<ChartItem[]>([]);
  const [priceTrendChart, setPriceTrendChart] = useState<ChartItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<AdminProjectsFilters>(INITIAL_FILTERS);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState<AdminProjectsFormState>(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  const [mainImagePreview, setMainImagePreview] = useState('');
  const [subImagePreviews, setSubImagePreviews] = useState<string[]>(INITIAL_SUB_IMAGE_PREVIEWS);
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [subImageUploading, setSubImageUploading] = useState<boolean[]>(INITIAL_SUB_IMAGE_UPLOADING);

  const categoriesFetchedRef = useRef(false);

  const updateFilters = useCallback((update: Partial<AdminProjectsFilters>) => {
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
    setSelectedProjects(new Set());
    setIsSelectMode(false);
  }, []);

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedProjects(new Set());
      }
      return !prev;
    });
  };

  const updateFormData = useCallback(
    <K extends keyof AdminProjectsFormState>(field: K, value: AdminProjectsFormState[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const updateCharts = useCallback((projectsData: Project[]) => {
    const safeProjects = Array.isArray(projectsData) ? projectsData : [];

    const categoryMap = new Map<string, ChartItem>();
    safeProjects.forEach((project) => {
      const categoryName =
        typeof project.MaLoaiSanPham === 'string'
          ? 'Không phân loại'
          : project.MaLoaiSanPham?.TenLoaiSanPham ?? 'Không phân loại';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { name: categoryName, sold: 0, revenue: 0 });
      }

      const categoryData = categoryMap.get(categoryName)!;
      categoryData.sold = (categoryData.sold ?? 0) + project.DaBan;
      categoryData.revenue = (categoryData.revenue ?? 0) + project.DaBan * project.Gia;
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

    safeProjects.forEach((project) => {
      const price = project.Gia;
      let rangeIndex = 0;
      if (price >= 5_000_000) rangeIndex = 5;
      else if (price >= 4_000_000) rangeIndex = 4;
      else if (price >= 3_000_000) rangeIndex = 3;
      else if (price >= 2_000_000) rangeIndex = 2;
      else if (price >= 1_000_000) rangeIndex = 1;

      priceRanges[rangeIndex].sold = (priceRanges[rangeIndex].sold ?? 0) + project.DaBan;
    });

    setPriceTrendChart(priceRanges);
  }, []);

  const refreshCharts = useCallback(async () => {
    try {
      const params: Record<string, number | string> = { page: 1, limit: 1000 };
      if (filters.categoryId !== 'all') {
        params.categoryId = filters.categoryId;
      }
      const response = await adminProjectsService.getProjects(params);
      const responseData = response?.data;
      const allProjects = extractArrayFromResponse<Project>(responseData?.data ?? responseData);
      updateCharts(allProjects);
    } catch (error) {
      console.error('Error refreshing charts:', error);
    }
  }, [filters.categoryId, updateCharts]);

  const fetchCategories = useCallback(async () => {
    if (categoriesFetchedRef.current || categories.length > 0) return;

    try {
      categoriesFetchedRef.current = true;
      const response = await adminProjectsService.getCategories();
      const responseData = response?.data;
      const categoryList = extractArrayFromResponse<Category>(responseData?.data ?? responseData, 'categories');
      setCategories(categoryList);
      if (categoryList.length === 0) {
        console.warn('Không có danh mục nào. Vui lòng tạo danh mục trước khi thêm đồ án.');
      }
    } catch (error) {
      categoriesFetchedRef.current = false;
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục');
    }
  }, [categories.length]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, number | string> = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
      };

      if (filters.categoryId !== 'all') {
        params.categoryId = filters.categoryId;
      }

      const response = await adminProjectsService.getProjects(params);
      const responseData = response?.data;
      const projectsData = extractArrayFromResponse<Project>(responseData?.data ?? responseData);
      const paginationInfo = (responseData as Record<string, unknown>)?.pagination as Record<string, unknown> | undefined;

      setProjects(projectsData);
      setPagination((prev) => ({
        ...prev,
        totalPages: typeof paginationInfo?.totalPages === 'number' ? paginationInfo.totalPages : 1,
        total: typeof paginationInfo?.total === 'number' ? paginationInfo.total : projectsData.length,
      }));

      if (pagination.currentPage === 1) {
        await refreshCharts();
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Không thể tải dữ liệu đồ án');
    } finally {
      setLoading(false);
    }
  }, [filters.categoryId, pagination.currentPage, pagination.pageSize, refreshCharts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setSelectionDefaults();
  }, [filters.categoryId, filters.stock, filters.search, setSelectionDefaults]);

  const filteredProjects = useMemo(() => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    return safeProjects.filter((project) => {
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const categoryName =
          typeof project.MaLoaiSanPham === 'string'
            ? 'Không phân loại'
            : project.MaLoaiSanPham?.TenLoaiSanPham ?? 'Không phân loại';
        const matchesSearch =
          project.TenSanPham?.toLowerCase().includes(query) ||
          project.MoTa?.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.stock !== 'all') {
        switch (filters.stock) {
          case 'out':
            if (project.SoLuong !== 0) return false;
            break;
          case 'low':
            if (project.SoLuong >= 10 || project.SoLuong === 0) return false;
            break;
          case 'in':
            if (project.SoLuong < 10) return false;
            break;
        }
      }

      return true;
    });
  }, [projects, filters]);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedProjects((prev) => {
      if (prev.size === filteredProjects.length) {
        return new Set();
      }
      return new Set(filteredProjects.map((project) => project._id));
    });
  }, [filteredProjects]);

  const handleToggleSelectProject = useCallback((projectId: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProjects.size === 0) {
      toast.error('Vui lòng chọn ít nhất một đồ án');
      return;
    }

    try {
      setSubmitting(true);
      await Promise.all(
        Array.from(selectedProjects).map((projectId) => adminProjectsService.deleteProject(projectId)),
      );
      toast.success(`Đã xóa ${selectedProjects.size} đồ án thành công`);
      setSelectionDefaults();
      await fetchProjects();
      await refreshCharts();
    } catch (error) {
      console.error('Error bulk deleting projects:', error);
      toast.error('Không thể xóa một số đồ án');
    } finally {
      setSubmitting(false);
    }
  }, [fetchProjects, refreshCharts, selectedProjects, setSelectionDefaults]);

  const openCreateDialog = useCallback(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    setEditingProject(null);
    setFormData(INITIAL_FORM_STATE);
    setMainImagePreview('');
    setSubImagePreviews(INITIAL_SUB_IMAGE_PREVIEWS);
    setSubImageUploading(INITIAL_SUB_IMAGE_UPLOADING);
    setIsDialogOpen(true);
  }, [categories.length, fetchCategories]);

  const openEditDialog = useCallback((project: Project) => {
    setEditingProject(project);
    const subImages = project.HinhAnhPhu || [];
    setFormData({
      TenSanPham: project.TenSanPham,
      MoTa: project.MoTa || '',
      Gia: project.Gia,
      KhuyenMai: project.KhuyenMai || 0,
      SoLuong: project.SoLuong,
      MaLoaiSanPham:
        typeof project.MaLoaiSanPham === 'string'
          ? project.MaLoaiSanPham
          : project.MaLoaiSanPham?._id || '',
      HinhAnhChinh: project.HinhAnhChinh || '',
      HinhAnhPhu: subImages,
    });
    setMainImagePreview(resolvePreviewUrl(project.HinhAnhChinh));
    setSubImagePreviews(buildSubImagePreviews(subImages));
    setSubImageUploading(INITIAL_SUB_IMAGE_UPLOADING);
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingProject(null);
    setFormData(INITIAL_FORM_STATE);
    setMainImagePreview('');
    setSubImagePreviews(INITIAL_SUB_IMAGE_PREVIEWS);
    setSubImageUploading(INITIAL_SUB_IMAGE_UPLOADING);
  }, []);

  const openDeleteDialog = useCallback((project: Project) => {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeletingProject(null);
    setIsDeleteDialogOpen(false);
  }, []);

  const uploadImageToCloudinary = useCallback(async (base64: string) => {
    const response = await adminProjectsService.uploadImage(base64);
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
      toast.error('Vui lòng nhập tên đồ án');
      return false;
    }
    if (!formData.MaLoaiSanPham) {
      toast.error('Vui lòng chọn loại đồ án');
      return false;
    }
    if (!formData.HinhAnhChinh?.trim()) {
      toast.error('Vui lòng chọn và upload ảnh chính cho đồ án');
      return false;
    }
    if (mainImageUploading || subImageUploading.some(Boolean)) {
      toast.error('Đang upload ảnh, vui lòng đợi hoàn tất');
      return false;
    }
    if (formData.Gia < 0) {
      toast.error('Giá đồ án phải lớn hơn hoặc bằng 0');
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

      if (editingProject) {
        await adminProjectsService.updateProject(editingProject._id, payload);
        toast.success('Cập nhật đồ án thành công');
      } else {
        await adminProjectsService.createProject(payload);
        toast.success('Thêm đồ án thành công');
      }

      closeDialog();
      await fetchProjects();
      await refreshCharts();
    } catch (error: unknown) {
      console.error('Error submitting project:', error);
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = ((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deletingProject) return;
    try {
      setSubmitting(true);
      await adminProjectsService.deleteProject(deletingProject._id);
      toast.success('Xóa đồ án thành công');
      closeDeleteDialog();
      await fetchProjects();
      await refreshCharts();
    } catch (error: unknown) {
      console.error('Error deleting project:', error);
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = ((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể xóa đồ án');
    } finally {
      setSubmitting(false);
    }
  }, [closeDeleteDialog, deletingProject, fetchProjects, refreshCharts]);

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
    filteredProjects,
    isSelectMode,
    toggleSelectMode,
    selectedProjects,
    handleToggleSelectAll,
    handleToggleSelectProject,
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
    deletingProject,
    handleDelete,
    getStockStatus,
    changePage,
    editingProject,
  };
};




