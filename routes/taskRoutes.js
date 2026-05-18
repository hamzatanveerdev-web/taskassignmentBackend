const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), taskController.createTask);
router.get('/', protect, authorize('admin'), taskController.getAllTasks);
router.get('/my-tasks', protect, authorize('employee'), taskController.getMyTasks);
router.get('/analytics', protect, authorize('admin'), taskController.getTaskAnalytics);
router.get('/search', protect, taskController.searchTasks);
router.put('/:id/status', protect, taskController.updateTaskStatus);
router.put('/:id', protect, authorize('admin'), taskController.updateTask);
router.delete('/:id', protect, authorize('admin'), taskController.deleteTask);
router.get('/:id', protect, taskController.getTaskById);

module.exports = router;
