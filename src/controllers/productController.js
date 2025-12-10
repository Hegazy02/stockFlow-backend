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

    // Build match stage for filtering
    const matchStage = {};
    if (status) matchStage.status = status;
    if (categoryId) {
      matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (name) {
      matchStage.name = { $regex: name, $options: "i" };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregation pipeline to calculate quantity from transactions
    const products = await Product.aggregate([
      // Match products based on filters
      { $match: matchStage },
      
      // Lookup transactions that contain this product
      {
        $lookup: {
          from: "transactions",
          let: { productId: "$_id" },
          pipeline: [
            { $unwind: "$products" },
            { $match: { $expr: { $eq: ["$products.productId", "$$productId"] } } },
            {
              $project: {
                transactionType: 1,
                quantity: "$products.quantity"
              }
            }
          ],
          as: "transactions"
        }
      },
      
      // Calculate quantity from transactions
      {
        $addFields: {
          quantity: {
            $reduce: {
              input: "$transactions",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.transactionType", "purchases"] },
                  { $add: ["$$value", "$$this.quantity"] },
                  { $subtract: ["$$value", "$$this.quantity"] }
                ]
              }
            }
          }
        }
      },
      
      // Lookup category information
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      
      // Unwind category array (convert from array to object)
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Project only needed category fields
      {
        $addFields: {
          category: {
            _id: "$category._id",
            name: "$category.name"
          }
        }
      },
      
      // Remove transactions array from output
      {
        $project: {
          transactions: 0
        }
      },
      
      // Sort by creation date (newest first)
      { $sort: { createdAt: -1 } },
      
      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination
    const totalResult = await Product.aggregate([
      { $match: matchStage },
      { $count: "total" }
    ]);
    
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

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

    // Use aggregation to calculate quantity from transactions
    const products = await Product.aggregate([
      // Match the specific product
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      
      // Lookup transactions that contain this product
      {
        $lookup: {
          from: "transactions",
          let: { productId: "$_id" },
          pipeline: [
            { $unwind: "$products" },
            { $match: { $expr: { $eq: ["$products.productId", "$$productId"] } } },
            {
              $project: {
                transactionType: 1,
                quantity: "$products.quantity"
              }
            }
          ],
          as: "transactions"
        }
      },
      
      // Calculate quantity from transactions
      {
        $addFields: {
          quantity: {
            $reduce: {
              input: "$transactions",
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ["$$this.transactionType", "sales"] },
                  { $add: ["$$value", "$$this.quantity"] },
                  { $subtract: ["$$value", "$$this.quantity"] }
                ]
              }
            }
          }
        }
      },
      
      // Lookup category information
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      
      // Unwind category array
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Project only needed category fields
      {
        $addFields: {
          category: {
            _id: "$category._id",
            name: "$category.name"
          }
        }
      },
      
      // Remove transactions array from output
      {
        $project: {
          transactions: 0
        }
      }
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: products[0],
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

    // Check if product exists
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is used in any transactions
    const Transaction = require("../models/Transaction");
    const transactionCount = await Transaction.countDocuments({
      "products.productId": new mongoose.Types.ObjectId(id),
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete product that has been used in transactions",
        transactionCount: transactionCount,
      });
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

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

    // Check if any products are used in transactions
    const Transaction = require("../models/Transaction");
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    const productsInTransactions = await Transaction.aggregate([
      { $unwind: "$products" },
      { $match: { "products.productId": { $in: objectIds } } },
      {
        $group: {
          _id: "$products.productId",
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          name: "$product.name",
          sku: "$product.sku",
          transactionCount: 1,
        },
      },
    ]);

    if (productsInTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete products that have been used in transactions",
        productsInTransactions: productsInTransactions,
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
