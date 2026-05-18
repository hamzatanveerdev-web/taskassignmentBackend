const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), employeeController.getAllEmployees);
router.post('/', protect, authorize('admin'), employeeController.addEmployee);
router.put('/:id', protect, authorize('admin'), employeeController.updateEmployee);
router.delete('/:id', protect, authorize('admin'), employeeController.deleteEmployee);
router.get('/search', protect, authorize('admin'), employeeController.searchEmployees);
router.get('/:id', protect, employeeController.getEmployeeById);

module.exports = router;
