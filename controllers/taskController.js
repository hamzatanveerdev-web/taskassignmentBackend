const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendTaskAssignmentEmail } = require('../utils/email');

exports.createTask = async (req, res, next) => {
  const { title, description, priority, dueDate, assignedTo } = req.body;
 
  if (!title || !description || !dueDate || !assignedTo) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    const task = new Task({
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      assignedTo,
      createdBy: req.user.id,
    });

    await task.save();

    // Send email notification
    const employee = await User.findById(assignedTo);
    if (employee) {
      await sendTaskAssignmentEmail(employee.email, employee.fullName, title, dueDate);
    }

    // Create notification
    const notification = new Notification({
      recipient: assignedTo,
      type: 'taskAssigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      relatedTask: task._id,
      relatedUser: req.user.id,
      actionUrl: `/my-tasks`,
    });

    await notification.save();

    // Emit socket event for real-time notification
    const io = req.app.locals.io;
    if (io) {
      io.emit('taskAssigned', {
        taskId: task._id,
        taskTitle: title,
        employeeId: assignedTo,
        description,
        priority,
        dueDate,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, priority, assignedTo } = req.query;

    let filter = { createdBy: req.user.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email profileImage')
      .populate('createdBy', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, priority } = req.query;

    let filter = { assignedTo: req.user.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email profileImage')
      .populate('createdBy', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ dueDate: 1 });

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTaskStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'started', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    let task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === 'completed') {
      task.completedDate = new Date();
      task.completedTime = new Date().toLocaleTimeString();
    }

    task = await task.save();

    // Create notification for admin
    const notification = new Notification({
      recipient: task.createdBy,
      type: 'taskUpdated',
      title: 'Task Status Updated',
      message: `Task "${task.title}" status changed from ${oldStatus} to ${status}`,
      relatedTask: task._id,
      relatedUser: req.user.id,
      actionUrl: `/task-history`,
    });

    await notification.save();

    // Emit socket event for real-time notification
    const io = req.app.locals.io;
    if (io) {
      io.emit('taskUpdated', {
        taskId: task._id,
        taskTitle: task.title,
        adminId: task.createdBy,
        status,
        oldStatus,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, priority, dueDate, status } = req.body;

  try {
    let task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (status) task.status = status;

    task = await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaskById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id)
      .populate('assignedTo', 'fullName email profileImage')
      .populate('createdBy', 'fullName email')
      .populate('comments.userId', 'fullName profileImage');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchTasks = async (req, res, next) => {
  const { search } = req.query;

  try {
    const tasks = await Task.find({
      createdBy: req.user.id,
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    }).populate('assignedTo', 'fullName email profileImage');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaskAnalytics = async (req, res, next) => {
  try {
    const totalTasks = await Task.countDocuments({ createdBy: req.user.id });
    const pendingTasks = await Task.countDocuments({ createdBy: req.user.id, status: 'pending' });
    const startedTasks = await Task.countDocuments({ createdBy: req.user.id, status: 'started' });
    const completedTasks = await Task.countDocuments({ createdBy: req.user.id, status: 'completed' });

    const highPriorityTasks = await Task.countDocuments({ createdBy: req.user.id, priority: 'high' });
    const mediumPriorityTasks = await Task.countDocuments({ createdBy: req.user.id, priority: 'medium' });
    const lowPriorityTasks = await Task.countDocuments({ createdBy: req.user.id, priority: 'low' });

    res.status(200).json({
      success: true,
      analytics: {
        totalTasks,
        pendingTasks,
        startedTasks,
        completedTasks,
        priorityBreakdown: {
          high: highPriorityTasks,
          medium: mediumPriorityTasks,
          low: lowPriorityTasks,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
