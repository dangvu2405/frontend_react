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
  onNewChatMessage: (listener: (data: NewChatMessageEvent) => void) => socketService.on('new-chat-message', listener),
  offNewChatMessage: (listener: (data: NewChatMessageEvent) => void) => socketService.off('new-chat-message', listener),
  onNewMessage: (listener: (message: NewMessageEvent) => void) => socketService.on('new-message', listener),
  offNewMessage: (listener: (message: NewMessageEvent) => void) => socketService.off('new-message', listener),
};




