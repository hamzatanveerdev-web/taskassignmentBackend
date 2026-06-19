require('dotenv').config();
require('express-async-errors');
const express = require('express');
const User = require('./models/User');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const setupSocket = require('./config/socket');
const { errorHandler } = require('./middleware/errorHandler');
const cron = require('node-cron');

// Import routes
const attendanceRoutes = require('./routes/attendance');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pushRoutes = require('./routes/pushRoutes');

// Import attendance controller for cron job
const { autoMarkAbsentAttendance } = require('./controllers/attendance');

connectDB().then(() => {
  createAdmin();
});

// Initialize app
const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = setupSocket(server);
app.locals.io = io;

// Middleware
app.use(cors({
  origin:true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      email: 'admin@test.com',
    });

    if (!adminExists) {
      await User.create({
        fullName: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        isInviteAccepted: true,
      });

      console.log('Admin Created');
    } else {
      console.log('Admin already exists');
    }
  } catch (error) {
    console.log(error);
  }
};

app.get('/', (req, res) => {
  res.send('Task Assignment API is running');
});
// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/push', pushRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  



  // Schedule auto-mark absent attendance job at 10:00 AM every day
  cron.schedule('55 14 * * *', async () => {
    console.log('🕙 Running auto-mark absent attendance job at 10:00 AM');
    try {
      // Create mock req and res objects for the function
      const mockReq = {};
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`Auto-mark absent attendance response:`, data);
          }
        })
      };
      
      await autoMarkAbsentAttendance(mockReq, mockRes);
    } catch (error) {
      console.error('❌ Error in auto-mark absent attendance cron job:', error);
    }
  }, {
    timezone: 'Asia/Karachi' // Set to your timezone
  });
  
  console.log('✅ Cron job scheduled: Auto-mark absent attendance at 10:00 AM daily');
});
 
// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
