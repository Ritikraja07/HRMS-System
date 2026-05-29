require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { initSocketHandler } = require('./socket/socketHandler');

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const tasksRoutes = require('./routes/tasks');
const projectsRoutes = require('./routes/projects');
const messagesRoutes = require('./routes/messages');
const leaveRoutes = require('./routes/leave');
const payslipsRoutes = require('./routes/payslips');
const updatesRoutes = require('./routes/updates');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const managerRoutes = require('./routes/manager');
const shiftsRoutes         = require('./routes/shifts');
const announcementsRoutes  = require('./routes/announcements');

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow any localhost port
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Make io accessible to routes
app.set('io', io);

// Initialize socket handlers
initSocketHandler(io);

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors(corsOptions));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'HRMS Backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payslips', payslipsRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/shifts',        shiftsRoutes);
app.use('/api/announcements', announcementsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 HRMS Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`);
});

module.exports = { app, httpServer };
