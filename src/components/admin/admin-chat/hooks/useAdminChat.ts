import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { ChatMessage, ChatRoom } from '@/types/models';

import { adminChatService } from '../services/admin-chat.service';
import type { AdminChatHookState } from '../types';

const getUnreadCounts = (room: ChatRoom) => ({
  customer: room.UnreadCount?.customer ?? 0,
  admin: room.UnreadCount?.admin ?? 0,
});

const useAdminChat = (): AdminChatHookState => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ChatRoom | null>(null);

  const filteredRooms = useMemo(
    () =>
      chatRooms.filter(
        (room) =>
          room.CustomerId.HoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.CustomerId.Email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [chatRooms, searchQuery],
  );

  const filteredMessages = useMemo(() => messages, [messages]);

  const loadChatRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const { data } = await adminChatService.getChatRooms();
      setChatRooms(data);
      if (!selectedRoom && data.length > 0) {
        setSelectedRoom(data[0]);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedRoom]);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      setLoadingMessages(true);
      const { data } = await adminChatService.getMessages(roomId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const markRoomAsRead = useCallback((roomId: string) => {
    adminChatService.markAsRead(roomId);
    setChatRooms((prev) =>
      prev.map((room) =>
        room._id === roomId ? { ...room, UnreadCount: { ...getUnreadCounts(room), admin: 0 } } : room,
      ),
    );
  }, []);

  useEffect(() => {
    loadChatRooms();
    adminChatService.connect();
    return () => {
      adminChatService.disconnect();
    };
  }, [loadChatRooms]);

  useEffect(() => {
    const handleNewChatMessage = (data: Record<string, unknown>) => {
      const currentRoomId = selectedRoom?._id;
      const isCurrentRoom = currentRoomId === (data.chatRoomId as string);
      const isFromCustomer = data.message.SenderType === 'customer';

      setChatRooms((prev) =>
        prev.map((room) =>
          room._id === data.chatRoomId
            ? {
                ...room,
                UnreadCount: {
                  ...getUnreadCounts(room),
                  admin:
                    typeof data.unreadCount === 'number'
                      ? data.unreadCount
                      : data.unreadCount?.admin ?? getUnreadCounts(room).admin,
                  customer:
                    typeof data.unreadCount === 'object' && data.unreadCount?.customer !== undefined
                      ? data.unreadCount.customer
                      : getUnreadCounts(room).customer,
                },
                LastMessage: data.message.Message,
                LastMessageAt: data.message.createdAt,
              }
            : room,
        ),
      );

      if (isFromCustomer && !isCurrentRoom) {
        const room = chatRooms.find((r) => r._id === data.chatRoomId);
        if (room) {
          toast.info(`Bạn có tin nhắn mới từ ${room.CustomerId.HoTen}`, {
            description:
              data.message.Message.length > 50
                ? `${data.message.Message.substring(0, 50)}...`
                : data.message.Message,
            duration: 5000,
          });
        }
      }

      if (isCurrentRoom) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id === data.message._id ||
              (msg.Message === data.message.Message &&
                msg.createdAt === data.message.createdAt &&
                msg.SenderType === data.message.SenderType),
          );
          if (exists) return prev;
          return [...prev, data.message];
        });
        markRoomAsRead(data.chatRoomId);
      }
    };

    const handleNewMessage = (message: Record<string, unknown>) => {
      const currentRoomId = selectedRoom?._id;
      if (currentRoomId === (message.ChatRoomId as string)) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id === message._id ||
              (msg.Message === message.Message &&
                msg.createdAt === message.createdAt &&
                msg.SenderType === message.SenderType),
          );
          if (exists) return prev;
          return [...prev, message];
        });
        markRoomAsRead(message.ChatRoomId);
      }
    };

    adminChatService.onNewChatMessage(handleNewChatMessage);
    adminChatService.onNewMessage(handleNewMessage);

    return () => {
      adminChatService.offNewChatMessage(handleNewChatMessage);
      adminChatService.offNewMessage(handleNewMessage);
    };
  }, [chatRooms, markRoomAsRead, selectedRoom?._id]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom._id);
      adminChatService.joinRoom(selectedRoom._id);
      markRoomAsRead(selectedRoom._id);
    }
  }, [loadMessages, markRoomAsRead, selectedRoom]);

  const handleSearch = (value: string) => setSearchQuery(value);

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    if (!room.AdminId && room.Status === 'pending') {
      try {
        const updatedRoom = await adminChatService.assignAdmin(room._id);
        setChatRooms((prev) => prev.map((r) => (r._id === room._id ? updatedRoom : r)));
        setSelectedRoom(updatedRoom);
      } catch (error) {
        console.error('Error assigning admin:', error);
      }
    }
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessage.trim() || !selectedRoom || sending) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    try {
      setSending(true);
      adminChatService.sendMessage(selectedRoom._id, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleCloseRoom = async (room: ChatRoom) => {
    if (!window.confirm('Bạn có chắc muốn đóng chat room này?')) return;
    try {
      await adminChatService.closeChatRoom(room._id);
      setChatRooms((prev) =>
        prev.map((r) => (r._id === room._id ? { ...r, Status: 'closed' as const } : r)),
      );
      if (selectedRoom?._id === room._id) {
        setSelectedRoom(null);
        setMessages([]);
      }
      toast.success('Đã đóng chat room');
    } catch (error) {
      console.error('Error closing room:', error);
      toast.error('Không thể đóng chat room');
    }
  };

  const openDeleteDialog = (room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation();
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await adminChatService.deleteChatRoom(roomToDelete._id);
      setChatRooms((prev) => prev.filter((r) => r._id !== roomToDelete._id));
      if (selectedRoom?._id === roomToDelete._id) {
        setSelectedRoom(null);
        setMessages([]);
      }
      closeDeleteDialog();
      toast.success('Đã xóa chat room');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Không thể xóa chat room');
    }
  };

  return {
    chatRooms,
    filteredRooms,
    selectedRoom,
    messages,
    loadingRooms,
    loadingMessages,
    sending,
    searchQuery,
    newMessage,
    deleteDialogOpen,
    roomToDelete,
    handleSearch,
    handleSelectRoom,
    handleSendMessage,
    handleCloseRoom,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteRoom,
    filteredMessages,
    setNewMessage,
    setSearchQuery,
  };
};

export default useAdminChat;


