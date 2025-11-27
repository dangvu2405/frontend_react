import type { ChatMessage, ChatRoom } from '@/types/models';

export interface AdminChatState {
  chatRooms: ChatRoom[];
  filteredRooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  messages: ChatMessage[];
  loadingRooms: boolean;
  loadingMessages: boolean;
  sending: boolean;
  searchQuery: string;
  newMessage: string;
  deleteDialogOpen: boolean;
  roomToDelete: ChatRoom | null;
}

export interface AdminChatHookState extends AdminChatState {
  handleSearch: (value: string) => void;
  handleSelectRoom: (room: ChatRoom) => Promise<void>;
  handleSendMessage: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleCloseRoom: (room: ChatRoom) => Promise<void>;
  openDeleteDialog: (room: ChatRoom, event: React.MouseEvent) => void;
  closeDeleteDialog: () => void;
  confirmDeleteRoom: () => Promise<void>;
  filteredMessages: ChatMessage[];
  setNewMessage: (value: string) => void;
  setSearchQuery: (value: string) => void;
}




