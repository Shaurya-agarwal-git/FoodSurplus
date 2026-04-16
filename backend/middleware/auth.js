import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: { message: 'Not authorized', code: 'UNAUTHORIZED' } });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } });
    }

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
    }

    next();
  } catch {
    return res.status(401).json({ success: false, error: { message: 'Not authorized', code: 'UNAUTHORIZED' } });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { message: 'Not authorized', code: 'UNAUTHORIZED' } });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { message: `Role '${req.user.role}' is not authorized`, code: 'FORBIDDEN' } });
  }
  next();
};
