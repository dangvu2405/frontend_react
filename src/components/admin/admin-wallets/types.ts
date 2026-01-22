/**
 * Admin Wallets Types
 */

import type { Wallet, WalletTransaction, WalletStats, AdminWalletAdjustment } from '@/types/models/wallet';
import type { ChartItem } from '@/types/models';

export interface AdminWalletsFilters {
  search: string;
  isActive: 'all' | 'active' | 'locked';
  minBalance: string;
  maxBalance: string;
}

export interface AdminWalletFormState {
  adjustmentAmount: string;
  adjustmentType: 'add' | 'subtract';
  reason: string;
  note: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface AdminWalletsHookState {
  loading: boolean;
  wallets: Wallet[];
  stats: WalletStats | null;
  pagination: PaginationState;
  filters: AdminWalletsFilters;
  setFilters: (update: Partial<AdminWalletsFilters>) => void;
  resetFilters: () => void;
  filteredWallets: Wallet[];
  openDetailDialog: (wallet: Wallet) => void;
  closeDetailDialog: () => void;
  isDetailDialogOpen: boolean;
  selectedWallet: Wallet | null;
  transactions: WalletTransaction[];
  transactionsLoading: boolean;
  refreshTransactions: () => Promise<void>;
  openAdjustDialog: (wallet: Wallet) => void;
  closeAdjustDialog: () => void;
  isAdjustDialogOpen: boolean;
  adjustingWallet: Wallet | null;
  formData: AdminWalletFormState;
  updateFormData: (field: keyof AdminWalletFormState, value: string) => void;
  handleAdjustBalance: () => Promise<void>;
  submitting: boolean;
  openLockDialog: (wallet: Wallet) => void;
  closeLockDialog: () => void;
  isLockDialogOpen: boolean;
  lockingWallet: Wallet | null;
  handleToggleLock: () => Promise<void>;
  locking: boolean;
  changePage: (page: number) => void;
}
