const Partner = require('../models/Partner');

// Create a new partner
const createPartner = async (req, res, next) => {
  try {
    const { name, phoneNumber, description, type } = req.body;

    const partner = new Partner({
      name,
      phoneNumber,
      description,
      type
    });

    await partner.save();

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

// Get all partners with filtering and pagination
const getAllPartners = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Search in name, phoneNumber, or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Partner.countDocuments(query);

    const partners = await Partner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: partners,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single partner by ID
const getPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

// Update a partner
const updatePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const partner = await Partner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Partner updated successfully',
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

// Delete a partner
const deletePartner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByIdAndDelete(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Partner deleted successfully',
      data: partner
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete partners
const bulkDeletePartners = async (req, res, next) => {
  try {
    const { ids } = req.body;

    const result = await Partner.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} partner(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPartner,
  getAllPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  bulkDeletePartners
};
