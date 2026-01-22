/**
 * Wallet Service
 * Service để quản lý ví điện tử của khách hàng
 */

import axiosInstance from './axios';
import type {
  ApiItemResponse,
  ApiListResponse,
  Pagination,
} from '@/types/models';
import type {
  Wallet,
  WalletTransaction,
  DepositRequest,
  DepositResponse,
  WalletStats,
  AdminWalletAdjustment,
} from '@/types/models/wallet';

export const walletService = {
  /**
   * Lấy thông tin ví của khách hàng hiện tại
   */
  getMyWallet: async (): Promise<Wallet> => {
    try {
      const response = await axiosInstance.get<ApiItemResponse<Wallet>>('/wallet/me');
      const responseData = response.data as unknown as ApiItemResponse<Wallet>;
      if (responseData && 'data' in responseData && responseData.data) {
        return responseData.data as Wallet;
      }
      return responseData as unknown as Wallet;
    } catch (error: unknown) {
      // Handle 404 gracefully - API endpoint not implemented yet
      const errorRecord = error as Record<string, unknown>;
      const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
      
      if (status === 404) {
        if (import.meta.env.DEV) {
          console.warn('[walletService] API endpoint /wallet/me not implemented yet (404). Returning default wallet.');
        }
        // Return default wallet with zero balance
        return {
          _id: 'mock-wallet',
          IdKhachHang: '',
          balance: 0,
          totalDeposited: 0,
          totalSpent: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as Wallet;
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Lấy lịch sử giao dịch của ví
   */
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ transactions: WalletTransaction[]; pagination?: Pagination }> => {
    try {
      const response = await axiosInstance.get<ApiListResponse<WalletTransaction>>('/wallet/transactions', { params });
      const responseData = response.data as unknown as ApiListResponse<WalletTransaction>;
      
      let transactions: WalletTransaction[] = [];
      let pagination: Pagination | undefined = undefined;
      
      if (responseData && 'data' in responseData && responseData.data !== null && responseData.data !== undefined) {
        if (Array.isArray(responseData.data)) {
          transactions = responseData.data;
        } else if (typeof responseData.data === 'object' && 'transactions' in responseData.data) {
          transactions = (responseData.data as Record<string, unknown>).transactions as WalletTransaction[];
        }
        
        if ('pagination' in responseData) {
          pagination = responseData.pagination as Pagination;
        }
      }
      
      return { transactions, pagination };
    } catch (error: unknown) {
      // Handle 404 gracefully - API endpoint not implemented yet
      const errorRecord = error as Record<string, unknown>;
      const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
      
      if (status === 404) {
        if (import.meta.env.DEV) {
          console.warn('[walletService] API endpoint /wallet/transactions not implemented yet (404). Returning empty array.');
        }
        // Return empty array instead of throwing error
        return {
          transactions: [],
          pagination: undefined
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Nạp tiền vào ví
   */
  deposit: async (request: DepositRequest): Promise<DepositResponse> => {
    const response = await axiosInstance.post<ApiItemResponse<DepositResponse>>('/wallet/deposit', request);
    const responseData = response.data as unknown as ApiItemResponse<DepositResponse>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as DepositResponse;
    }
    return responseData as unknown as DepositResponse;
  },

  /**
   * Kiểm tra trạng thái giao dịch nạp tiền
   */
  checkDepositStatus: async (transactionId: string): Promise<WalletTransaction> => {
    const response = await axiosInstance.get<ApiItemResponse<WalletTransaction>>(`/wallet/transactions/${transactionId}`);
    const responseData = response.data as unknown as ApiItemResponse<WalletTransaction>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as WalletTransaction;
    }
    return responseData as unknown as WalletTransaction;
  },

  /**
   * Thanh toán đơn hàng bằng số dư ví
   */
  payWithWallet: async (orderId: string, amount: number): Promise<WalletTransaction> => {
    const response = await axiosInstance.post<ApiItemResponse<WalletTransaction>>('/wallet/pay', {
      orderId,
      amount,
    });
    const responseData = response.data as unknown as ApiItemResponse<WalletTransaction>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as WalletTransaction;
    }
    return responseData as unknown as WalletTransaction;
  },

  // ==========================
  // ADMIN FUNCTIONS
  // ==========================

  /**
   * Lấy danh sách ví (admin)
   */
  getWallets: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ wallets: Wallet[]; pagination?: Pagination }> => {
    const response = await axiosInstance.get<ApiListResponse<Wallet>>('/admin/wallets', { params });
    const responseData = response.data as unknown as ApiListResponse<Wallet>;
    
    let wallets: Wallet[] = [];
    let pagination: Pagination | undefined = undefined;
    
    if (responseData && 'data' in responseData && responseData.data !== null) {
      if (Array.isArray(responseData.data)) {
        wallets = responseData.data;
      } else if (typeof responseData.data === 'object' && 'wallets' in responseData.data) {
        wallets = (responseData.data as Record<string, unknown>).wallets as Wallet[];
      }
      
      if ('pagination' in responseData) {
        pagination = responseData.pagination as Pagination;
      }
    }
    
    return { wallets, pagination };
  },

  /**
   * Lấy thông tin ví của một khách hàng (admin)
   */
  getWalletByCustomerId: async (customerId: string): Promise<Wallet> => {
    const response = await axiosInstance.get<ApiItemResponse<Wallet>>(`/admin/wallets/customer/${customerId}`);
    const responseData = response.data as unknown as ApiItemResponse<Wallet>;
    if (responseData && 'data' in responseData && responseData.data !== null && responseData.data !== undefined) {
      return responseData.data;
    }
    return responseData as unknown as Wallet;
  },

  /**
   * Lấy lịch sử giao dịch của một khách hàng (admin)
   */
  getCustomerTransactions: async (
    customerId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
    }
  ): Promise<{ transactions: WalletTransaction[]; pagination?: Pagination }> => {
    const response = await axiosInstance.get<ApiListResponse<WalletTransaction>>(
      `/admin/wallets/customer/${customerId}/transactions`,
      { params }
    );
    const responseData = response.data as unknown as ApiListResponse<WalletTransaction>;
    
    let transactions: WalletTransaction[] = [];
    let pagination: Pagination | undefined = undefined;
    
    if (responseData && 'data' in responseData && responseData.data !== null && responseData.data !== undefined) {
      if (Array.isArray(responseData.data)) {
        transactions = responseData.data;
      } else if (typeof responseData.data === 'object' && 'transactions' in responseData.data) {
        transactions = (responseData.data as Record<string, unknown>).transactions as WalletTransaction[];
      }
      
      if ('pagination' in responseData) {
        pagination = responseData.pagination as Pagination;
      }
    }
    
    return { transactions, pagination };
  },

  /**
   * Điều chỉnh số dư ví (admin)
   */
  adjustBalance: async (adjustment: AdminWalletAdjustment): Promise<WalletTransaction> => {
    const response = await axiosInstance.post<ApiItemResponse<WalletTransaction>>('/admin/wallets/adjust', adjustment);
    const responseData = response.data as unknown as ApiItemResponse<WalletTransaction>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as WalletTransaction;
    }
    return responseData as unknown as WalletTransaction;
  },

  /**
   * Khóa/Mở khóa ví (admin)
   */
  toggleLock: async (walletId: string, lock: boolean, reason?: string): Promise<Wallet> => {
    const response = await axiosInstance.post<ApiItemResponse<Wallet>>(`/admin/wallets/${walletId}/lock`, {
      lock,
      reason,
    });
    const responseData = response.data as unknown as ApiItemResponse<Wallet>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as Wallet;
    }
    return responseData as unknown as Wallet;
  },

  /**
   * Lấy thống kê ví (admin)
   */
  getStats: async (): Promise<WalletStats> => {
    const response = await axiosInstance.get<ApiItemResponse<WalletStats>>('/admin/wallets/stats');
    const responseData = response.data as unknown as ApiItemResponse<WalletStats>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as WalletStats;
    }
    return responseData as unknown as WalletStats;
  },
};
