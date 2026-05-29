const { supabaseAdmin } = require('../utils/supabaseAdmin');

const connectedUsers = new Map(); // userId -> socketId

const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins with their userId
    socket.on('user:join', async ({ userId, token }) => {
      try {
        // Verify token
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined with socket ${socket.id}`);
        socket.emit('user:joined', { userId, socketId: socket.id });
      } catch (err) {
        console.error('Socket join error:', err);
        socket.emit('error', { message: 'Failed to join' });
      }
    });

    // Join a project room for chat
    socket.on('project:join', ({ projectId }) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project room: ${projectId}`);
      socket.to(`project:${projectId}`).emit('user:online', {
        userId: socket.userId,
        projectId,
      });
    });

    // Leave project room
    socket.on('project:leave', ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:offline', {
        userId: socket.userId,
        projectId,
      });
    });

    // New message in project chat
    socket.on('message:send', async ({ projectId, senderId, content, fileUrl, fileName, fileType, messageType }) => {
      try {
        const messageData = {
          project_id: projectId,
          sender_id: senderId,
          content: content || null,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_type: fileType || null,
          message_type: messageType || 'text',
        };

        const { data: message, error } = await supabaseAdmin
          .from('messages')
          .insert(messageData)
          .select(`
            *,
            sender:users!sender_id(id, full_name, avatar_url, role)
          `)
          .single();

        if (error) {
          socket.emit('message:error', { error: error.message });
          return;
        }

        // Broadcast to all in project room
        io.to(`project:${projectId}`).emit('message:new', message);
      } catch (err) {
        console.error('Message send error:', err);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ projectId, userId, userName }) => {
      socket.to(`project:${projectId}`).emit('typing:update', {
        userId,
        userName,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ projectId, userId }) => {
      socket.to(`project:${projectId}`).emit('typing:update', {
        userId,
        isTyping: false,
      });
    });

    // Send notification to specific user
    socket.on('notification:send', ({ targetUserId, notification }) => {
      io.to(`user:${targetUserId}`).emit('notification:new', notification);
    });

    // Punch in/out broadcast
    socket.on('attendance:update', ({ userId, status }) => {
      // Could broadcast to manager rooms if needed
      console.log(`Attendance update: user ${userId} status: ${status}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Helper to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Helper to emit to project room
  io.emitToProject = (projectId, event, data) => {
    io.to(`project:${projectId}`).emit(event, data);
  };

  return io;
};

const getConnectedUsers = () => connectedUsers;

module.exports = { initSocketHandler, getConnectedUsers };
