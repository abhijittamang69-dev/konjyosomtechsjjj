const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Create new quotation request (public)
// @route   POST /api/quotations
// @access  Public
const createQuotation = async (req, res) => {
  try {
    const { name, company, phone, email, projectType, location, requirements, files } = req.body;

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
      customer.totalQuotations += 1;
      await customer.save();
    }

    const quotation = await Quotation.create({
      customer: customer._id,
      name,
      company,
      phone,
      email,
      projectType,
      location,
      requirements,
      files: files || []
    });

    if (email) {
      await sendEmail(emailTemplates.quotationConfirmation(quotation));
    }

    res.status(201).json({
      success: true,
      message: 'Quotation request submitted successfully',
      quotation: {
        id: quotation._id,
        quotationId: quotation.quotationId,
        status: quotation.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Admin
const getAllQuotations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { quotationId: { $regex: search, $options: 'i' } },
        { projectType: { $regex: search, $options: 'i' } }
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Quotation.countDocuments(query);

    res.json({
      success: true,
      quotations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Admin
const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json({ success: true, quotation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation (admin response)
// @route   PUT /api/quotations/:id
// @access  Admin
const updateQuotation = async (req, res) => {
  try {
    const { status, quotedAmount, quoteDetails, validUntil, notes } = req.body;

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (status) quotation.status = status;
    if (quotedAmount) quotation.quotedAmount = quotedAmount;
    if (quoteDetails) quotation.quoteDetails = quoteDetails;
    if (validUntil) quotation.validUntil = new Date(validUntil);
    if (notes) quotation.notes = notes;

    await quotation.save();

    res.json({ success: true, message: 'Quotation updated', quotation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Admin
const deleteQuotation = async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get quotation stats
// @route   GET /api/quotations/stats/overview
// @access  Admin
const getQuotationStats = async (req, res) => {
  try {
    const total = await Quotation.countDocuments();
    const pending = await Quotation.countDocuments({ status: 'pending' });
    const reviewing = await Quotation.countDocuments({ status: 'reviewing' });
    const quoted = await Quotation.countDocuments({ status: 'quoted' });
    const approved = await Quotation.countDocuments({ status: 'approved' });

    res.json({
      success: true,
      stats: { total, pending, reviewing, quoted, approved }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  getQuotationStats
};
