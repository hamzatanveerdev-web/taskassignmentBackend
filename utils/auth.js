const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    },
  });
};

exports.generateInviteToken = () => {
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
  return { inviteToken, hashedToken };
};
