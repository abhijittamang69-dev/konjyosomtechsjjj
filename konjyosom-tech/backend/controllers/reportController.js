const WorkOrder = require('../models/WorkOrder');
const Booking = require('../models/Booking');
const Quotation = require('../models/Quotation');
const User = require('../models/User');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    const stats = {
      totalCustomers: await Customer.countDocuments(),
      newBookings: await Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      pendingJobs: await WorkOrder.countDocuments({ status: { $in: ['pending', 'assigned', 'accepted'] } }),
      completedJobs: await WorkOrder.countDocuments({ status: 'completed', completedAt: { $gte: startOfMonth } }),
      totalQuotations: await Quotation.countDocuments(),
      pendingQuotations: await Quotation.countDocuments({ status: 'pending' }),
      totalTechnicians: await User.countDocuments({ role: 'technician' }),
      activeTechnicians: await User.countDocuments({ role: 'technician', isActive: true }),

      // Weekly data
      weeklyBookings: await Booking.countDocuments({ createdAt: { $gte: startOfWeek } }),
      weeklyCompleted: await WorkOrder.countDocuments({ completedAt: { $gte: startOfWeek } }),

      // Recent activity
      recentActivity: await ActivityLog.find()
        .populate('user', 'name email')
        .sort({ timestamp: -1 })
        .limit(10)
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get activity logs
// @route   GET /api/reports/activity
// @access  Admin
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, user, action } = req.query;

    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician performance report
// @route   GET /api/reports/technicians
// @access  Admin
const getTechnicianReport = async (req, res) => {
  try {
    const technicians = await User.aggregate([
      { $match: { role: 'technician' } },
      {
        $lookup: {
          from: 'workorders',
          localField: '_id',
          foreignField: 'assignedTechnician',
          as: 'workOrders'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          isActive: 1,
          totalJobs: { $size: '$workOrders' },
          completedJobs: {
            $size: {
              $filter: {
                input: '$workOrders',
                as: 'wo',
                cond: { $eq: ['$$wo.status', 'completed'] }
              }
            }
          },
          pendingJobs: {
            $size: {
              $filter: {
                input: '$workOrders',
                as: 'wo',
                cond: { $in: ['$$wo.status', ['pending', 'assigned', 'accepted', 'on_site', 'in_progress']] }
              }
            }
          }
        }
      }
    ]);

    res.json({ success: true, technicians });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly report
// @route   GET /api/reports/monthly
// @access  Admin
const getMonthlyReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      monthlyData.push({
        month: month + 1,
        monthName: startDate.toLocaleString('default', { month: 'long' }),
        bookings: await Booking.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        completedJobs: await WorkOrder.countDocuments({ completedAt: { $gte: startDate, $lte: endDate } }),
        quotations: await Quotation.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        newCustomers: await Customer.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
      });
    }

    res.json({ success: true, year, monthlyData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getActivityLogs,
  getTechnicianReport,
  getMonthlyReport
};
