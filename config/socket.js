const socketIO = require('socket.io');
const User = require('../models/User');
const { sendPushNotification } = require('../controllers/pushController');
const dotenv = require('dotenv');
dotenv.config();

const setupSocket = (server) => {
 const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL ,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('userOnline', async (userId) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
      // Update user online status
      await User.findByIdAndUpdate(userId, { isOnline: true });
      
      io.emit('userStatusChanged', { userId, status: 'online' });
    });

    socket.on('userVisibility', async (data) => {
      // Track user visibility state (visible/hidden)
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: data.isVisible });
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
        io.emit('userStatusChanged', { userId: socket.userId, status: 'offline' });
      }
      console.log(`User disconnected: ${socket.id}`);
    });

    socket.on('taskAssigned', async (data) => {
      const room = io.sockets.adapter.rooms.get(`user_${data.employeeId}`);
      const user = await User.findById(data.employeeId);
      
      // Send socket notification if user is online
      if (room && room.size > 0 && user?.isOnline) {
        io.to(`user_${data.employeeId}`).emit('newTaskNotification', data);
      } else {
        // Send push notification if user is offline
        await sendPushNotification(data.employeeId, {
          title: 'New Task Assigned',
          message: `You have been assigned a new task: ${data.taskTitle}`,
          type: 'taskAssigned',
          relatedTask: data.taskId,
          actionUrl: `/tasks/${data.taskId}`,
        });
      }
    });

    socket.on('taskUpdated', async (data) => {
      const room = io.sockets.adapter.rooms.get(`user_${data.adminId}`);
      const user = await User.findById(data.adminId);
      
      if (room && room.size > 0 && user?.isOnline) {
        io.to(`user_${data.adminId}`).emit('taskStatusChanged', data);
      } else {
        await sendPushNotification(data.adminId, {
          title: 'Task Status Updated',
          message: `Task "${data.taskTitle}" status has been updated to ${data.status}`,
          type: 'taskUpdated',
          relatedTask: data.taskId,
          actionUrl: `/tasks/${data.taskId}`,
        });
      }
    });

    socket.on('taskCompleted', async (data) => {
      const room = io.sockets.adapter.rooms.get(`user_${data.adminId}`);
      const user = await User.findById(data.adminId);
      
      if (room && room.size > 0 && user?.isOnline) {
        io.to(`user_${data.adminId}`).emit('taskCompleted', data);
      } else {
        await sendPushNotification(data.adminId, {
          title: 'Task Completed',
          message: `Task "${data.taskTitle}" has been completed`,
          type: 'taskCompleted',
          relatedTask: data.taskId,
          actionUrl: `/tasks/${data.taskId}`,
        });
      }
    });
  });

  return io;
};

module.exports = setupSocket;
