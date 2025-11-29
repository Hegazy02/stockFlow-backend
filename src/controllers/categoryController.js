const Category = require("../models/Category");

/**
 * Create a new category
 * @route POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    // Check if category with same name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: name.trim(),
    }).collation({ locale: "en", strength: 2 });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Create new category
    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      status: status || "Active",
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }
    next(error);
  }
};

/**
 * Get all categories with optional filtering
 * @route GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    // Build filter object
    const filter = {};

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    // Search in name or description if search term provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get categories with pagination and sorting
    const categories = await Category.find(filter).sort({ createdAt: -1 }); // Sort by creation date descending (newest first)

    // Get total count for pagination
    const total = await Category.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: null,
        limit: null,
        pages: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single category by ID
 * @route GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing category
 * @route PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If name is being updated, check for duplicates (excluding current category)
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id },
      }).collation({ locale: "en", strength: 2 });

      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description ? description.trim() : description;
    if (status !== undefined) updateData.status = status;

    // Update category with validation
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }
    next(error);
  }
};

/**
 * Delete a single category
 * @route DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find and delete the category
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete multiple categories
 * @route POST /api/categories/bulk-delete
 */
const bulkDeleteCategories = async (req, res, next) => {
  try {
    const { ids } = req.body;

    // Delete all categories with matching IDs
    const result = await Category.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} category(ies) deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
};
