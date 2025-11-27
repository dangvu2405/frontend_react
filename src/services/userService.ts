import axiosInstance from "./axios";
import type { 
  ApiItemResponse, 
  ApiListResponse, 
  Order, 
  User, 
  UserAddress,
  UpdateUserData,
  ChangePasswordData
} from "@/types/models";

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiItemResponse<User>>("/user/me");
    const responseData = response.data as unknown as ApiItemResponse<User>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as User;
    }
    return responseData as unknown as User;
  },

  updateProfile: async (data: UpdateUserData): Promise<User> => {
    const response = await axiosInstance.put<ApiItemResponse<User>>("/user/me", data);
    const responseData = response.data as unknown as ApiItemResponse<User>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as User;
    }
    return responseData as unknown as User;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await axiosInstance.post("/user/changepassword", data);
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("avatar", file);
    
    const response = await axiosInstance.post<ApiItemResponse<User>>("/user/uploadAvatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const responseData = response.data as unknown as ApiItemResponse<User>;
    if (responseData && 'data' in responseData && responseData.data) {
      return responseData.data as User;
    }
    return responseData as unknown as User;
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get<ApiItemResponse<{ donHang: Order[] }>>("/user/orderUser");
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { donHang: Order[] } }
    if (responseData && responseData.data) {
      if (typeof responseData.data === 'object' && 'donHang' in responseData.data) {
        const orders = (responseData.data as any).donHang;
        return Array.isArray(orders) ? orders : [];
      }
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
    }
    
    return [];
  },

  getAddresses: async (): Promise<UserAddress[]> => {
    const response = await axiosInstance.get<ApiListResponse<UserAddress>>("/user/address");
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { addresses } } hoặc { success, message, data: addresses[] }
    if (responseData && responseData.data) {
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
      if (typeof responseData.data === 'object' && 'addresses' in responseData.data) {
        return (responseData.data as any).addresses || [];
      }
    }
    
    return [];
  },
  
  createAddress: async (address: any): Promise<UserAddress> => {
    const response = await axiosInstance.post<ApiItemResponse<UserAddress>>("/user/address", address);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: address }
    if (responseData && responseData.data) {
      return responseData.data as UserAddress;
    }
    
    return responseData as unknown as UserAddress;
  },
  
  editAddress: async (id: string, address: any): Promise<UserAddress> => {
    const response = await axiosInstance.patch<ApiItemResponse<UserAddress>>(`/user/address/${id}`, address);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: address }
    if (responseData && responseData.data) {
      return responseData.data as UserAddress;
    }
    
    return responseData as unknown as UserAddress;
  },
  
  deleteAddress: async (id: string): Promise<void> => {
    await axiosInstance.delete<ApiItemResponse<void>>(`/user/address/${id}`);
  },

  setDefaultAddress: async (id: string): Promise<UserAddress[]> => {
    const response = await axiosInstance.patch<ApiItemResponse<UserAddress[]>>(`/user/address/${id}`, {
      address: { MacDinh: true },
    });
    const responseData = response.data;

    if (responseData?.data) {
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
      if ('DiaChi' in (responseData.data as any)) {
        return (responseData.data as any).DiaChi || [];
      }
    }

    return [];
  },
};

