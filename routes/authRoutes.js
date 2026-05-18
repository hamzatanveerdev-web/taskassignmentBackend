const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } =  require('../middleware/auth');

router.post('/login', authController.login);
router.post('/setup-password', authController.setupPassword);
router.get('/me', protect, authController.getMe);

module.exports = router;
