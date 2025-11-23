/**
 * Chat models
 * Định nghĩa các types liên quan đến chat/customer support
 */

import type { BaseDocument, ObjectId } from './common';
import type { User } from './user';

/**
 * ChatRoom - Phòng chat giữa khách hàng và admin
 */
export interface ChatRoom extends BaseDocument {
  CustomerId: User;                    // ID khách hàng
  AdminId?: User | null;               // ID admin (null nếu chưa được assign)
  Status: 'active' | 'closed' | 'pending'; // Trạng thái phòng chat
  LastMessage?: string | null;         // Tin nhắn cuối cùng
  LastMessageAt?: string | null;       // Thời gian tin nhắn cuối
  UnreadCount?: {                      // Số tin nhắn chưa đọc
    customer: number;                  // Số tin nhắn chưa đọc của khách hàng
    admin: number;                     // Số tin nhắn chưa đọc của admin
  };
}

/**
 * ChatMessage - Tin nhắn trong phòng chat
 */
export interface ChatMessage extends BaseDocument {
  ChatRoomId: ObjectId;                // ID phòng chat
  SenderId: User;                      // ID người gửi
  SenderType: 'customer' | 'admin';    // Loại người gửi
  Message: string;                     // Nội dung tin nhắn
  IsRead: boolean;                     // Đã đọc hay chưa
  ReadAt?: string | null;               // Thời gian đọc
}


