const express = require('express');
const router = express.Router();
const {markCheckIn, markCheckOut} = require('../controllers/attendance');
const { protect } =  require('../middleware/auth');

router.post('/check-in', protect, markCheckIn);
router.post('/check-out', protect, markCheckOut);


module.exports = router;
