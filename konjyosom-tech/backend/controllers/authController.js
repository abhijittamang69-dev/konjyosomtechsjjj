const User = require('../models/User');
const Technician = require('../models/Technician');
const Session = require('../models/Session');
const generateToken = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const crypto = require('crypto');

// @desc    Login user (auto-detect role)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is disabled. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    const token = generateToken(user._id, user.role);
    await Session.create({
      user: user._id,
      token: token,
      device: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Check first login for technicians
    const needsPasswordChange = user.role === 'technician' && user.firstLogin;

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        firstLogin: user.firstLogin,
        needsPasswordChange: needsPasswordChange
      },
      redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/technician/dashboard'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    let technicianData = null;
    if (user.role === 'technician') {
      technicianData = await Technician.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        technicianProfile: technicianData
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    First login password change (for technicians)
// @route   PUT /api/auth/first-login-change
// @access  Private
const firstLoginChange = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    if (!user.firstLogin) {
      return res.status(400).json({ message: 'Not required for this account' });
    }

    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ success: true, message: 'Password set successfully. You can now access the dashboard.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
      await Session.findOneAndUpdate({ token }, { isActive: false });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin reset technician password
// @route   POST /api/auth/reset-password/:id
// @access  Admin
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot reset admin password' });
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    user.password = tempPassword;
    user.firstLogin = true;
    await user.save();

    // Send email notification
    await sendEmail(emailTemplates.passwordReset(user, tempPassword));

    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      tempPassword: tempPassword // Only shown in admin panel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
  firstLoginChange,
  logout,
  resetPassword
};
