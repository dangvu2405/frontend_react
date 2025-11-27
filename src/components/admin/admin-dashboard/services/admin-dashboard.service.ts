import adminService from '@/services/adminService';

export const adminDashboardService = {
  getSummaryStats: () => adminService.getSummaryStats(),
  getTopProducts: (params?: { limit?: number }) => adminService.getTopProducts(params),
  getMonthlyOrdersStats: (params?: { months?: number }) => adminService.getMonthlyOrdersStats(params),
  getTopCustomersByOrders: (params?: { limit?: number }) => adminService.getTopCustomersByOrders(params),
};




