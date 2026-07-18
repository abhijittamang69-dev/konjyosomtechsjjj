const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Create new booking (public)
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
  try {
    const { name, company, phone, email, location, serviceType, preferredDate, description, photos } = req.body;

    // Create or find customer
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({
        name,
        company,
        email,
        phone,
        address: location,
        type: company ? 'company' : 'individual'
      });
    } else {
      customer.totalBookings += 1;
      await customer.save();
    }

    const booking = await Booking.create({
      customer: customer._id,
      name,
      company,
      phone,
      email,
      location,
      serviceType,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      description,
      photos: photos || []
    });

    // Send confirmation email
    if (email) {
      await sendEmail(emailTemplates.bookingConfirmation(booking));
    }

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Admin
const getAllBookings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone email')
      .populate('assignedTechnician', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Admin/Technician
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer')
      .populate('assignedTechnician', 'name email phone')
      .populate('workOrder');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    if (notes) booking.notes = notes;
    await booking.save();

    res.json({ success: true, message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign technician to booking
// @route   PUT /api/bookings/:id/assign
// @access  Admin
const assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.assignedTechnician = technicianId;
    booking.status = 'assigned';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('assignedTechnician', 'name email');

    res.json({
      success: true,
      message: 'Technician assigned successfully',
      booking: populatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Admin
const deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/overview
// @access  Admin
const getBookingStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: 'pending' });
    const confirmed = await Booking.countDocuments({ status: 'confirmed' });
    const assigned = await Booking.countDocuments({ status: 'assigned' });
    const inProgress = await Booking.countDocuments({ status: 'in_progress' });
    const completed = await Booking.countDocuments({ status: 'completed' });
    const cancelled = await Booking.countDocuments({ status: 'cancelled' });

    // Recent bookings (last 7 days)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await Booking.countDocuments({ createdAt: { $gte: lastWeek } });

    res.json({
      success: true,
      stats: {
        total, pending, confirmed, assigned, inProgress, completed, cancelled, recent
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  assignTechnician,
  deleteBooking,
  getBookingStats
};
