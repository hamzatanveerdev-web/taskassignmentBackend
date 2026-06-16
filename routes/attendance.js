const express = require('express');
const router = express.Router();

const {
  markCheckIn,
  markCheckOut,
  getMyAttendance,
  getAllAttendance,
} = require('../controllers/attendanceController');

const { protect } = require('../middleware/auth');

router.post('/check-in', protect, markCheckIn);

router.post('/check-out', protect, markCheckOut);

router.get('/my', protect, getMyAttendance);

router.get('/all', protect, getAllAttendance);

module.exports = router;