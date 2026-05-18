// backend/utils/seedData.js
// Run this file to create demo data

const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      fullName: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
      isInviteAccepted: true,
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create employee users
    const employees = [];
    const employeeData = [
      { fullName: 'John Doe', email: 'john@test.com' },
      { fullName: 'Jane Smith', email: 'jane@test.com' },
      { fullName: 'Bob Johnson', email: 'bob@test.com' },
      { fullName: 'Alice Williams', email: 'alice@test.com' },
    ];

    for (const data of employeeData) {
      const employee = new User({
        fullName: data.fullName,
        email: data.email,
        password: 'password123',
        role: 'employee',
        isActive: true,
        isInviteAccepted: true,
        createdBy: adminUser._id,
      });
      await employee.save();
      employees.push(employee);
    }
    console.log('Created employee users');

    // Create tasks
    const tasks = [];
    const taskData = [
      {
        title: 'Design Landing Page',
        description: 'Create a modern and responsive landing page for the new product',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
      {
        title: 'Fix API Bugs',
        description: 'Fix the bugs reported in the authentication API',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'started',
      },
      {
        title: 'Write Unit Tests',
        description: 'Write comprehensive unit tests for the utility functions',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
      {
        title: 'Update Documentation',
        description: 'Update the API documentation with new endpoints',
        priority: 'low',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
      {
        title: 'Database Optimization',
        description: 'Optimize database queries for better performance',
        priority: 'high',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedTime: '2:30 PM',
      },
    ];

    for (let i = 0; i < taskData.length; i++) {
      const task = new Task({
        ...taskData[i],
        assignedTo: employees[i % employees.length]._id,
        createdBy: adminUser._id,
      });
      await task.save();
      tasks.push(task);
    }
    console.log('Created tasks');

    // Create notifications
    for (const task of tasks) {
      const notification = new Notification({
        recipient: task.assignedTo,
        type: 'taskAssigned',
        title: 'Task Assigned',
        message: `You have been assigned a new task: ${task.title}`,
        relatedTask: task._id,
        relatedUser: adminUser._id,
      });
      await notification.save();
    }
    console.log('Created notifications');

    console.log('\n✅ Seed data created successfully!\n');
    console.log('Demo Credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: password123');
    console.log('\nEmployee Accounts:');
    employeeData.forEach((emp) => {
      console.log(`Email: ${emp.email}, Password: password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed data error:', error);
    process.exit(1);
  }
};

seedData();
