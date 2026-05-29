import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (userId, token) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      s.emit('user:join', { userId, token });
    });
    s.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    s.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const joinProjectRoom = (projectId) => {
  const s = getSocket();
  if (s.connected) {
    s.emit('project:join', { projectId });
  }
};

export const leaveProjectRoom = (projectId) => {
  const s = getSocket();
  if (s.connected) {
    s.emit('project:leave', { projectId });
  }
};

export default getSocket;
