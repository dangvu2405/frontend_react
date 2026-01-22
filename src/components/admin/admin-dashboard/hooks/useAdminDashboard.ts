import { useCallback, useEffect, useState } from 'react';

import type { ChartItem, SummaryStats } from '@/types/models';

import { adminDashboardService } from '../services/admin-dashboard.service';
import type { AdminDashboardHookState } from '../types';

const normalizeSummary = (payload: unknown): SummaryStats => ({
  totalProjects: Number((payload as Record<string, unknown>)?.totalProjects ?? 0),
  totalCategories: Number((payload as Record<string, unknown>)?.totalCategories ?? 0),
  totalUsers: Number((payload as Record<string, unknown>)?.totalUsers ?? 0),
  totalOrders: Number((payload as Record<string, unknown>)?.totalOrders ?? 0),
  totalRevenue: Number((payload as Record<string, unknown>)?.totalRevenue ?? 0),
});

const normalizeChart = (payload: unknown, valueMap: (...args: unknown[]) => ChartItem): ChartItem[] => {
  if (!payload) return [];
  const data = Array.isArray(payload) ? payload : Array.isArray((payload as Record<string, unknown>)?.data) ? (payload as Record<string, unknown>).data : [];
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => valueMap(item, index));
};

export const useAdminDashboard = (): AdminDashboardHookState => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [topProjectsChart, setTopProjectsChart] = useState<ChartItem[]>([]);
  const [monthlyOrdersChart, setMonthlyOrdersChart] = useState<ChartItem[]>([]);
  const [topCustomersChart, setTopCustomersChart] = useState<ChartItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, topProjectsRes, monthlyOrdersRes, topCustomersRes] = await Promise.all([
        adminDashboardService.getSummaryStats(),
        adminDashboardService.getTopProjects({ limit: 8 }),
        adminDashboardService.getMonthlyOrdersStats({ months: 6 }),
        adminDashboardService.getTopCustomersByOrders({ limit: 6 }),
      ]);

      setSummaryStats(normalizeSummary((summaryRes as unknown as Record<string, unknown>)?.data ?? summaryRes));

      setTopProjectsChart(
        normalizeChart(topProjectsRes, (project) => {
          const projectRecord = project as Record<string, unknown>;
          return {
            name: String(projectRecord?.TenSanPham ?? 'Không tên'),
            sold: Number(projectRecord?.DaBan ?? 0),
            revenue:
              typeof projectRecord?.Gia === 'number' && typeof projectRecord?.DaBan === 'number'
                ? projectRecord.Gia * projectRecord.DaBan
                : undefined,
          };
        }),
      );

      setMonthlyOrdersChart(
        normalizeChart(monthlyOrdersRes, (item) => {
          const itemRecord = item as Record<string, unknown>;
          return {
            name:
              itemRecord?.month && itemRecord?.year
                ? `Tháng ${String(itemRecord.month).padStart(2, '0')}/${itemRecord.year}`
                : 'Không xác định',
            sold: Number(itemRecord?.totalOrders ?? 0),
            revenue: Number(itemRecord?.totalRevenue ?? 0),
          };
        }),
      );

      setTopCustomersChart(
        normalizeChart(topCustomersRes, (customer, index) => {
          const customerRecord = customer as Record<string, unknown>;
          return {
            name: String(customerRecord?.name || customerRecord?.email || `Khách hàng ${Number(index) + 1}`),
            sold: Number(customerRecord?.orderCount ?? 0),
            revenue: Number(customerRecord?.totalRevenue ?? 0),
          };
        }),
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
    topProjectsChart,
    monthlyOrdersChart,
    topCustomersChart,
    refresh: fetchData,
  };
};

export default useAdminDashboard;




