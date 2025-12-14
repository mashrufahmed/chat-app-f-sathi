import { useSocket } from '@/lib/SocketProvider';
import { useCallback, useEffect, useState } from 'react';

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

interface UseChatOptions {
  currentUserId: string;
  selectedUserId?: string;
}

export const useChat = ({ currentUserId, selectedUserId }: UseChatOptions) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // === Send Message ===
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !selectedUserId || !content.trim()) return;

      socket.emit('private_message', {
        receiverId: selectedUserId,
        message: content,
      });
    },
    [socket, selectedUserId]
  );

  // === Handle Typing ===
  const handleTyping = useCallback(() => {
    if (!socket || !selectedUserId) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing started
    socket.emit('typing', {
      receiverId: selectedUserId,
      isTyping: true,
    });

    // Set timeout to stop typing
    const timeout = setTimeout(() => {
      socket.emit('typing', {
        receiverId: selectedUserId,
        isTyping: false,
      });
    }, 2000);

    setTypingTimeout(timeout);
  }, [socket, selectedUserId, typingTimeout]);

  // === Mark Messages as Read ===
  const markAsRead = useCallback(
    (senderId: string) => {
      if (!socket) return;

      socket.emit('mark_read', { senderId });
    },
    [socket]
  );

  // === Listen for Messages ===
  useEffect(() => {
    if (!socket) return;

    // Receive private messages
    const handlePrivateMessage = ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);

      // Auto mark as read if chat is open with sender
      if (message.sender._id === selectedUserId) {
        markAsRead(message.sender._id);
      }
    };

    // Message sent confirmation
    const handleMessageSent = ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
    };

    // Typing indicator
    const handleUserTyping = ({
      userId,
      isTyping: typing,
    }: {
      userId: string;
      isTyping: boolean;
    }) => {
      if (userId === selectedUserId) {
        setIsTyping(typing);
      }
    };

    // Messages read
    const handleMessagesRead = ({ readBy }: { readBy: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiver._id === readBy && msg.sender._id === currentUserId
            ? { ...msg, read: true, readAt: new Date() }
            : msg
        )
      );
    };

    socket.on('private_message', handlePrivateMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('private_message', handlePrivateMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, selectedUserId, currentUserId, markAsRead]);

  // === Clear messages when changing chat ===
  useEffect(() => {
    setMessages([]);
    setIsTyping(false);
  }, [selectedUserId]);

  return {
    messages,
    sendMessage,
    handleTyping,
    markAsRead,
    isTyping,
    isConnected,
  };
};
