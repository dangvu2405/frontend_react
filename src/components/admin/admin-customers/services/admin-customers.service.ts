import axiosInstance from '@/services/axios';
import type { CustomerWithStats, Role } from '@/types/models';
import type { AdminCustomerFormState } from '../types';

export interface AdminCustomersQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

const ADMIN_CUSTOMERS_ENDPOINT = '/admin/customers';
const ADMIN_ROLES_ENDPOINT = '/admin/roles';

const unwrap = <T>(payload: any): T => {
  if (!payload) return payload;
  if (payload.data !== undefined) return unwrap<T>(payload.data);
  return payload as T;
};

const adminCustomersService = {
  async getCustomers(params: AdminCustomersQuery) {
    const response = await axiosInstance.get(ADMIN_CUSTOMERS_ENDPOINT, { params });
    const data = unwrap<{
      customers?: CustomerWithStats[];
      pagination?: { totalPages?: number; total?: number };
    }>(response.data);

    if (Array.isArray((data as any).customers)) {
      return {
        customers: (data as any).customers as CustomerWithStats[],
        pagination: (data as any).pagination ?? { totalPages: 1, total: (data as any).customers.length },
      };
    }

    if (Array.isArray(data as unknown as CustomerWithStats[])) {
      return { customers: data as unknown as CustomerWithStats[], pagination: { totalPages: 1, total: (data as any[]).length } };
    }

    return { customers: [], pagination: { totalPages: 1, total: 0 } };
  },

  async getAllCustomers(limit = 1000) {
    const response = await axiosInstance.get(ADMIN_CUSTOMERS_ENDPOINT, {
      params: { page: 1, limit },
    });
    const data = unwrap<{ customers?: CustomerWithStats[] }>(response.data);
    if (Array.isArray((data as any).customers)) {
      return (data as any).customers as CustomerWithStats[];
    }
    if (Array.isArray(data as unknown as CustomerWithStats[])) {
      return data as unknown as CustomerWithStats[];
    }
    return [];
  },

  async getRoles(): Promise<Role[]> {
    const response = await axiosInstance.get(ADMIN_ROLES_ENDPOINT);
    const data = unwrap<{ roles?: Role[] }>(response.data);
    if (Array.isArray((data as any).roles)) {
      return (data as any).roles as Role[];
    }
    if (Array.isArray(data as unknown as Role[])) {
      return data as unknown as Role[];
    }
    return [];
  },

  async updateCustomer(customerId: string, payload: AdminCustomerFormState) {
    const response = await axiosInstance.put(`${ADMIN_CUSTOMERS_ENDPOINT}/${customerId}`, payload);
    return unwrap(response.data);
  },

  async deleteCustomer(customerId: string) {
    await axiosInstance.delete(`${ADMIN_CUSTOMERS_ENDPOINT}/${customerId}`);
  },

  async lockCustomer(customerId: string, lock: boolean) {
    await axiosInstance.post(`${ADMIN_CUSTOMERS_ENDPOINT}/${customerId}/${lock ? 'lock' : 'unlock'}`);
  },

  async changeCustomerRole(customerId: string, roleId: string) {
    await axiosInstance.post(`${ADMIN_CUSTOMERS_ENDPOINT}/${customerId}/role`, { roleId });
  },
};

export { adminCustomersService };

