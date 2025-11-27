import axiosInstance from '@/lib/api/axios';
import type { AdminUserPayload, Role, User } from '@/types/models';

export interface AdminAccountsQueryParams {
  page?: number;
  limit?: number;
  roleId?: string;
  status?: string;
}

const USERS_ENDPOINT = '/admin/users';
const ROLES_ENDPOINT = '/admin/roles';

const extractArray = <T>(payload: unknown, nestedKey?: string): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== 'object') return [];

  const data = (payload as Record<string, unknown>).data ?? payload;
  if (Array.isArray(data)) return data as T[];

  if (nestedKey && data && typeof data === 'object' && nestedKey in (data as Record<string, unknown>)) {
    const nested = (data as Record<string, unknown>)[nestedKey];
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

export const adminAccountsService = {
  async getUsers(params: AdminAccountsQueryParams) {
    const response = await axiosInstance.get(USERS_ENDPOINT, { params });
    const payload = response.data;

    return {
      users: extractArray<User>(payload),
      pagination: extractPagination(payload),
    };
  },

  async getAllUsers(limit = 1000) {
    const response = await axiosInstance.get(USERS_ENDPOINT, { params: { page: 1, limit } });
    return extractArray<User>(response.data);
  },

  async getRoles() {
    const response = await axiosInstance.get(ROLES_ENDPOINT);
    const payload = response.data;
    if (payload?.data?.roles && Array.isArray(payload.data.roles)) {
      return payload.data.roles as Role[];
    }
    return extractArray<Role>(payload, 'roles');
  },

  createUser(payload: AdminUserPayload & Record<string, unknown>) {
    return axiosInstance.post(USERS_ENDPOINT, payload);
  },

  updateUser(id: string, payload: Partial<AdminUserPayload> & Record<string, unknown>) {
    return axiosInstance.put(`${USERS_ENDPOINT}/${id}`, payload);
  },

  deleteUser(id: string) {
    return axiosInstance.delete(`${USERS_ENDPOINT}/${id}`);
  },
};

export type { Role, User };




