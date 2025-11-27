import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Voucher } from '@/types/models';

import { adminVouchersService } from '../services/admin-vouchers.service';
import type { AdminVoucherFormState, AdminVouchersFilters, AdminVouchersHookState } from '../types';

const PAGE_SIZE = 20;

const INITIAL_FILTERS: AdminVouchersFilters = {
  search: '',
  minGiaTri: '',
  maxGiaTri: '',
  minSoLuong: '',
  maxSoLuong: '',
  sortBy: 'NgayTao',
  sortOrder: 'desc',
  showFilters: false,
};

const INITIAL_FORM_STATE: AdminVoucherFormState = {
  MaVoucher: '',
  NoiDung: '',
  GiaTri: '',
  SoLuong: '',
  NgayTao: new Date().toISOString().split('T')[0],
};

export const useAdminVouchers = (): AdminVouchersHookState => {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState<AdminVouchersHookState['stats']>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<AdminVouchersFilters>(INITIAL_FILTERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState<AdminVoucherFormState>(INITIAL_FORM_STATE);

  const setFilters = (update: Partial<AdminVouchersFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
    if (
      update.search !== undefined ||
      update.minGiaTri !== undefined ||
      update.maxGiaTri !== undefined ||
      update.minSoLuong !== undefined ||
      update.maxSoLuong !== undefined ||
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

  const fetchStats = useCallback(async () => {
    try {
      const fetchedStats = await adminVouchersService.getVoucherStats();
      setStats(fetchedStats);
    } catch (error) {
      console.error('Error fetching voucher stats:', error);
    }
  }, []);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const { vouchers: list, pagination: pageInfo } = await adminVouchersService.getVouchers({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minGiaTri: filters.minGiaTri ? Number(filters.minGiaTri) : undefined,
        maxGiaTri: filters.maxGiaTri ? Number(filters.maxGiaTri) : undefined,
        minSoLuong: filters.minSoLuong ? Number(filters.minSoLuong) : undefined,
        maxSoLuong: filters.maxSoLuong ? Number(filters.maxSoLuong) : undefined,
      });

      setVouchers(list);
      setPagination((prev) => ({
        ...prev,
        totalPages: pageInfo.totalPages || 1,
        total: pageInfo.total || list.length,
      }));
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  }, [
    filters.maxGiaTri,
    filters.maxSoLuong,
    filters.minGiaTri,
    filters.minSoLuong,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    pagination.currentPage,
    pagination.pageSize,
  ]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filteredCount = useMemo(() => vouchers.length, [vouchers]);

  const openDialog = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        MaVoucher: voucher.MaVoucher,
        NoiDung: voucher.NoiDung,
        GiaTri: voucher.GiaTri.toString(),
        SoLuong: voucher.SoLuong.toString(),
        NgayTao: voucher.NgayTao ? new Date(voucher.NgayTao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingVoucher(null);
      setFormData(INITIAL_FORM_STATE);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingVoucher(null);
    setFormData(INITIAL_FORM_STATE);
  };

  const updateFormData = (field: keyof AdminVoucherFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.MaVoucher.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return false;
    }
    if (!formData.NoiDung.trim()) {
      toast.error('Vui lòng nhập nội dung voucher');
      return false;
    }
    const giaTri = Number(formData.GiaTri);
    if (Number.isNaN(giaTri) || giaTri < 0 || giaTri > 100) {
      toast.error('Giá trị voucher phải từ 0 đến 100');
      return false;
    }
    const soLuong = Number(formData.SoLuong);
    if (Number.isNaN(soLuong) || soLuong < 0) {
      toast.error('Số lượng voucher không được âm');
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const payload = {
      MaVoucher: formData.MaVoucher.trim().toUpperCase(),
      NoiDung: formData.NoiDung.trim(),
      GiaTri: Number(formData.GiaTri),
      SoLuong: Number(formData.SoLuong),
    };

    if (formData.NgayTao) {
      Object.assign(payload, { NgayTao: new Date(formData.NgayTao).toISOString() });
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const payload = buildPayload();
      if (editingVoucher) {
        await adminVouchersService.updateVoucher(editingVoucher._id, payload);
        toast.success('Cập nhật voucher thành công');
      } else {
        await adminVouchersService.createVoucher(payload);
        toast.success('Tạo voucher thành công');
      }
      closeDialog();
      fetchVouchers();
      fetchStats();
    } catch (error: any) {
      console.error('Error saving voucher:', error);
      const message = error?.response?.data?.message || 'Không thể lưu voucher';
      toast.error(message);
    }
  };

  const openDeleteDialog = (voucher: Voucher) => {
    setDeletingVoucher(voucher);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeletingVoucher(null);
    setIsDeleteDialogOpen(false);
  };

  const confirmDeleteVoucher = async () => {
    if (!deletingVoucher) return;
    try {
      await adminVouchersService.deleteVoucher(deletingVoucher._id);
      toast.success('Xóa voucher thành công');
      closeDeleteDialog();
      fetchVouchers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('Không thể xóa voucher');
    }
  };

  const changePage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  return {
    loading,
    vouchers,
    stats,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredCount,
    openDialog,
    closeDialog,
    isDialogOpen,
    editingVoucher,
    formData,
    updateFormData,
    handleSubmit,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deletingVoucher,
    confirmDeleteVoucher,
    changePage,
  };
};


