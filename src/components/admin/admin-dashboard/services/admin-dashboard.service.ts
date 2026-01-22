import adminService from '@/services/adminService';

export const adminDashboardService = {
  getSummaryStats: () => adminService.getSummaryStats(),
  getTopProjects: (params?: { limit?: number }) => adminService.getTopProjects(params),
  getMonthlyOrdersStats: (params?: { months?: number }) => adminService.getMonthlyOrdersStats(params),
  getTopCustomersByOrders: (params?: { limit?: number }) => adminService.getTopCustomersByOrders(params),
};




