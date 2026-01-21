import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import chatService from '@/services/chatService';
import { chatbotService } from '@/services/chatbotService';
import type { ChatMessage, ChatRoom } from '@/types/models';
import socketService, { type NewMessageEvent } from '@/services/socketService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BotMessage {
  _id: string;
  Message: string;
  SenderType: 'bot' | 'user';
  createdAt: string;
  suggestions?: string[];
}

export default function CustomerChat() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'bot' | 'human'>('bot'); // 'bot' hoặc 'human'
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<(ChatMessage | BotMessage)[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [connectingToHuman, setConnectingToHuman] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chatbot khi mở chat
  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    // Reset về bot mode khi mở chat mới
    if (chatMode === 'bot') {
      const welcomeMessage = chatbotService.getWelcomeMessage();
      const botMsg: BotMessage = {
        _id: `bot-${Date.now()}`,
        Message: welcomeMessage.message,
        SenderType: 'bot',
        createdAt: new Date().toISOString(),
        suggestions: welcomeMessage.suggestions,
      };
      setMessages([botMsg]);
      setChatRoom(null);
    }
  }, [isAuthenticated, isOpen]);

  // Load chat room và kết nối socket khi chuyển sang human mode
  useEffect(() => {
    if (!isAuthenticated || !isOpen || chatMode !== 'human') return;

    const loadChat = async () => {
      try {
        setLoading(true);
        setConnectingToHuman(true);
        
        // Get or create chat room
        const room = await chatService.getOrCreateChatRoom();
        setChatRoom(room);

        // ✅ Load messages - getMessages trả về { data, pagination }
        const messagesResult = await chatService.getMessages(room._id);
        const humanMessages = messagesResult.data || [];
        
        // Giữ lại bot messages và thêm human messages
        setMessages((prev) => {
          const botMessages = prev.filter((msg) => (msg as BotMessage).SenderType === 'bot');
          return [...botMessages, ...humanMessages];
        });

        // Connect to socket and join room
        socketService.connect();
        socketService.joinChatRoom(room._id);

        // Mark messages as read
        await chatService.markAsRead(room._id);
      } catch (error: unknown) {
        console.error('Error loading chat:', error);
      } finally {
        setLoading(false);
        setConnectingToHuman(false);
      }
    };

    loadChat();
  }, [isAuthenticated, isOpen, chatMode]);

  // Set up socket listeners (chỉ khi ở human mode)
  useEffect(() => {
    if (!isOpen || !chatRoom || chatMode !== 'human') return;

    const handleNewMessage = (message: NewMessageEvent) => {
      if (message.ChatRoomId === chatRoom._id) {
        setMessages((prev) => [...prev, message as ChatMessage]);
        // Mark as read
        chatService.markAsRead(chatRoom._id);
      }
    };

    socketService.on('new-message', handleNewMessage);

    return () => {
      socketService.off('new-message', handleNewMessage);
    };
  }, [isOpen, chatRoom, chatMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Bot mode: xử lý bằng chatbot
    if (chatMode === 'bot') {
      try {
        setSending(true);
        
        // Thêm tin nhắn của user
        const userMsg: BotMessage = {
          _id: `user-${Date.now()}`,
          Message: messageText,
          SenderType: 'user',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Xử lý và trả lời tự động
        setTimeout(() => {
          const botResponse = chatbotService.processMessage(messageText);
          
          const botMsg: BotMessage = {
            _id: `bot-${Date.now()}`,
            Message: botResponse.message,
            SenderType: 'bot',
            createdAt: new Date().toISOString(),
            suggestions: botResponse.suggestions,
          };
          
          setMessages((prev) => [...prev, botMsg]);

          // Nếu action là transfer, chuyển sang human mode
          if (botResponse.action === 'transfer') {
            setTimeout(() => {
              setChatMode('human');
            }, 1000);
          }
        }, 500);
      } catch (error: unknown) {
        console.error('Error processing bot message:', error);
      } finally {
        setSending(false);
      }
      return;
    }

    // Human mode: gửi qua socket
    if (!chatRoom) return;

    try {
      setSending(true);
      socketService.sendMessage(chatRoom._id, messageText);
    } catch (error: unknown) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
    // Auto submit after a short delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatRoom && chatMode === 'human') {
        socketService.leaveChatRoom(chatRoom._id);
      }
    };
  }, [chatRoom, chatMode]);

  // Reset khi đóng chat
  const handleClose = () => {
    setIsOpen(false);
    if (chatRoom && chatMode === 'human') {
      socketService.leaveChatRoom(chatRoom._id);
    }
    // Reset về bot mode khi đóng
    setTimeout(() => {
      setChatMode('bot');
      setMessages([]);
      setChatRoom(null);
    }, 300);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>CS</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">
                  {chatMode === 'bot' ? 'Chatbot hỗ trợ' : 'Hỗ trợ khách hàng'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {chatMode === 'bot' 
                    ? 'Chatbot tự động' 
                    : connectingToHuman 
                    ? 'Đang kết nối...' 
                    : chatRoom?.Status === 'active' 
                    ? 'Đang trực tuyến' 
                    : 'Đang chờ...'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              messages.map((message) => {
                // Kiểm tra xem có phải bot message không (có SenderType là 'bot' hoặc 'user' trong BotMessage)
                const isBotModeMessage = 'suggestions' in message || 
                  (message as BotMessage).SenderType === 'bot' || 
                  (message as BotMessage).SenderType === 'user';
                
                const botMessage = isBotModeMessage ? (message as BotMessage) : null;
                const chatMessage = !isBotModeMessage ? (message as ChatMessage) : null;
                
                const isBotResponse = botMessage?.SenderType === 'bot';
                const isUserMessage = botMessage?.SenderType === 'user';
                const isOwn = isUserMessage || (chatMessage && chatMessage.SenderType === 'customer');

                return (
                  <div key={message._id}>
                    <div
                      className={cn('flex gap-2 mb-2', isOwn ? 'justify-end' : 'justify-start')}
                    >
                      {isBotResponse ? (
                        <>
                          <Avatar className="h-8 w-8 bg-primary/10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[75%] rounded-lg p-3 bg-muted">
                            <p className="text-sm whitespace-pre-wrap">{botMessage.Message}</p>
                            <p className="text-xs mt-1 text-muted-foreground">
                              {format(new Date(message.createdAt ?? new Date().toISOString()), 'HH:mm', { locale: vi })}
                            </p>
                          </div>
                        </>
                      ) : isUserMessage ? (
                        <>
                          <div className="max-w-[75%] rounded-lg p-3 bg-primary text-primary-foreground">
                            <p className="text-sm whitespace-pre-wrap">{botMessage.Message}</p>
                            <p className="text-xs mt-1 text-primary-foreground/70">
                              {format(new Date(message.createdAt ?? new Date().toISOString()), 'HH:mm', { locale: vi })}
                            </p>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback>
                              {user?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </>
                      ) : chatMessage ? (
                        <>
                          {!isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={chatMessage.SenderId?.AvatarUrl ?? undefined} />
                              <AvatarFallback>
                                {typeof chatMessage.SenderId === 'object' 
                                  ? chatMessage.SenderId?.HoTen?.charAt(0) || 'A'
                                  : 'A'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              'max-w-[75%] rounded-lg p-3',
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{chatMessage.Message}</p>
                            <p
                              className={cn(
                                'text-xs mt-1',
                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}
                            >
                              {format(new Date(message.createdAt ?? new Date().toISOString()), 'HH:mm', { locale: vi })}
                            </p>
                          </div>
                          {isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback>
                                {user?.fullName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </>
                      ) : null}
                    </div>
                    {/* Suggestions từ bot */}
                    {isBotResponse && botMessage?.suggestions && botMessage.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4 ml-10">
                        {botMessage.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1 px-3"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={chatMode === 'bot' ? 'Nhập câu hỏi...' : 'Nhập tin nhắn...'}
                disabled={sending || (chatMode === 'human' && !chatRoom) || connectingToHuman}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim() || (chatMode === 'human' && !chatRoom) || connectingToHuman}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}


