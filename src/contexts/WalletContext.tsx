/**
 * Wallet Context
 * Context để quản lý state của ví điện tử
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { walletService } from '@/services/walletService';
import { toast } from 'sonner';
import type { Wallet, WalletTransaction } from '@/types/models/wallet';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  transactions: WalletTransaction[];
  transactionsLoading: boolean;
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated) {
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const walletData = await walletService.getMyWallet();
      setWallet(walletData);
    } catch (err) {
      const errorRecord = err as Record<string, unknown>;
      const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
      
      // Don't set error for 404 (API not implemented yet)
      if (status !== 404) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải thông tin ví';
        setError(errorMessage);
        console.error('Error fetching wallet:', err);
      } else if (import.meta.env.DEV) {
        console.warn('Wallet API not implemented yet (404). Using default wallet.');
      }
      
      // Set default wallet on 404
      if (status === 404) {
        setWallet({
          userId: '',
          balance: 0,
          locked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Wallet);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      setTransactions([]);
      return;
    }

    try {
      setTransactionsLoading(true);
      const { transactions: txns } = await walletService.getTransactions({ limit: 20 });
      setTransactions(txns);
    } catch (err) {
      const errorRecord = err as Record<string, unknown>;
      const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
      
      // Don't show error toast for 404 (API not implemented yet)
      if (status !== 404) {
        console.error('Error fetching transactions:', err);
        toast.error('Không thể tải lịch sử giao dịch');
      } else if (import.meta.env.DEV) {
        console.warn('Wallet transactions API not implemented yet (404). Showing empty list.');
      }
      
      // Set empty array on 404
      if (status === 404) {
        setTransactions([]);
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        loading,
        error,
        refreshWallet,
        transactions,
        transactionsLoading,
        refreshTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
