import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Loader2, MoreVertical, Search, Send, Trash2, Clock, X, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';
import type { ChatRoom } from '@/types/models';
// import { EmptyState, LoadingState } from '@/shared/components';

import useAdminChat from '../hooks/useAdminChat';

const formatConversationTime = (date: string) => {
  const messageDate = new Date(date);
  if (isToday(messageDate)) return format(messageDate, 'HH:mm', { locale: vi });
  if (isYesterday(messageDate)) return 'Hôm qua';
  return format(messageDate, 'dd/MM', { locale: vi });
};

const formatMessageTime = (date: string) => {
  const messageDate = new Date(date);
  if (isToday(messageDate)) return format(messageDate, 'HH:mm', { locale: vi });
  if (isYesterday(messageDate)) return 'Hôm qua';
  return format(messageDate, 'dd/MM/yyyy', { locale: vi });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Đang hoạt động</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <Clock className="h-3 w-3" />
          <span>Chờ phản hồi</span>
        </div>
      );
    case 'closed':
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <X className="h-3 w-3" />
          <span>Đã đóng</span>
        </div>
      );
    default:
      return null;
  }
};

const AdminChatView = () => {
  const {
    chatRooms,
    filteredRooms,
    selectedRoom,
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
  } = useAdminChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const hasRooms = chatRooms.length > 0;

  const renderRoom = (room: ChatRoom) => {
    const isSelected = selectedRoom?._id === room._id;
    const unreadAdmin = room.UnreadCount?.admin ?? 0;
    const hasUnread = unreadAdmin > 0;
    return (
      <div
        key={room._id}
        className={cn(
          'group relative cursor-pointer border-b border-border p-3 transition-colors hover:bg-muted/50',
          isSelected && 'bg-primary/10',
        )}
        onClick={() => handleSelectRoom(room)}
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={room.CustomerId.AvatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {room.CustomerId.HoTen.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {room.Status === 'active' && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />}
            {hasUnread && !isSelected && (
              <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2 border-background bg-red-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <p className={cn('truncate text-sm font-semibold', hasUnread && !isSelected && 'font-bold')}>{room.CustomerId.HoTen}</p>
              {room.LastMessageAt && (
                <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">{formatConversationTime(room.LastMessageAt)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'flex-1 truncate text-sm',
                  hasUnread && !isSelected ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {room.LastMessage || 'Chưa có tin nhắn'}
              </p>
              {hasUnread && (
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {unreadAdmin > 9 ? '9+' : unreadAdmin}
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between">
              {getStatusBadge(room.Status)}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(event) => openDeleteDialog(room, event)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border bg-background">
      <div className="flex w-80 flex-col border-r bg-muted/30">
        <div className="border-b bg-background p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Đang tải cuộc trò chuyện...</p>
              </div>
            </div>
          ) : !hasRooms ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground mb-2" />
              <h3 className="font-semibold text-foreground">Chưa có cuộc trò chuyện nào</h3>
              <p className="text-sm text-muted-foreground">Khi có khách hàng nhắn tin, cuộc trò chuyện sẽ xuất hiện tại đây.</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="h-6 w-6 text-muted-foreground mb-2" />
              <h3 className="font-semibold text-foreground">Không tìm thấy cuộc trò chuyện</h3>
              <p className="text-sm text-muted-foreground">Kiểm tra lại từ khóa tìm kiếm hoặc thử cụm từ khác.</p>
            </div>
          ) : (
            filteredRooms.map(renderRoom)
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chat</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện với <strong>{roomToDelete?.CustomerId.HoTen}</strong>? Hành động này sẽ xóa toàn bộ tin nhắn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRoom} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-1 flex-col bg-background">
        {selectedRoom ? (
          <>
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRoom.CustomerId.AvatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {selectedRoom.CustomerId.HoTen.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedRoom.CustomerId.HoTen}</h3>
                  <p className="text-xs text-muted-foreground">{selectedRoom.CustomerId.Email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedRoom.Status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedRoom.Status !== 'closed' && (
                      <>
                        <DropdownMenuItem onClick={() => handleCloseRoom(selectedRoom)}>
                          <X className="mr-2 h-4 w-4" />
                          Đóng chat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={(event) => openDeleteDialog(selectedRoom, event)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Đang tải tin nhắn...</p>
                  </div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Send className="h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="font-semibold text-foreground">Chưa có tin nhắn nào</h3>
                  <p className="text-sm text-muted-foreground">Hãy bắt đầu cuộc trò chuyện với khách hàng.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMessages.map((message, index) => {
                    const isOwn = message.SenderType === 'admin';
                    const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
                    const currentTimestamp = message.createdAt
                      ? new Date(message.createdAt).getTime()
                      : Date.now();
                    const previousTimestamp =
                      prevMessage && prevMessage.createdAt
                        ? new Date(prevMessage.createdAt).getTime()
                        : 0;
                    const showTime =
                      !prevMessage || currentTimestamp - previousTimestamp > 300000;

                    return (
                      <div key={`${message._id}-${index}`}>
                        {showTime && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                              {formatMessageTime(message.createdAt ?? new Date().toISOString())}
                            </span>
                          </div>
                        )}
                        <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                          {!isOwn && <Avatar className="h-8 w-8" />}
                          <div
                            className={cn(
                              'max-w-[65%] rounded-2xl px-4 py-2',
                              isOwn ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-background',
                            )}
                          >
                            <p className={cn('text-sm', isOwn ? 'text-primary-foreground' : 'text-foreground')}>
                              {message.Message}
                            </p>
                            <p className={cn('mt-1 text-xs opacity-70', isOwn ? 'text-primary-foreground' : 'text-muted-foreground')}>
                              {format(new Date(message.createdAt ?? new Date().toISOString()), 'HH:mm', { locale: vi })}
                            </p>
                          </div>
                          {isOwn && (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {selectedRoom.Status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex items-end gap-2">
                  <Input
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Nhập tin nhắn..."
                    disabled={sending}
                    className="min-h-[44px] rounded-full border-border bg-muted/50 pr-12 focus:bg-background"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" className="h-11 w-11 rounded-full">
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center bg-muted/10">
            <Send className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Chọn một cuộc trò chuyện</h3>
            <p className="text-sm text-muted-foreground">Chọn cuộc trò chuyện ở cột bên trái để xem nội dung và trả lời khách hàng.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatView;




