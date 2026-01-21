import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { ChartItem, CustomerWithStats, Role } from '@/types/models';

import { adminCustomersService } from '../services/admin-customers.service';
import type {
  AdminCustomerFormState,
  AdminCustomersFilters,
  AdminCustomersHookState,
} from '../types';

const PAGE_SIZE = 10;

const INITIAL_FILTERS: AdminCustomersFilters = {
  search: '',
  status: 'all',
};

const INITIAL_FORM_STATE: AdminCustomerFormState = {
  hoten: '',
  email: '',
  sdt: '',
  gioiTinh: '',
  ngaySinh: '',
};

const getStatusLabel = (status: string) =>
  status === 'inactive'
    ? { className: 'bg-red-500 text-white', label: 'Đã khóa' }
    : { className: 'bg-green-500 text-white', label: 'Hoạt động' };

export const useAdminCustomers = (): AdminCustomersHookState => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [topCustomersChart, setTopCustomersChart] = useState<ChartItem[]>([]);
  const [statusChart, setStatusChart] = useState<ChartItem[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<AdminCustomersFilters>(INITIAL_FILTERS);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerWithStats | null>(null);
  const [lockingCustomer, setLockingCustomer] = useState<CustomerWithStats | null>(null);
  const [changingRoleCustomer, setChangingRoleCustomer] = useState<CustomerWithStats | null>(null);

  const [formData, setFormData] = useState<AdminCustomerFormState>(INITIAL_FORM_STATE);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rolesFetchedRef = useRef(false);

  const setFilters = useCallback((update: Partial<AdminCustomersFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...update };
      return next;
    });
    if (update.status !== undefined) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const updateCharts = useCallback((customersData: CustomerWithStats[]) => {
    const sortedCustomers = [...customersData]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 10)
      .map((customer) => ({
        name: customer.HoTen ? customer.HoTen.split(' ').slice(-1)[0] : 'N/A',
        count: customer.orderCount || 0,
        revenue: customer.totalRevenue || 0,
      }));

    setTopCustomersChart(sortedCustomers);

    const statusMap = new Map<string, ChartItem>();
    customersData.forEach((customer) => {
      const label = customer.TrangThai === 'inactive' ? 'Đã khóa' : 'Hoạt động';
      if (!statusMap.has(label)) {
        statusMap.set(label, { name: label, count: 0 });
      }
      statusMap.get(label)!.count = (statusMap.get(label)!.count ?? 0) + 1;
    });
    setStatusChart(Array.from(statusMap.values()));
  }, []);

  const fetchRoles = useCallback(async () => {
    if (rolesFetchedRef.current) return;
    try {
      const fetchedRoles = await adminCustomersService.getRoles();
      setRoles(fetchedRoles);
      rolesFetchedRef.current = true;
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Không thể tải danh sách role');
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { customers: list, pagination: pageInfo } = await adminCustomersService.getCustomers({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        status: filters.status === 'all' ? undefined : filters.status,
      });
      setCustomers(list);
      setPagination((prev) => ({
        ...prev,
        totalPages: pageInfo.totalPages || 1,
        total: pageInfo.total || list.length,
      }));

      const allCustomers = await adminCustomersService.getAllCustomers();
      updateCharts(allCustomers);
      await fetchRoles();
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Không thể tải dữ liệu khách hàng');
    } finally {
      setLoading(false);
    }
  }, [fetchRoles, filters.status, pagination.currentPage, pagination.pageSize, updateCharts]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const safeCustomers = Array.isArray(customers) ? customers : [];
    return safeCustomers.filter((customer) => {
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesSearch =
          customer.HoTen?.toLowerCase().includes(query) ||
          customer.Email?.toLowerCase().includes(query) ||
          customer.SoDienThoai?.includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.status !== 'all' && customer.TrangThai !== filters.status) {
        return false;
      }

      return true;
    });
  }, [customers, filters]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter((customer) => (customer.totalRevenue || 0) >= 50_000_000).length;
    const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalRevenue || 0), 0);
    const totalOrders = customers.reduce((sum, customer) => sum + (customer.orderCount || 0), 0);

    return { totalCustomers, vipCustomers, totalRevenue, totalOrders };
  }, [customers]);

  const openDetailDialog = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setIsDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedCustomer(null);
  };

  const openEditDialog = (customer: CustomerWithStats) => {
    setEditingCustomer(customer);
    setFormData({
      hoten: customer.HoTen || '',
      email: customer.Email || '',
      sdt: customer.SoDienThoai || '',
      gioiTinh: customer.GioiTinh || '',
      ngaySinh: customer.NgaySinh ? new Date(customer.NgaySinh).toISOString().split('T')[0] : '',
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingCustomer(null);
    setFormData(INITIAL_FORM_STATE);
  };

  const openDeleteDialog = (customer: CustomerWithStats) => {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeletingCustomer(null);
    setIsDeleteDialogOpen(false);
  };

  const openLockDialog = (customer: CustomerWithStats) => {
    setLockingCustomer(customer);
    setIsLockDialogOpen(true);
  };

  const closeLockDialog = () => {
    setLockingCustomer(null);
    setIsLockDialogOpen(false);
  };

  const openRoleDialog = (customer: CustomerWithStats) => {
    setChangingRoleCustomer(customer);
    const currentRoleId =
      typeof customer.MaVaiTro === 'object' ? customer.MaVaiTro?._id ?? '' : customer.MaVaiTro ?? '';
    setSelectedRoleId(currentRoleId);
    setIsRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setChangingRoleCustomer(null);
    setSelectedRoleId('');
    setIsRoleDialogOpen(false);
  };

  const updateFormData = (field: keyof AdminCustomerFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    try {
      setSubmitting(true);
      await adminCustomersService.updateCustomer(editingCustomer._id, formData);
      toast.success('Cập nhật khách hàng thành công');
      closeEditDialog();
      fetchCustomers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật khách hàng';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    try {
      setSubmitting(true);
      await adminCustomersService.deleteCustomer(deletingCustomer._id);
      toast.success('Đã xóa khách hàng');
      closeDeleteDialog();
      fetchCustomers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa khách hàng';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockCustomer = async () => {
    if (!lockingCustomer) return;
    try {
      setSubmitting(true);
      const isLocked = lockingCustomer.TrangThai === 'inactive';
      await adminCustomersService.lockCustomer(lockingCustomer._id, !isLocked);
      toast.success(isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      closeLockDialog();
      fetchCustomers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái tài khoản';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!changingRoleCustomer || !selectedRoleId) return;
    try {
      setSubmitting(true);
      await adminCustomersService.changeCustomerRole(changingRoleCustomer._id, selectedRoleId);
      toast.success('Đã đổi role thành công');
      closeRoleDialog();
      fetchCustomers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể đổi role';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const changePage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const getStatusBadgeProps = (status: string) => getStatusLabel(status);

  return {
    loading,
    customers,
    roles,
    topCustomersChart,
    statusChart,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredCustomers,
    openDetailDialog,
    closeDetailDialog,
    isDetailDialogOpen,
    selectedCustomer,
    openEditDialog,
    closeEditDialog,
    isEditDialogOpen,
    editingCustomer,
    formData,
    updateFormData,
    handleUpdateCustomer,
    submitting,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deletingCustomer,
    handleDeleteCustomer,
    openLockDialog,
    closeLockDialog,
    isLockDialogOpen,
    lockingCustomer,
    handleLockCustomer,
    openRoleDialog,
    closeRoleDialog,
    isRoleDialogOpen,
    changingRoleCustomer,
    selectedRoleId,
    setSelectedRoleId,
    handleChangeRole,
    getStatusBadgeProps,
    changePage,
    stats,
  };
};


