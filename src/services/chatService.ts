import axiosInstance from './axios';
import type { ApiItemResponse, ApiListResponse, ChatMessage, ChatRoom, Pagination } from '@/types/models';

const ensureItemSuccess = <T>(response: ApiItemResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.message || 'Chat service request failed');
  }
  return response.data as T;
};

const ensureListSuccess = <T>(response: ApiListResponse<T>): { data: T[]; pagination?: Pagination } => {
  if (!response.success) {
    return { data: [] };
  }
  return {
    data: response.data ?? [],
    pagination: response.pagination,
  };
};

const chatService = {
  // Get or create chat room for customer
  getOrCreateChatRoom: async (): Promise<ChatRoom> => {
    // ✅ Axios interceptor đã normalize response, nên response.data đã là ApiResponse format
    const response = await axiosInstance.get<ApiItemResponse<ChatRoom>>('/chat/room');
    const responseData = response.data;
    
    // ✅ Backend trả về: { success: true, data: ChatRoom }
    if (responseData && responseData.success && responseData.data) {
      return responseData.data as ChatRoom;
    }
    
    // ✅ Nếu không có success hoặc data, throw error
    throw new Error(responseData?.message || 'Chat service request failed');
  },

  // Get all chat rooms (admin only)
  getChatRooms: async (status?: string, page: number = 1, limit: number = 20): Promise<{
    data: ChatRoom[];
    pagination?: Pagination;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    // ✅ Axios interceptor đã normalize response
    const response = await axiosInstance.get<ApiListResponse<ChatRoom>>(`/chat/rooms?${params.toString()}`);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success: true, data: ChatRoom[], pagination: {...} }
    if (responseData && responseData.success) {
      return {
        data: Array.isArray(responseData.data) ? responseData.data : [],
        pagination: responseData.pagination
      };
    }
    
    return { data: [] };
  },

  // Get chat room by ID
  getChatRoomById: async (chatRoomId: string): Promise<ChatRoom> => {
    // ✅ Axios interceptor đã normalize response
    const response = await axiosInstance.get<ApiItemResponse<ChatRoom>>(`/chat/room/${chatRoomId}`);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success: true, data: ChatRoom }
    if (responseData && responseData.success && responseData.data) {
      return responseData.data as ChatRoom;
    }
    
    throw new Error(responseData?.message || 'Chat service request failed');
  },

  // Get messages for a chat room
  getMessages: async (
    chatRoomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: ChatMessage[];
    pagination?: Pagination;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    // ✅ Axios interceptor đã normalize response
    const response = await axiosInstance.get<ApiListResponse<ChatMessage>>(`/chat/room/${chatRoomId}/messages?${params.toString()}`);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success: true, data: ChatMessage[], pagination: {...} }
    if (responseData && responseData.success) {
      return {
        data: Array.isArray(responseData.data) ? responseData.data : [],
        pagination: responseData.pagination
      };
    }
    
    return { data: [] };
  },

  // Assign admin to chat room
  assignAdmin: async (chatRoomId: string): Promise<ChatRoom> => {
    // ✅ Axios interceptor đã normalize response
    const response = await axiosInstance.post<ApiItemResponse<ChatRoom>>(`/chat/room/${chatRoomId}/assign`);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success: true, data: ChatRoom }
    if (responseData && responseData.success && responseData.data) {
      return responseData.data as ChatRoom;
    }
    
    throw new Error(responseData?.message || 'Chat service request failed');
  },

  // Close chat room
  closeChatRoom: async (chatRoomId: string): Promise<void> => {
    await axiosInstance.post(`/chat/room/${chatRoomId}/close`);
  },

  // Mark messages as read
  markAsRead: async (chatRoomId: string): Promise<void> => {
    await axiosInstance.post(`/chat/room/${chatRoomId}/read`);
  },

  // Delete chat room
  deleteChatRoom: async (chatRoomId: string): Promise<void> => {
    await axiosInstance.delete(`/chat/room/${chatRoomId}`);
  },
};

export default chatService;

