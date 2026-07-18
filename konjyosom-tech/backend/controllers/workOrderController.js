const WorkOrder = require('../models/WorkOrder');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { generateServiceReport } = require('../utils/pdfGenerator');

// @desc    Create work order from booking
// @route   POST /api/workorders
// @access  Admin
const createWorkOrder = async (req, res) => {
  try {
    const {
      bookingId,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      location,
      locationCoords,
      priority,
      assignedTechnician,
      dueDate,
      description,
      attachments
    } = req.body;

    const workOrder = await WorkOrder.create({
      booking: bookingId,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      location,
      locationCoords,
      priority: priority || 'medium',
      assignedTechnician,
      dueDate: dueDate ? new Date(dueDate) : null,
      description,
      attachments: attachments || [],
      status: 'pending',
      createdBy: req.user._id
    });

    // Update booking status
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'assigned', workOrder: workOrder._id });
    }

    // Send notification to technician
    if (assignedTechnician) {
      const technician = await User.findById(assignedTechnician);
      if (technician && technician.email) {
        await sendEmail(emailTemplates.jobAssignment(workOrder, technician));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      workOrder: await WorkOrder.findById(workOrder._id)
        .populate('assignedTechnician', 'name email phone')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all work orders
// @route   GET /api/workorders
// @access  Admin/Technician
const getAllWorkOrders = async (req, res) => {
  try {
    const { status, technician, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Technicians only see their assigned work orders
    if (req.user.role === 'technician') {
      query.assignedTechnician = req.user._id;
    }

    if (status) query.status = status;
    if (technician) query.assignedTechnician = technician;
    if (search) {
      query.$or = [
        { workOrderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { serviceType: { $regex: search, $options: 'i' } }
      ];
    }

    const workOrders = await WorkOrder.find(query)
      .populate('assignedTechnician', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await WorkOrder.countDocuments(query);

    res.json({
      success: true,
      workOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get work order by ID
// @route   GET /api/workorders/:id
// @access  Admin/Technician (own assignments)
const getWorkOrderById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('assignedTechnician', 'name email phone')
      .populate('createdBy', 'name')
      .populate('booking');

    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    // Check if technician is authorized
    if (req.user.role === 'technician' && 
        workOrder.assignedTechnician?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this work order' });
    }

    res.json({ success: true, workOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update work order status (technician actions)
// @route   PUT /api/workorders/:id/status
// @access  Admin/Technician
const updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    // Technician restrictions
    if (req.user.role === 'technician') {
      if (workOrder.assignedTechnician?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not assigned to this work order' });
      }

      // Technicians can only change to specific statuses
      const allowedStatuses = ['accepted', 'on_site', 'in_progress', 'completed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ message: 'Technician cannot set this status' });
      }
    }

    const oldStatus = workOrder.status;
    workOrder.status = status;

    // Add to status history
    workOrder.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: notes || `Status changed from ${oldStatus} to ${status}`
    });

    if (status === 'completed') {
      workOrder.completedAt = new Date();
      workOrder.completedBy = req.user._id;
    }

    await workOrder.save();

    res.json({ success: true, message: 'Status updated', workOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept/Reject work order (technician)
// @route   PUT /api/workorders/:id/accept
// @access  Technician
const acceptWorkOrder = async (req, res) => {
  try {
    const { accept, reason } = req.body;

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    if (workOrder.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not assigned to this work order' });
    }

    if (accept) {
      workOrder.status = 'accepted';
      workOrder.statusHistory.push({
        status: 'accepted',
        changedBy: req.user._id,
        changedAt: new Date(),
        notes: 'Technician accepted the assignment'
      });
    } else {
      workOrder.status = 'pending';
      workOrder.assignedTechnician = null;
      workOrder.statusHistory.push({
        status: 'pending',
        changedBy: req.user._id,
        changedAt: new Date(),
        notes: `Technician rejected: ${reason || 'No reason provided'}`
      });
    }

    await workOrder.save();

    res.json({
      success: true,
      message: accept ? 'Work order accepted' : 'Work order rejected',
      workOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload work photos
// @route   PUT /api/workorders/:id/photos
// @access  Technician
const uploadPhotos = async (req, res) => {
  try {
    const { beforePhotos, afterPhotos } = req.body;

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    if (req.user.role === 'technician' && 
        workOrder.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (beforePhotos) workOrder.beforePhotos = [...workOrder.beforePhotos, ...beforePhotos];
    if (afterPhotos) workOrder.afterPhotos = [...workOrder.afterPhotos, ...afterPhotos];

    await workOrder.save();

    res.json({ success: true, message: 'Photos uploaded', workOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add service notes
// @route   PUT /api/workorders/:id/notes
// @access  Technician
const addNotes = async (req, res) => {
  try {
    const { serviceNotes, materialsUsed, laborHours } = req.body;

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    if (req.user.role === 'technician' && 
        workOrder.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (serviceNotes) workOrder.serviceNotes = serviceNotes;
    if (materialsUsed) workOrder.materialsUsed = materialsUsed;
    if (laborHours) workOrder.laborHours = laborHours;

    await workOrder.save();

    res.json({ success: true, message: 'Notes updated', workOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Capture customer signature
// @route   PUT /api/workorders/:id/signature
// @access  Technician
const captureSignature = async (req, res) => {
  try {
    const { signature, signedBy } = req.body;

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    if (req.user.role === 'technician' && 
        workOrder.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    workOrder.customerSignature = signature;
    workOrder.signedBy = signedBy || 'Customer';
    workOrder.signatureDate = new Date();

    await workOrder.save();

    res.json({ success: true, message: 'Signature captured', workOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete work order and generate report
// @route   PUT /api/workorders/:id/complete
// @access  Technician
const completeWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('assignedTechnician', 'name email phone');

    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    if (req.user.role === 'technician' && 
        workOrder.assignedTechnician?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!workOrder.customerSignature) {
      return res.status(400).json({ message: 'Customer signature is required before completion' });
    }

    workOrder.status = 'completed';
    workOrder.completedAt = new Date();
    workOrder.completedBy = req.user._id;

    // Generate PDF report
    const report = await generateServiceReport(workOrder, workOrder.assignedTechnician, {});
    workOrder.reportGenerated = true;
    workOrder.reportUrl = report.url;

    await workOrder.save();

    // Send email to customer
    if (workOrder.customerEmail) {
      await sendEmail(emailTemplates.serviceReport(workOrder, report.url));
    }

    res.json({
      success: true,
      message: 'Work order completed and report generated',
      workOrder,
      reportUrl: report.url
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get work order stats
// @route   GET /api/workorders/stats/overview
// @access  Admin
const getWorkOrderStats = async (req, res) => {
  try {
    const total = await WorkOrder.countDocuments();
    const pending = await WorkOrder.countDocuments({ status: 'pending' });
    const assigned = await WorkOrder.countDocuments({ status: 'assigned' });
    const accepted = await WorkOrder.countDocuments({ status: 'accepted' });
    const onSite = await WorkOrder.countDocuments({ status: 'on_site' });
    const inProgress = await WorkOrder.countDocuments({ status: 'in_progress' });
    const completed = await WorkOrder.countDocuments({ status: 'completed' });
    const closed = await WorkOrder.countDocuments({ status: 'closed' });

    // Technician performance
    const technicianPerformance = await WorkOrder.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$assignedTechnician', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'tech' } },
      { $unwind: '$tech' },
      { $project: { name: '$tech.name', completedJobs: '$count' } }
    ]);

    res.json({
      success: true,
      stats: {
        total, pending, assigned, accepted, onSite, inProgress, completed, closed,
        technicianPerformance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWorkOrder,
  getAllWorkOrders,
  getWorkOrderById,
  updateStatus,
  acceptWorkOrder,
  uploadPhotos,
  addNotes,
  captureSignature,
  completeWorkOrder,
  getWorkOrderStats
};
