'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useSession } from '@/lib/auth-client';
import axiosInstance from '@/lib/axios-instance';
import { useSocket } from '@/lib/SocketProvider';
import { useQuery } from '@tanstack/react-query';
import {
  MonitorPlay as EmojiHappy,
  Info,
  MessageCirclePlus,
  Plus,
  Send,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MessageBubble from './message-bubble';

interface ChatWindowProps {
  selectedFriendId: string | null;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    image?: string;
  };
  receiver: {
    _id: string;
    name: string;
    image?: string;
  };
  content: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export default function ChatWindow({ selectedFriendId }: ChatWindowProps) {
  const { data: session } = useSession();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = session?.user?.id;

  // Fetch selected friend details
  const { data: selectedFriend } = useQuery({
    queryKey: ['friend', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return null;
      const res = await axiosInstance.get(
        `/api/users/get-user/${selectedFriendId}`
      );
      return res.data;
    },
    enabled: !!selectedFriendId,
  });

  // Fetch messages
  const { data: fetchedMessages, isLoading } = useQuery({
    queryKey: ['messages', selectedFriendId],
    queryFn: async (): Promise<Message[]> => {
      if (!selectedFriendId) return [];
      const res = await axiosInstance.get(
        `/api/users/messages/${selectedFriendId}`
      );
      return res.data;
    },
    enabled: !!selectedFriendId,
  });

  // Update messages when fetched
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !selectedFriendId || !currentUserId) return;

    // Receive private messages
    const handlePrivateMessage = ({ message }: { message: Message }) => {
      if (
        message.sender._id === selectedFriendId ||
        message.receiver._id === selectedFriendId
      ) {
        setMessages((prev) => [...prev, message]);

        // Auto mark as read if message is from the selected friend
        if (message.sender._id === selectedFriendId) {
          socket.emit('mark_read', { senderId: selectedFriendId });
        }
      }
    };

    // Message sent confirmation
    const handleMessageSent = ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
      setIsSending(false);
    };

    // Typing indicator
    const handleUserTyping = ({
      userId,
      isTyping: typing,
    }: {
      userId: string;
      isTyping: boolean;
    }) => {
      if (userId === selectedFriendId) {
        setIsTyping(typing);
      }
    };

    // Messages read
    const handleMessagesRead = ({ readBy }: { readBy: string }) => {
      if (readBy === selectedFriendId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id === currentUserId && msg.receiver._id === readBy
              ? { ...msg, read: true, readAt: new Date() }
              : msg
          )
        );
      }
    };

    socket.on('private_message', handlePrivateMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    // Mark messages as read when opening chat
    socket.emit('mark_read', { senderId: selectedFriendId });

    return () => {
      socket.off('private_message', handlePrivateMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, selectedFriendId, currentUserId]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !selectedFriendId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing started
    socket.emit('typing', {
      receiverId: selectedFriendId,
      isTyping: true,
    });

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        receiverId: selectedFriendId,
        isTyping: false,
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket || !selectedFriendId || isSending) return;

    setIsSending(true);

    socket.emit(
      'private_message',
      {
        receiverId: selectedFriendId,
        message: inputValue,
      },
      (response: {
        delivered: boolean;
        messageId?: string;
        error?: string;
      }) => {
        if (response.delivered) {

          setInputValue('');
        } else {

          setIsSending(false);
        }
      }
    );

    // Stop typing indicator
    socket.emit('typing', {
      receiverId: selectedFriendId,
      isTyping: false,
    });
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    handleTyping();
  };

  // No friend selected
  if (!selectedFriendId) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <MessageCirclePlus size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(selectedFriendId);

  return (
    <div className="hidden md:flex flex-1 flex-col bg-background">
      {/* Chat Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-x-2">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={
                  selectedFriend?.image ||
                  `https://avatar.vercel.sh/${selectedFriend?.email}`
                }
              />
              <AvatarFallback>
                {selectedFriend?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground font-inter">
              {selectedFriend?.name || 'Loading...'}
            </h2>
            <p
              className={`text-[11px] ${
                isOnline ? 'text-green-500' : 'text-muted-foreground'
              }`}
            >
              {isTyping ? 'typing...' : isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Info size={20} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === currentUserId}
              currentUserId={currentUserId || ''}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="h-20 border-t border-border px-6 py-4 bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full shrink-0">
          <Plus size={20} className="text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full shrink-0">
          <EmojiHappy size={20} className="text-muted-foreground" />
        </Button>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          disabled={!isConnected || isSending}
          className="flex-1 px-4 py-2 bg-muted text-card-foreground placeholder-muted-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!isConnected || isSending || !inputValue.trim()}
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0"
        >
          {isSending ? (
            <Spinner className="w-5 h-5" />
          ) : (
            <Send size={20} className="text-primary" />
          )}
        </Button>
      </div>
    </div>
  );
}
