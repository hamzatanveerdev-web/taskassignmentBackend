const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('Protect middleware: No token found');
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    console.log('Protect middleware: Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Protect middleware: Token decoded successfully', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Protect middleware: Token verification failed', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }
    next();
  };
}; 
  