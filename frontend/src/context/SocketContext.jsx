import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const joinLocation = (latitude, longitude) => socket?.emit('join-location', { latitude, longitude });
  const leaveLocation = (roomName) => socket?.emit('leave-location', roomName);
  const joinListing = (listingId) => socket?.emit('join-listing', listingId);
  const sendMessage = (listingId, message) => socket?.emit('send-message', { listingId, message });

  return (
    <SocketContext.Provider value={{ socket, connected, joinLocation, leaveLocation, joinListing, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};
