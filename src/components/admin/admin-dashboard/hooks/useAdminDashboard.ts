import { useCallback, useEffect, useState } from 'react';

import type { ChartItem, SummaryStats } from '@/types/models';

import { adminDashboardService } from '../services/admin-dashboard.service';
import type { AdminDashboardHookState } from '../types';

const normalizeSummary = (payload: unknown): SummaryStats => ({
  totalProducts: Number((payload as Record<string, unknown>)?.totalProducts ?? 0),
  totalCategories: Number((payload as Record<string, unknown>)?.totalCategories ?? 0),
  totalUsers: Number((payload as Record<string, unknown>)?.totalUsers ?? 0),
  totalOrders: Number((payload as Record<string, unknown>)?.totalOrders ?? 0),
  totalRevenue: Number((payload as Record<string, unknown>)?.totalRevenue ?? 0),
});

const normalizeChart = (payload: unknown, valueMap: (...args: any[]) => ChartItem): ChartItem[] => {
  if (!payload) return [];
  const data = Array.isArray(payload) ? payload : Array.isArray((payload as any)?.data) ? (payload as any).data : [];
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => valueMap(item, index));
};

export const useAdminDashboard = (): AdminDashboardHookState => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [topProductsChart, setTopProductsChart] = useState<ChartItem[]>([]);
  const [monthlyOrdersChart, setMonthlyOrdersChart] = useState<ChartItem[]>([]);
  const [topCustomersChart, setTopCustomersChart] = useState<ChartItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, topProductsRes, monthlyOrdersRes, topCustomersRes] = await Promise.all([
        adminDashboardService.getSummaryStats(),
        adminDashboardService.getTopProducts({ limit: 8 }),
        adminDashboardService.getMonthlyOrdersStats({ months: 6 }),
        adminDashboardService.getTopCustomersByOrders({ limit: 6 }),
      ]);

      setSummaryStats(normalizeSummary((summaryRes as any)?.data ?? summaryRes));

      setTopProductsChart(
        normalizeChart(topProductsRes, (product) => ({
          name: product?.TenSanPham ?? 'Không tên',
          sold: Number(product?.DaBan ?? 0),
          revenue:
            typeof product?.Gia === 'number' && typeof product?.DaBan === 'number'
              ? product.Gia * product.DaBan
              : undefined,
        })),
      );

      setMonthlyOrdersChart(
        normalizeChart(monthlyOrdersRes, (item) => ({
          name:
            item?.month && item?.year
              ? `Tháng ${String(item.month).padStart(2, '0')}/${item.year}`
              : 'Không xác định',
          sold: Number(item?.totalOrders ?? 0),
          revenue: Number(item?.totalRevenue ?? 0),
        })),
      );

      setTopCustomersChart(
        normalizeChart(topCustomersRes, (customer, index) => ({
          name: customer?.name || customer?.email || `Khách hàng ${index + 1}`,
          sold: Number(customer?.orderCount ?? 0),
          revenue: Number(customer?.totalRevenue ?? 0),
        })),
      );
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu admin:', err);
      setError((err as Error)?.message ?? 'Không thể tải dữ liệu admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    summaryStats,
    topProductsChart,
    monthlyOrdersChart,
    topCustomersChart,
    refresh: fetchData,
  };
};

export default useAdminDashboard;




