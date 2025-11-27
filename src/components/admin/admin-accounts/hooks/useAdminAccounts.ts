import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { AdminUserPayload, Role, User } from '@/types/models';

import { adminAccountsService } from '../services/admin-accounts.service';
import type { AdminAccountFormState, AdminAccountsFilters, AdminAccountsHookState } from '../types';

const PAGE_SIZE = 10;

const INITIAL_FORM_STATE: AdminAccountFormState = {
  hoten: '',
  email: '',
  sdt: '',
  tenDangNhap: '',
  matKhau: '',
  trangThai: 'active',
  maVaiTro: '',
  gioiTinh: '',
  ngaySinh: '',
};

const INITIAL_FILTERS: AdminAccountsFilters = {
  search: '',
  roleId: 'all',
  status: 'all',
};

export const useAdminAccounts = (): AdminAccountsHookState => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleChart, setRoleChart] = useState<Array<{ name: string; count: number }>>([]);
  const [statusChart, setStatusChart] = useState<Array<{ name: string; count: number }>>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });

  const [filters, setFiltersState] = useState<AdminAccountsFilters>(INITIAL_FILTERS);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<AdminAccountFormState>(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  const rolesFetchedRef = useRef(false);

  const setFilters = (update: Partial<AdminAccountsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
    if (update.roleId !== undefined || update.status !== undefined || update.search !== undefined) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const resetFilters = () => {
    setFiltersState(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const fetchRoles = useCallback(async () => {
    if (rolesFetchedRef.current) return;
    try {
      rolesFetchedRef.current = true;
      const fetchedRoles = await adminAccountsService.getRoles();
      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
    } catch (error) {
      rolesFetchedRef.current = false;
      console.error('Error fetching roles:', error);
    }
  }, []);

  const buildParams = useCallback(() => {
    const params: Record<string, string | number> = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
    };
    if (filters.roleId !== 'all') params.roleId = filters.roleId;
    if (filters.status !== 'all') params.status = filters.status;
    return params;
  }, [filters.roleId, filters.status, pagination.currentPage, pagination.pageSize]);

  const updateCharts = useCallback(
    (data: User[], rolesData: Role[] = roles) => {
      const roleMap = new Map<string, number>();
      data.forEach((user) => {
        const roleId = typeof user.MaVaiTro === 'string' ? user.MaVaiTro : user.MaVaiTro?._id;
        const roleName = rolesData.find((role) => role._id === roleId)?.TenVaiTro ?? 'Chưa xác định';
        roleMap.set(roleName, (roleMap.get(roleName) || 0) + 1);
      });
      setRoleChart(Array.from(roleMap.entries()).map(([name, count]) => ({ name, count })));

      const statusMap = new Map<string, number>();
      data.forEach((user) => {
        const status = user.TrangThai === 'inactive' ? 'Đã khóa' : 'Đang hoạt động';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });
      setStatusChart(Array.from(statusMap.entries()).map(([name, count]) => ({ name, count })));
    },
    [roles],
  );

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const { users: list, pagination: pageInfo } = await adminAccountsService.getUsers(params);
      setUsers(list);
      setPagination((prev) => ({
        ...prev,
        totalPages: pageInfo.totalPages || 1,
        total: pageInfo.total || list.length,
      }));

      if (pagination.currentPage === 1) {
        const allUsers = await adminAccountsService.getAllUsers();
        updateCharts(allUsers);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Không thể tải dữ liệu tài khoản');
    } finally {
      setLoading(false);
    }
  }, [buildParams, pagination.currentPage, updateCharts]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setSelectedUsers(new Set());
    setIsSelectMode(false);
  }, [filters.roleId, filters.status, filters.search]);

  const filteredUsers = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.HoTen?.toLowerCase().includes(query) ||
        user.Email?.toLowerCase().includes(query) ||
        user.TenDangNhap?.toLowerCase().includes(query) ||
        user.SoDienThoai?.includes(query),
    );
  }, [filters.search, users]);

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => {
      if (prev) setSelectedUsers(new Set());
      return !prev;
    });
  };

  const toggleSelectAll = () => {
    setSelectedUsers((prev) => {
      if (prev.size === filteredUsers.length) return new Set();
      return new Set(filteredUsers.map((user) => user._id));
    });
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const buildPayload = (data: AdminAccountFormState, includeCredentials: boolean) => {
    const payload: Partial<AdminUserPayload & Record<string, unknown>> = {
      hoten: data.hoten?.trim(),
      email: data.email?.trim().toLowerCase(),
      sdt: data.sdt?.trim(),
      trangThai: data.trangThai,
      maVaiTro: data.maVaiTro,
      gioiTinh: data.gioiTinh,
      ngaySinh: data.ngaySinh,
    };
    if (includeCredentials) {
      payload.tenDangNhap = data.tenDangNhap?.trim();
      payload.matKhau = data.matKhau;
    } else {
      if (data.tenDangNhap?.trim()) payload.tenDangNhap = data.tenDangNhap.trim();
      if (data.matKhau?.trim()) payload.matKhau = data.matKhau;
    }
    return payload;
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData(INITIAL_FORM_STATE);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    const roleId = typeof user.MaVaiTro === 'string' ? user.MaVaiTro : user.MaVaiTro?._id ?? '';
    setFormData({
      hoten: user.HoTen || '',
      email: user.Email || '',
      sdt: user.SoDienThoai || '',
      tenDangNhap: user.TenDangNhap || '',
      matKhau: '',
      trangThai: user.TrangThai || 'active',
      maVaiTro: roleId,
      gioiTinh: user.GioiTinh || '',
      ngaySinh: user.NgaySinh ? new Date(user.NgaySinh).toISOString().split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData(INITIAL_FORM_STATE);
  };

  const validateForm = (data: AdminAccountFormState, isCreating: boolean) => {
    if (!data.hoten?.trim() || data.hoten.trim().length < 2 || data.hoten.trim().length > 100) {
      toast.error('Họ tên phải từ 2 đến 100 ký tự');
      return false;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!data.email?.trim() || !emailRegex.test(data.email.trim())) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (!data.maVaiTro) {
      toast.error('Vai trò là bắt buộc');
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (isCreating) {
      if (!data.tenDangNhap?.trim() || data.tenDangNhap.trim().length < 3 || data.tenDangNhap.trim().length > 50) {
        toast.error('Tên đăng nhập phải từ 3 đến 50 ký tự');
        return false;
      }
      if (!data.matKhau || data.matKhau.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        return false;
      }
      if (!data.sdt?.trim() || !phoneRegex.test(data.sdt.trim())) {
        toast.error('Số điện thoại phải có đúng 10 chữ số');
        return false;
      }
    } else {
      if (data.sdt?.trim() && !phoneRegex.test(data.sdt.trim())) {
        toast.error('Số điện thoại phải có đúng 10 chữ số');
        return false;
      }
      if (data.tenDangNhap?.trim() && (data.tenDangNhap.trim().length < 3 || data.tenDangNhap.trim().length > 50)) {
        toast.error('Tên đăng nhập phải từ 3 đến 50 ký tự');
        return false;
      }
      if (data.matKhau && data.matKhau.length > 0 && data.matKhau.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isCreating = !editingUser;
    if (!validateForm(formData, isCreating)) return;

    try {
      setSubmitting(true);
      const payload = buildPayload(formData, isCreating);
      if (editingUser) {
        if (!payload.matKhau) delete payload.matKhau;
        await adminAccountsService.updateUser(editingUser._id, payload);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await adminAccountsService.createUser(payload as AdminUserPayload);
        toast.success('Thêm tài khoản thành công');
      }
      closeDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error submitting user:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeletingUser(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await adminAccountsService.deleteUser(deletingUser._id);
      toast.success('Xóa tài khoản thành công');
      closeDeleteDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Không thể xóa tài khoản');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Vui lòng chọn ít nhất một tài khoản');
      return;
    }
    try {
      setSubmitting(true);
      await Promise.all(Array.from(selectedUsers).map((userId) => adminAccountsService.deleteUser(userId)));
      toast.success(`Đã xóa ${selectedUsers.size} tài khoản`);
      setSelectedUsers(new Set());
      setIsSelectMode(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Không thể xóa một số tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedUsers.size === 0) {
      toast.error('Vui lòng chọn ít nhất một tài khoản');
      return;
    }
    try {
      setSubmitting(true);
      await Promise.all(Array.from(selectedUsers).map((userId) => adminAccountsService.updateUser(userId, { trangThai: status })));
      toast.success(`Đã cập nhật trạng thái ${selectedUsers.size} tài khoản`);
      setSelectedUsers(new Set());
      setIsSelectMode(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('Không thể cập nhật một số tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) =>
    status === 'inactive'
      ? { className: 'bg-red-100 text-red-700', label: 'Đã khóa' }
      : { className: 'bg-green-100 text-green-700', label: 'Hoạt động' };

  const changePage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  return {
    loading,
    users,
    roles,
    roleChart,
    statusChart,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredUsers,
    isSelectMode,
    selectedUsers,
    toggleSelectMode,
    toggleSelectAll,
    toggleSelectUser,
    handleBulkDelete,
    handleBulkUpdateStatus,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    isDialogOpen,
    editingUser,
    formData,
    updateFormData: (field, value) => setFormData((prev) => ({ ...prev, [field]: value })),
    handleSubmit,
    submitting,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deletingUser,
    handleDelete,
    getStatusBadge,
    changePage,
  };
};


