const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

const technicianOnly = (req, res, next) => {
  if (req.user && req.user.role === 'technician') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as technician' });
  }
};

const adminOrTechnician = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'technician')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized' });
  }
};

module.exports = { protect, adminOnly, technicianOnly, adminOrTechnician };
