/**
 * Admin Wallets Hook
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/services/walletService';
import type {
  AdminWalletsFilters,
  AdminWalletFormState,
  AdminWalletsHookState,
  PaginationState,
} from '../types';
import type { Wallet, WalletTransaction, WalletStats, AdminWalletAdjustment } from '@/types/models/wallet';

const PAGE_SIZE = 10;

const INITIAL_FILTERS: AdminWalletsFilters = {
  search: '',
  isActive: 'all',
  minBalance: '',
  maxBalance: '',
};

const INITIAL_FORM_STATE: AdminWalletFormState = {
  adjustmentAmount: '',
  adjustmentType: 'add',
  reason: '',
  note: '',
};

export const useAdminWallets = (): AdminWalletsHookState => {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    pageSize: PAGE_SIZE,
  });
  const [filters, setFiltersState] = useState<AdminWalletsFilters>(INITIAL_FILTERS);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [adjustingWallet, setAdjustingWallet] = useState<Wallet | null>(null);
  const [lockingWallet, setLockingWallet] = useState<Wallet | null>(null);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [formData, setFormData] = useState<AdminWalletFormState>(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);

  const setFilters = useCallback((update: Partial<AdminWalletsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const { wallets: fetchedWallets, pagination: paginationData } = await walletService.getWallets({
        page: pagination.currentPage,
        limit: PAGE_SIZE,
        search: filters.search || undefined,
        isActive: filters.isActive === 'all' ? undefined : filters.isActive === 'active',
      });

      setWallets(fetchedWallets);
      if (paginationData) {
        const paginationDataRecord = paginationData as unknown as Record<string, unknown>;
        setPagination({
          currentPage: (paginationDataRecord.currentPage as number) || pagination.currentPage,
          totalPages: (paginationDataRecord.totalPages as number) || 1,
          total: (paginationDataRecord.total as number) || 0,
          pageSize: (paginationDataRecord.pageSize as number) || PAGE_SIZE,
        });
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Không thể tải danh sách ví');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters.search, filters.isActive]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await walletService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filteredWallets = useMemo(() => {
    let result = wallets;

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter((wallet) => {
        const customer = wallet.IdKhachHang as unknown as Record<string, unknown>;
        const customerName = String(customer?.HoTen || customer?.fullName || '');
        const customerEmail = String(customer?.Email || customer?.email || '');
        return customerName.toLowerCase().includes(query) || customerEmail.toLowerCase().includes(query);
      });
    }

    // Balance filter
    if (filters.minBalance) {
      const min = Number(filters.minBalance);
      if (!isNaN(min)) {
        result = result.filter((w) => w.balance >= min);
      }
    }
    if (filters.maxBalance) {
      const max = Number(filters.maxBalance);
      if (!isNaN(max)) {
        result = result.filter((w) => w.balance <= max);
      }
    }

    return result;
  }, [wallets, filters]);

  const openDetailDialog = useCallback((wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsDetailDialogOpen(true);
    refreshTransactions(wallet._id as string);
  }, []);

  const closeDetailDialog = useCallback(() => {
    setIsDetailDialogOpen(false);
    setSelectedWallet(null);
    setTransactions([]);
  }, []);

  const refreshTransactions = useCallback(async (customerId?: string) => {
    if (!selectedWallet && !customerId) return;

    try {
      setTransactionsLoading(true);
      const walletId = customerId || (selectedWallet?._id as string);
      if (!walletId) return;

      // Get customer ID from wallet
      const wallet = wallets.find((w) => w._id === walletId);
      if (!wallet) return;

      const customerIdStr = typeof wallet.IdKhachHang === 'string' 
        ? wallet.IdKhachHang 
        : String((wallet.IdKhachHang as unknown as Record<string, unknown>)?._id || '');

      if (!customerIdStr) return;

      const { transactions: txns } = await walletService.getCustomerTransactions(customerIdStr, {
        limit: 50,
      });
      setTransactions(txns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setTransactionsLoading(false);
    }
  }, [selectedWallet, wallets]);

  const openAdjustDialog = useCallback((wallet: Wallet) => {
    setAdjustingWallet(wallet);
    setFormData(INITIAL_FORM_STATE);
    setIsAdjustDialogOpen(true);
  }, []);

  const closeAdjustDialog = useCallback(() => {
    setIsAdjustDialogOpen(false);
    setAdjustingWallet(null);
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const updateFormData = useCallback((field: keyof AdminWalletFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAdjustBalance = useCallback(async () => {
    if (!adjustingWallet) return;

    const amount = Number(formData.adjustmentAmount);
    if (!amount || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Vui lòng nhập lý do điều chỉnh');
      return;
    }

    setSubmitting(true);
    try {
      const adjustment: AdminWalletAdjustment = {
        walletId: String(adjustingWallet._id),
        amount: formData.adjustmentType === 'add' ? amount : -amount,
        type: formData.adjustmentType,
        reason: formData.reason,
        note: formData.note || undefined,
      };

      await walletService.adjustBalance(adjustment);
      toast.success('Điều chỉnh số dư thành công');
      await fetchWallets();
      await fetchStats();
      closeAdjustDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi điều chỉnh số dư';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [adjustingWallet, formData, fetchWallets, fetchStats, closeAdjustDialog]);

  const openLockDialog = useCallback((wallet: Wallet) => {
    setLockingWallet(wallet);
    setIsLockDialogOpen(true);
  }, []);

  const closeLockDialog = useCallback(() => {
    setIsLockDialogOpen(false);
    setLockingWallet(null);
  }, []);

  const handleToggleLock = useCallback(async () => {
    if (!lockingWallet) return;

    setLocking(true);
    try {
      const newLockState = !lockingWallet.isActive;
      await walletService.toggleLock(String(lockingWallet._id), newLockState, 'Admin điều chỉnh');
      toast.success(newLockState ? 'Mở khóa ví thành công' : 'Khóa ví thành công');
      await fetchWallets();
      await fetchStats();
      closeLockDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(errorMessage);
    } finally {
      setLocking(false);
    }
  }, [lockingWallet, fetchWallets, fetchStats, closeLockDialog]);

  const changePage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  return {
    loading,
    wallets,
    stats,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredWallets,
    openDetailDialog,
    closeDetailDialog,
    isDetailDialogOpen,
    selectedWallet,
    transactions,
    transactionsLoading,
    refreshTransactions,
    openAdjustDialog,
    closeAdjustDialog,
    isAdjustDialogOpen,
    adjustingWallet,
    formData,
    updateFormData,
    handleAdjustBalance,
    submitting,
    openLockDialog,
    closeLockDialog,
    isLockDialogOpen,
    lockingWallet,
    handleToggleLock,
    locking,
    changePage,
  };
};
