const User = require('../models/User');
const Technician = require('../models/Technician');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let technicianData = null;
    if (user.role === 'technician') {
      technicianData = await Technician.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: { ...user.toObject(), technicianProfile: technicianData }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create technician (admin only)
// @route   POST /api/users/technician
// @access  Admin
const createTechnician = async (req, res) => {
  try {
    const { name, email, username, phone, specialization, skills } = req.body;

    // Generate temp password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

    const user = await User.create({
      name: name || username,
      email: email.toLowerCase(),
      password: tempPassword,
      role: 'technician',
      phone,
      firstLogin: true
    });

    // Create technician profile
    await Technician.create({
      user: user._id,
      specialization: specialization || [],
      skills: skills || []
    });

    // Send welcome email with temp password
    await sendEmail({
      to: email,
      subject: 'Welcome to Konjyosom Tech - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a5276;">Welcome to Konjyosom Tech Solutions</h2>
          <p>Hello ${name || username},</p>
          <p>Your technician account has been created. Here are your login details:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          <p>Please login and change your password on first login.</p>
          <p><a href="${process.env.FRONTEND_URL}/login" style="background: #1a5276; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Login Now</a></p>
          <p>Best regards,<br>Konjyosom Tech Solutions Team</p>
        </div>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Technician created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tempPassword: tempPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, isActive, specialization, skills } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Update technician profile if exists
    if (user.role === 'technician') {
      await Technician.findOneAndUpdate(
        { user: user._id },
        { specialization: specialization || [], skills: skills || [] },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: await User.findById(req.params.id).select('-password')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disable/Enable user
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot disable admin account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Technician.deleteOne({ user: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician stats
// @route   GET /api/users/technicians/stats
// @access  Admin
const getTechnicianStats = async (req, res) => {
  try {
    const stats = await Technician.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          isActive: '$userInfo.isActive',
          totalJobs: 1,
          completedJobs: 1,
          rating: 1,
          availability: 1
        }
      }
    ]);

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createTechnician,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getTechnicianStats
};
