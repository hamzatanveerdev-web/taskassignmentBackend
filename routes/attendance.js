const express = require('express');
const router = express.Router();

const {
  markCheckIn,
  markCheckOut,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  getTimerStatus,
  autoMarkAbsentAttendance,
} = require('../controllers/attendance');

const { protect } = require('../middleware/auth');

router.post('/check-in', protect, markCheckIn);

router.post('/check-out', protect, markCheckOut);

router.get('/my', protect, getMyAttendance);

router.get('/all', protect, getAllAttendance);

router.get('/today', protect, getTodayAttendance);

router.get('/timer-status', protect, getTimerStatus);

// Auto-mark absent attendance (for cron job)
router.post('/auto-mark-absent', protect, autoMarkAbsentAttendance);

module.exports = router;