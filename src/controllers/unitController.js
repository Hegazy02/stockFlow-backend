const Unit = require('../models/Unit');

// Create a new unit
const createUnit = async (req, res, next) => {
  try {
    const { name, abbreviation, description, status } = req.body;

    // Check for duplicate name
    const existingName = await Unit.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this name already exists'
      });
    }

    // Check for duplicate abbreviation
    const existingAbbr = await Unit.findOne({ 
      abbreviation: { $regex: new RegExp(`^${abbreviation}$`, 'i') } 
    });
    if (existingAbbr) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this abbreviation already exists'
      });
    }

    const unit = new Unit({
      name,
      abbreviation,
      description,
      status
    });

    await unit.save();

    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: unit
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Unit with this ${field} already exists`
      });
    }
    next(error);
  }
};

// Get all units with filtering and pagination
const getAllUnits = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search in name, abbreviation, or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { abbreviation: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Unit.countDocuments(query);

    const units = await Unit.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: units,
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

// Get a single unit by ID
const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findById(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    next(error);
  }
};

// Update a unit
const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check for duplicate name (excluding current unit)
    if (updateData.name) {
      const existingName = await Unit.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'Unit with this name already exists'
        });
      }
    }

    // Check for duplicate abbreviation (excluding current unit)
    if (updateData.abbreviation) {
      const existingAbbr = await Unit.findOne({
        _id: { $ne: id },
        abbreviation: { $regex: new RegExp(`^${updateData.abbreviation}$`, 'i') }
      });
      if (existingAbbr) {
        return res.status(400).json({
          success: false,
          message: 'Unit with this abbreviation already exists'
        });
      }
    }

    const unit = await Unit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      data: unit
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Unit with this ${field} already exists`
      });
    }
    next(error);
  }
};

// Delete a unit
const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByIdAndDelete(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully',
      data: unit
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete units
const bulkDeleteUnits = async (req, res, next) => {
  try {
    const { ids } = req.body;

    const result = await Unit.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} unit(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  bulkDeleteUnits
};
