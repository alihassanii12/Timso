'use client';

import React, { createContext, useContext } from 'react';

interface SocketContextType {
  socket: null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

// Socket.io disabled — Vercel serverless does not support persistent connections
export const SocketProvider: React.FC<{ children: React.ReactNode; userId?: string | number }> = ({ children }) => {
  return (
    <SocketContext.Provider value={{ socket: null, isConnected: false }}>
      {children}
    </SocketContext.Provider>
  );
};
