import axiosInstance from './axios';
import type {
  AdminProductPayload,
  AdminCategoryPayload,
  AdminRolePayload,
  AdminUserPayload,
  AdminInventoryPayload,
  AdminVoucherPayload,
  AdminUpdateVoucherPayload
} from '@/types/models';

const adminService = {
  // ==========================
  // PRODUCTS
  // ==========================
  createProduct: (payload: AdminProductPayload) =>
    axiosInstance.post('/admin/products', payload),

  getProducts: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/products', { params }),

  getProductById: (id: string) => axiosInstance.get(`/admin/products/${id}`),

  updateProduct: (id: string, payload: AdminProductPayload) =>
    axiosInstance.put(`/admin/products/${id}`, payload),

  deleteProduct: (id: string) => axiosInstance.delete(`/admin/products/${id}`),

  // ==========================
  // CATEGORIES
  // ==========================
  createCategory: (payload: AdminCategoryPayload) =>
    axiosInstance.post('/admin/categories', payload),

  getCategories: () => axiosInstance.get('/admin/categories'),

  getCategoryById: (id: string) => axiosInstance.get(`/admin/categories/${id}`),

  updateCategory: (id: string, payload: AdminCategoryPayload) =>
    axiosInstance.put(`/admin/categories/${id}`, payload),

  deleteCategory: (id: string) => axiosInstance.delete(`/admin/categories/${id}`),

  // ==========================
  // ROLES
  // ==========================
  createRole: (payload: AdminRolePayload) =>
    axiosInstance.post('/admin/roles', payload),

  getRoles: () => axiosInstance.get('/admin/roles'),

  getRoleById: (id: string) => axiosInstance.get(`/admin/roles/${id}`),

  updateRole: (id: string, payload: AdminRolePayload) =>
    axiosInstance.put(`/admin/roles/${id}`, payload),

  deleteRole: (id: string) => axiosInstance.delete(`/admin/roles/${id}`),

  // ==========================
  // USERS (self profile functions)
  // ==========================
  getUsers: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/users', { params }),

  createUser: (payload: AdminUserPayload) =>
    axiosInstance.post('/admin/users', payload),

  updateUser: (id: string, payload: AdminUserPayload) =>
    axiosInstance.put(`/admin/users/${id}`, payload),
  deleteUser: (id: string) => axiosInstance.delete(`/admin/users/${id}`),


  // ==========================
  // CUSTOMERS (only Customer role accounts)
  // ==========================
  getCustomers: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/customers', { params }),

  updateCustomer: (id: string, payload: any) =>
    axiosInstance.put(`/admin/customers/${id}`, payload),

  deleteCustomer: (id: string) =>
    axiosInstance.delete(`/admin/customers/${id}`),

  lockCustomer: (id: string, lock: boolean) =>
    axiosInstance.post(`/admin/customers/${id}/lock`, { lock }),

  changeCustomerRole: (id: string, roleId: string) =>
    axiosInstance.post(`/admin/customers/${id}/change-role`, { maVaiTro: roleId }),




  // ==========================
  // ORDERS
  // ==========================
  createOrder: (payload: any) =>
    axiosInstance.post('/admin/orders', payload),

  getOrders: (params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }) =>
    axiosInstance.get('/admin/orders', { params }),

  getOrderById: (id: string) => axiosInstance.get(`/admin/orders/${id}`),

  updateOrder: (id: string, payload: any) =>
    axiosInstance.put(`/admin/orders/${id}`, payload),

  deleteOrder: (id: string) => axiosInstance.delete(`/admin/orders/${id}`),

  cancelOrder: (id: string) =>
    axiosInstance.post(`/admin/orders/${id}/cancel`, {}),

  checkout: (payload: any) =>
    axiosInstance.post('/admin/orders/checkout', payload),

  // ==========================
  // CART
  // ==========================
  addToCart: (payload: any) =>
    axiosInstance.post('/admin/cart/items', payload),

  getCart: () => axiosInstance.get('/admin/cart'),

  updateCartItem: (id: string, payload: any) =>
    axiosInstance.put(`/admin/cart/items/${id}`, payload),

  deleteCartItem: (id: string) =>
    axiosInstance.delete(`/admin/cart/items/${id}`),

  clearCart: () => axiosInstance.delete('/admin/cart'),

  // ==========================
  // INVENTORY
  // ==========================
  getInventory: (params?: { min?: number; max?: number; categoryId?: string }) =>
    axiosInstance.get('/admin/inventory', { params }),

  getInventoryItem: (id: string) =>
    axiosInstance.get(`/admin/inventory/${id}`),

  increaseStock: (id: string, payload: AdminInventoryPayload) =>
    axiosInstance.post(`/admin/inventory/${id}/increase`, payload),

  decreaseStock: (id: string, payload: AdminInventoryPayload) =>
    axiosInstance.post(`/admin/inventory/${id}/decrease`, payload),

  setStock: (id: string, payload: AdminInventoryPayload) =>
    axiosInstance.put(`/admin/inventory/${id}`, payload),

  clearStock: (id: string) =>
    axiosInstance.delete(`/admin/inventory/${id}`),

  // ==========================
  // DASHBOARD / STATS
  // ==========================
  getSummaryStats: () => axiosInstance.get('/admin/stats/summary'),

  getRevenueStats: (params?: { startDate?: string; endDate?: string }) =>
    axiosInstance.get('/admin/stats/revenue', { params }),

  getTopProducts: (params?: { limit?: number }) =>
    axiosInstance.get('/admin/stats/top-products', { params }),

  getLowStockProducts: (params?: { threshold?: number }) =>
    axiosInstance.get('/admin/stats/low-stock', { params }),

  getMonthlyOrdersStats: (params?: { months?: number }) =>
    axiosInstance.get('/admin/stats/monthly-orders', { params }),

  getTopCustomersByOrders: (params?: { limit?: number }) =>
    axiosInstance.get('/admin/stats/top-customers', { params }),

  // ==========================
  // REVIEWS (ĐÁNH GIÁ)
  // ==========================
  getReviews: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    productId?: string;
    customerId?: string;
    minRating?: number;
    maxRating?: number;
  }) => axiosInstance.get('/admin/reviews', { params }),

  getReviewById: (id: string) => axiosInstance.get(`/admin/reviews/${id}`),

  deleteReview: (id: string) => axiosInstance.delete(`/admin/reviews/${id}`),

  deleteMultipleReviews: (reviewIds: string[]) =>
    axiosInstance.delete('/admin/reviews', { data: { reviewIds } }),

  getReviewStats: () => axiosInstance.get('/admin/reviews/stats'),

  // ==========================
  // VOUCHERS (MÃ GIẢM GIÁ)
  // ==========================
  createVoucher: (payload: AdminVoucherPayload) => axiosInstance.post('/admin/vouchers', payload),

  getVouchers: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    minGiaTri?: number;
    maxGiaTri?: number;
    minSoLuong?: number;
    maxSoLuong?: number;
  }) => axiosInstance.get('/admin/vouchers', { params }),

  getVoucherById: (id: string) => axiosInstance.get(`/admin/vouchers/${id}`),

  updateVoucher: (id: string, payload: AdminUpdateVoucherPayload) => axiosInstance.put(`/admin/vouchers/${id}`, payload),

  deleteVoucher: (id: string) => axiosInstance.delete(`/admin/vouchers/${id}`),

  getVoucherStats: () => axiosInstance.get('/admin/vouchers/stats'),
};

export default adminService;
export type {
  AdminProductPayload,
  AdminProductVolumeOptionPayload,
  AdminCategoryPayload,
  AdminRolePayload,
  AdminUserPayload,
  AdminInventoryPayload,
  AdminVoucherPayload,
  AdminUpdateVoucherPayload,
} from '@/types/models';

