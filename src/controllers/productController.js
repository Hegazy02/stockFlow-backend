const Product = require("../models/Product");
const mongoose = require("mongoose");

/**
 * Create a new product
 * @route POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      sku,
      name,
      categoryId,
      description,
      costPrice,
      sellingPrice,
      supplierId,
      status,
    } = req.body;

    // Check if product with same SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }

    // Create new product
    const product = new Product({
      sku: sku.toUpperCase(),
      name,
      categoryId,
      description,
      costPrice,
      sellingPrice,
      supplierId,
      status: status || "Active",
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }
    next(error);
  }
};

/**
 * Get all products with optional filtering
 * @route GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { status, categoryId, name, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (categoryId) {
      // Convert categoryId string to ObjectId for proper MongoDB comparison
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products with pagination
    const products = await Product.find(filter)
      .populate("category", "name") // populate the virtual
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single product by ID
 * @route GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category", "name"); // populate the virtual
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a product by ID
 * @route PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If SKU is being updated, check for duplicates
    if (updateData.sku) {
      const existingProduct = await Product.findOne({
        sku: updateData.sku.toUpperCase(),
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists",
        });
      }

      updateData.sku = updateData.sku.toUpperCase();
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }
    next(error);
  }
};

/**
 * Delete a product by ID
 * @route DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete products by IDs
 * @route POST /api/products/bulk-delete
 */
const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;

    // Validate that ids array is provided and not empty
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs",
      });
    }

    // Delete multiple products
    const result = await Product.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} product(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
        requestedCount: ids.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
};
