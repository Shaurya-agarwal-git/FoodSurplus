import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, role, name, phone, ngoDetails } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, error: { message: 'User already exists with this email', code: 'USER_EXISTS' } });
  }

  const userData = { email, password, role, name, phone };

  if (role === 'ngo' && ngoDetails) {
    userData.ngoDetails = ngoDetails;
    userData.verified = false;
  } else {
    userData.verified = true;
  }

  const user = await User.create(userData);
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, email: user.email, name: user.name, role: user.role, verified: user.verified },
      token
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: { message: 'Please provide email and password', code: 'MISSING_CREDENTIALS' } });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      user: { id: user._id, email: user.email, name: user.name, role: user.role, verified: user.verified, stats: user.stats },
      token
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name, phone: req.body.phone, location: req.body.location },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});
