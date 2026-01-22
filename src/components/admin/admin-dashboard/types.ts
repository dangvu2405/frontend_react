import type { ChartItem, SummaryStats } from '@/types/models';

export interface AdminDashboardData {
  summaryStats: SummaryStats | null;
  topProjectsChart: ChartItem[];
  monthlyOrdersChart: ChartItem[];
  topCustomersChart: ChartItem[];
}

export interface AdminDashboardHookState extends AdminDashboardData {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}




