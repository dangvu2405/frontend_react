import chatService from '@/services/chatService';
import socketService, { type NewChatMessageEvent, type NewMessageEvent } from '@/services/socketService';

export const adminChatService = {
  getChatRooms: () => chatService.getChatRooms(),
  getMessages: (chatRoomId: string) => chatService.getMessages(chatRoomId),
  markAsRead: (chatRoomId: string) => chatService.markAsRead(chatRoomId),
  assignAdmin: (chatRoomId: string) => chatService.assignAdmin(chatRoomId),
  closeChatRoom: (chatRoomId: string) => chatService.closeChatRoom(chatRoomId),
  deleteChatRoom: (chatRoomId: string) => chatService.deleteChatRoom(chatRoomId),
  connect: () => socketService.connect(),
  disconnect: () => socketService.disconnect(),
  joinRoom: (chatRoomId: string) => socketService.joinChatRoom(chatRoomId),
  sendMessage: (chatRoomId: string, message: string) => socketService.sendMessage(chatRoomId, message),
  onNewChatMessage: (listener: (data: NewChatMessageEvent) => void) => {
    const handler = (data: unknown) => listener(data as NewChatMessageEvent);
    socketService.on('new-chat-message', handler);
    return handler as unknown as (data: NewChatMessageEvent) => void;
  },
  offNewChatMessage: (handler: unknown) => {
    socketService.off('new-chat-message', handler as (data: unknown) => void);
  },
  onNewMessage: (listener: (message: NewMessageEvent) => void) => {
    const handler = (data: unknown) => listener(data as NewMessageEvent);
    socketService.on('new-message', handler);
    return handler as unknown as (message: NewMessageEvent) => void;
  },
  offNewMessage: (handler: unknown) => {
    socketService.off('new-message', handler as (data: unknown) => void);
  },
};




