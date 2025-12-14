'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    // Connection Events
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      setIsConnected(false);
    });

    // Online Users Events
    socketInstance.on('users_online', (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    socketInstance.on('online_users', (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    socketInstance.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
