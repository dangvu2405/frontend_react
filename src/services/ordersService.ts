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
  if (!payload) return payload as T;
  const payloadRecord = payload as Record<string, unknown>;
  if (payloadRecord.data !== undefined) return unwrap<T>(payloadRecord.data);
  return payload as T;
};

const ordersService = {
  async getOrders(params: OrderQuery = {}) {
    const response = await axiosInstance.get(ADMIN_ORDERS_ENDPOINT, { params });
    const data = unwrap<{ orders?: Order[]; pagination?: { totalPages?: number; total?: number } }>(response.data);
    const dataRecord = data as Record<string, unknown>;
    if (Array.isArray(dataRecord.orders)) {
      const orders = dataRecord.orders as Order[];
      return {
        orders,
        pagination: (dataRecord.pagination as { totalPages?: number; total?: number } | undefined) ?? { totalPages: 1, total: orders.length },
      };
    }
    if (Array.isArray(data)) {
      const orders = data as Order[];
      return { orders, pagination: { totalPages: 1, total: orders.length } };
    }
    return { orders: [], pagination: { totalPages: 1, total: 0 } };
  },

  async updateOrderStatus(orderId: string, status: Order['TrangThai']) {
    const response = await axiosInstance.patch(`${ADMIN_ORDERS_ENDPOINT}/${orderId}`, { status });
    return unwrap<Order>(response.data);
  },
};

export { ordersService };

