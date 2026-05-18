const webpush = require('web-push');
const User = require('../models/User');

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:admin@taskmanagement.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        pushSubscription: subscription,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Push subscription saved successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unsubscribeFromPush = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      pushSubscription: null,
    });

    res.status(200).json({
      success: true,
      message: 'Push subscription removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendPushNotification = async (userId, notification) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.pushSubscription) {
      return false;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: notification.actionUrl,
        type: notification.type,
        relatedTask: notification.relatedTask,
      },
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410) {
      await User.findByIdAndUpdate(userId, { pushSubscription: null });
    }
    return false;
  }
};

exports.getVapidPublicKey = (req, res) => {
  res.status(200).json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
};
