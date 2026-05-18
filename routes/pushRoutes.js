const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

router.post('/subscribe', protect, pushController.subscribeToPush);
router.post('/unsubscribe', protect, pushController.unsubscribeFromPush);
router.get('/vapid-public-key', pushController.getVapidPublicKey);

module.exports = router;
