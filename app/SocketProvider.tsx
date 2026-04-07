'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode; userId?: string | number }> = ({ children, userId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(API, {
      transports: ['polling'],  // Vercel serverless: WebSocket not supported
      upgrade: false,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    newSocket.on('connect_error', () => {
      // Silently fail on Vercel — real-time not available in serverless
      newSocket.disconnect();
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server');
      setIsConnected(true);
      newSocket.emit('join-room', `user_${userId}`);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
