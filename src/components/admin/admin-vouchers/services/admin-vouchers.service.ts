import axiosInstance from '@/lib/api/axios';
import type { AdminUpdateVoucherPayload, AdminVoucherPayload, Voucher, VoucherStats } from '@/types/models';

export interface AdminVouchersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minGiaTri?: number;
  maxGiaTri?: number;
  minSoLuong?: number;
  maxSoLuong?: number;
}

const VOUCHERS_ENDPOINT = '/admin/vouchers';
const VOUCHER_STATS_ENDPOINT = '/admin/vouchers/stats';

const extractData = <T>(payload: unknown, fallbackKey?: string): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== 'object') return [];

  const normalized = (payload as Record<string, unknown>).data ?? payload;
  if (Array.isArray(normalized)) return normalized as T[];

  if (fallbackKey && typeof normalized === 'object' && normalized !== null) {
    const nested = (normalized as Record<string, unknown>)[fallbackKey];
    if (Array.isArray(nested)) return nested as T[];
  }

  return [];
};

const extractPagination = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return { totalPages: 1, total: 0 };
  const source = (payload as Record<string, unknown>).pagination ?? payload;
  return {
    totalPages: Number((source as Record<string, number>)?.totalPages ?? 1),
    total: Number((source as Record<string, number>)?.total ?? 0),
  };
};

const extractStats = (payload: unknown): VoucherStats | null => {
  if (!payload || typeof payload !== 'object') return null;
  if ('summary' in (payload as Record<string, unknown>)) {
    return payload as VoucherStats;
  }
  if ('data' in (payload as Record<string, unknown>)) {
    const data = (payload as Record<string, unknown>).data;
    if (data && typeof data === 'object' && 'summary' in (data as Record<string, unknown>)) {
      return data as VoucherStats;
    }
    if (data && typeof data === 'object' && 'stats' in (data as Record<string, unknown>)) {
      const stats = (data as Record<string, unknown>).stats;
      if (stats && typeof stats === 'object' && 'summary' in (stats as Record<string, unknown>)) {
        return stats as VoucherStats;
      }
    }
  }
  return null;
};

export const adminVouchersService = {
  async getVouchers(params: AdminVouchersQueryParams) {
    const response = await axiosInstance.get(VOUCHERS_ENDPOINT, { params });
    const payload = response.data;

    return {
      vouchers: extractData<Voucher>(payload),
      pagination: extractPagination(payload),
    };
  },

  async getVoucherStats() {
    const response = await axiosInstance.get(VOUCHER_STATS_ENDPOINT);
    return extractStats(response.data);
  },

  createVoucher(payload: AdminVoucherPayload) {
    return axiosInstance.post(VOUCHERS_ENDPOINT, payload);
  },

  updateVoucher(id: string, payload: AdminUpdateVoucherPayload) {
    return axiosInstance.put(`${VOUCHERS_ENDPOINT}/${id}`, payload);
  },

  deleteVoucher(id: string) {
    return axiosInstance.delete(`${VOUCHERS_ENDPOINT}/${id}`);
  },
};

export type { Voucher, VoucherStats };


