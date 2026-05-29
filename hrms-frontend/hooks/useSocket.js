'use client';
import { useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';

export const useSocket = (userId, token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId || !token) return;
    socketRef.current = connectSocket(userId, token);

    return () => {
      // Don't disconnect on unmount for shared socket - just remove listeners
    };
  }, [userId, token]);

  const on = useCallback((event, handler) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit(event, data);
    }
  }, []);

  const joinRoom = useCallback((projectId) => {
    emit('project:join', { projectId });
  }, [emit]);

  const leaveRoom = useCallback((projectId) => {
    emit('project:leave', { projectId });
  }, [emit]);

  return { socket: socketRef.current, on, emit, joinRoom, leaveRoom };
};

export default useSocket;
