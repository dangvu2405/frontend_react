import axiosInstance from './axios';
import type { Order } from '@/types/models';

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

const ADMIN_ORDERS_ENDPOINT = '/admin/orders';

const unwrap = <T>(payload: unknown): T => {
  if (!payload) return payload;
  if (payload.data !== undefined) return unwrap<T>(payload.data);
  return payload as T;
};

const ordersService = {
  async getOrders(params: OrderQuery = {}) {
    const response = await axiosInstance.get(ADMIN_ORDERS_ENDPOINT, { params });
    const data = unwrap<{ orders?: Order[]; pagination?: { totalPages?: number; total?: number } }>(response.data);
    if (Array.isArray((data as Record<string, unknown>).orders)) {
      return {
        orders: (data as Record<string, unknown>).orders as Order[],
        pagination: (data as Record<string, unknown>).pagination ?? { totalPages: 1, total: (data as Record<string, unknown>).orders.length },
      };
    }
    if (Array.isArray(data as unknown as Order[])) {
      return { orders: data as unknown as Order[], pagination: { totalPages: 1, total: (data as unknown[]).length } };
    }
    return { orders: [], pagination: { totalPages: 1, total: 0 } };
  },

  async updateOrderStatus(orderId: string, status: Order['TrangThai']) {
    const response = await axiosInstance.patch(`${ADMIN_ORDERS_ENDPOINT}/${orderId}`, { status });
    return unwrap<Order>(response.data);
  },
};

export { ordersService };

