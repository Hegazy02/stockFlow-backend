const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Partner = require("../models/Partner");
const mongoose = require("mongoose");

// Create a new transaction (single transaction with multiple products)
const createTransaction = async (req, res, next) => {
  try {
    const { partnerId, products, transactionType, balance, paid, note } =
      req.body;
console.log("@@@@@@ transaction Type:",transactionType);

    // 1️⃣ Verify partner exists
    const partner = await Partner.findById(partnerId);
    if (!partner && transactionType == "purchases") {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // 2️⃣ Verify all products exist
    const productIds = [...new Set(products.map((p) => p.productId))];
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    if (existingProducts.length !== productIds.length) {
      const foundIds = existingProducts.map((p) => p._id.toString());
      const missingIds = productIds.filter((id) => !foundIds.includes(id));

      return res.status(404).json({
        success: false,
        message: "One or more products not found",
        missingProductIds: missingIds,
      });
    }

    // 3️⃣ Validate stock for sales
    if (transactionType === "sales") {
      // Compute current stock for each product
      const currentQuantities = await Product.aggregate([
        {
          $match: {
            _id: {
              $in: productIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $lookup: {
            from: "transactions",
            let: { productId: "$_id" },
            pipeline: [
              { $unwind: "$products" },
              {
                $match: {
                  $expr: { $eq: ["$products.productId", "$$productId"] },
                },
              },
              {
                $project: {
                  transactionType: 1,
                  quantity: "$products.quantity",
                },
              },
            ],
            as: "transactions",
          },
        },
        {
          $addFields: {
            currentQuantity: {
              $reduce: {
                input: "$transactions",
                initialValue: 0,
                in: {
                  $cond: [
                    { $eq: ["$$this.transactionType", "purchases"] }, // if addition (purchase)
                    { $add: ["$$value", "$$this.quantity"] }, // increase stock
                    { $subtract: ["$$value", "$$this.quantity"] }, // else (sales) decrease stock
                  ],
                },
              },
            },
          },
        },
        { $project: { _id: 1, name: 1, sku: 1, currentQuantity: 1 } },
      ]);

      // Check for insufficient stock
      const insufficientProducts = [];
      for (const product of products) {
        const productData = currentQuantities.find(
          (p) => p._id.toString() === product.productId
        );
        if (productData) {
          const newQuantity =
            productData.currentQuantity - parseInt(product.quantity);
          if (newQuantity < 0) {
            insufficientProducts.push({
              productId: productData._id,
              name: productData.name,
              sku: productData.sku,
              currentQuantity: productData.currentQuantity,
              requestedQuantity: parseInt(product.quantity),
              shortage: Math.abs(newQuantity),
            });
          }
        }
      }

      if (insufficientProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Insufficient quantity for one or more products",
          insufficientProducts,
        });
      }
    }

    // 4️⃣ Validate payment
    const finalBalance = balance || 0;
    const finalPaid = paid || 0;
    if (+finalPaid > +finalBalance) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be more than balance",
        balance: finalBalance,
        paid: finalPaid,
      });
    }

    // 5️⃣ Create transaction
    const transaction = new Transaction({
      partnerId: partnerId || null,
      products: products.map((p) => ({
        productId: p.productId,
        quantity: parseInt(p.quantity),
        costPrice: parseFloat(p.costPrice),
      })),
      transactionType,
      balance: finalBalance,
      paid: finalPaid,
      note: note || "",
    });

    await transaction.save();

    // 6️⃣ Recalculate partner balance, paid, and left if partner exists
    if (transaction.partnerId) {
      // Extract ID if partnerId is populated, otherwise use directly
      const partnerIdToRecalc = transaction.partnerId._id || transaction.partnerId;
      await Partner.recalculateFromTransactions(partnerIdToRecalc);
    }

    // 7️⃣ Populate references conditionally
    const populateOptions = [
      { path: "products.productId", select: "name sku costPrice" },
    ];

    if (transaction.partnerId) {
      populateOptions.push({
        path: "partnerId",
        select: "name type",
      });
    }

    await transaction.populate(populateOptions);

    // 7️⃣ Format response
    const responseData = transaction.toObject();
    responseData.products = responseData.products.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      costPrice: item.costPrice,
    }));

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Get all transactions with filtering and pagination
const getAllTransactions = async (req, res, next) => {
  try {
    const {
      product,
      partner,
      transactionType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let matchStage = {};

    // Filter by transactionType
    if (transactionType) {
      matchStage.transactionType = transactionType;
    }

    // Filter by date range
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Filter by product name if provided
    if (product) {
      matchStage["products.productId"] = { $exists: true };
    }

    const pipeline = [
      // 1️⃣ Apply basic filters
      { $match: matchStage },

      // 2️⃣ Lookup partner
      {
        $lookup: {
          from: "partners",
          localField: "partnerId",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: { path: "$partner", preserveNullAndEmptyArrays: true } },

      // 3️⃣ Lookup products
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // 4️⃣ Combine product details with quantities
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "prod",
              in: {
                productId: "$$prod.productId",
                quantity: "$$prod.quantity",
                productInfo: {
                  $let: {
                    vars: {
                      matchedProduct: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$productDetails",
                              as: "detail",
                              cond: { $eq: ["$$detail._id", "$$prod.productId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$matchedProduct._id",
                      name: "$$matchedProduct.name",
                      sku: "$$matchedProduct.sku",
                      sellingPrice: "$$matchedProduct.sellingPrice",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // 5️⃣ Filter by partner name
      ...(partner
        ? [
            {
              $match: {
                "partner.name": { $regex: partner, $options: "i" },
              },
            },
          ]
        : []),

      // 6️⃣ Filter by product name
      ...(product
        ? [
            {
              $match: {
                "products.productInfo.name": { $regex: product, $options: "i" },
              },
            },
          ]
        : []),

      // 7️⃣ Sort newest first
      { $sort: { createdAt: -1 } },

      // 8️⃣ Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },

      // 9️⃣ Clean up fields
      {
        $project: {
          _id: 1,
          partnerId: 1,
          transactionType: 1,
          createdAt: 1,
          note: 1,
          balance: 1,
          paid: 1,
          left: 1,

          "partner.name": 1,
          "partner.type": 1,

          products: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                productId: "$$p.productId",
                quantity: "$$p.quantity",
                costPrice: {
                  $cond: {
                    if: { $eq: ["$transactionType", "purchases"] },
                    then: "$$p.costPrice",
                    else: "$$REMOVE",
                  },
                },
                sellingPrice: {
                  $cond: {
                    if: { $eq: ["$transactionType", "sales"] },
                    then: "$$p.productInfo.sellingPrice",
                    else: "$$REMOVE",
                  },
                },
                name: "$$p.productInfo.name",
                sku: "$$p.productInfo.sku",
              },
            },
          },
        },
      },
    ];

    // Run pipeline
    const data = await Transaction.aggregate(pipeline);

    // Get total count (without pagination)
    const countPipeline = [...pipeline];
    countPipeline.splice(countPipeline.length - 3); // remove skip/limit/project
    countPipeline.push({ $count: "total" });

    const countResult = await Transaction.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data,
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

// Get a single transaction by ID
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transactions = await Transaction.aggregate([
      // Match the specific transaction
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Lookup partner
      {
        $lookup: {
          from: "partners",
          localField: "partnerId",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: { path: "$partner", preserveNullAndEmptyArrays: true } },

      // Lookup products
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // Combine product details with quantities
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "prod",
              in: {
                $let: {
                  vars: {
                    matchedProduct: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$productDetails",
                            as: "detail",
                            cond: {
                              $eq: ["$$detail._id", "$$prod.productId"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    product: {
                      _id: "$$matchedProduct._id",
                      name: "$$matchedProduct.name",
                      sku: "$$matchedProduct.sku",
                      sellingPrice: "$$matchedProduct.sellingPrice",
                    },
                    quantity: "$$prod.quantity",
                    costPrice: "$$prod.costPrice",
                    sellingPrice: "$$matchedProduct.sellingPrice",
                  },
                },
              },
            },
          },
        },
      },

      // Project final structure
      {
        $project: {
          _id: 1,
          partner: {
            _id: "$partner._id",
            name: "$partner.name",
            type: "$partner.type",
            phoneNumber: "$partner.phoneNumber",
          },
          products: 1,
          transactionType: 1,
          balance: 1,
          paid: 1,
          left: 1,
          note: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transactions[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update a transaction
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { balance, paid, note } = req.body;

    // Get current transaction to validate payment
    const currentTransaction = await Transaction.findById(id);

    if (!currentTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Calculate final balance and paid values
    const finalBalance =
      balance !== undefined ? balance : currentTransaction.balance;
    const finalPaid = paid !== undefined ? paid : currentTransaction.paid;

    // Validate that paid doesn't exceed balance
    if (finalPaid > finalBalance) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be more than balance",
        currentBalance: currentTransaction.balance,
        currentPaid: currentTransaction.paid,
        requestedBalance: balance,
        requestedPaid: paid,
      });
    }

    const updateData = {};
    if (balance !== undefined) updateData.balance = balance;
    if (paid !== undefined) updateData.paid = paid;
    if (note !== undefined) updateData.note = note;

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Recalculate partner balance, paid, and left if partner exists
    if (transaction.partnerId) {
      // Extract ID if partnerId is populated, otherwise use directly
      const partnerIdToRecalc = transaction.partnerId._id || transaction.partnerId;
      await Partner.recalculateFromTransactions(partnerIdToRecalc);
    }

    // Populate references for response
    await transaction.populate([
      { path: "products.productId", select: "name sku" },
      { path: "partnerId", select: "name type" },
    ]);

    // Transform response to use 'product' instead of 'productId'
    const responseData = transaction.toObject();
    responseData.products = responseData.products.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    }));

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a transaction
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get transaction before deleting to get partnerId
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const partnerId = transaction.partnerId;

    // Delete the transaction
    await Transaction.findByIdAndDelete(id);

    // Recalculate partner balance, paid, and left if partner exists
    if (partnerId) {
      // Extract ID if partnerId is populated, otherwise use directly
      const partnerIdToRecalc = partnerId._id || partnerId;
      await Partner.recalculateFromTransactions(partnerIdToRecalc);
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete transactions
const bulkDeleteTransactions = async (req, res, next) => {
  try {
    const { ids } = req.body;

    // Get transactions before deleting to collect unique partnerIds
    const transactions = await Transaction.find({ _id: { $in: ids } });
    const partnerIds = [...new Set(transactions.map(t => t.partnerId).filter(Boolean))];

    // Delete the transactions
    const result = await Transaction.deleteMany({ _id: { $in: ids } });

    // Recalculate partner balance, paid, and left for all affected partners
    for (const partnerId of partnerIds) {
      // Extract ID if partnerId is populated, otherwise use directly
      const partnerIdToRecalc = partnerId._id || partnerId;
      await Partner.recalculateFromTransactions(partnerIdToRecalc);
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} transaction(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res, next) => {
  try {
    const { productId, partnerId, startDate, endDate } = req.query;

    const matchQuery = {};

    if (productId)
      matchQuery["products.productId"] = new mongoose.Types.ObjectId(productId);
    if (partnerId)
      matchQuery.partnerId = new mongoose.Types.ObjectId(partnerId);
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$transactionType",
          totalQuantity: { $sum: "$products.quantity" },
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      sales: { totalQuantity: 0, count: 0 },
      purchases: { totalQuantity: 0, count: 0 },
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = {
        totalQuantity: stat.totalQuantity,
        count: stat.count,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  getTransactionStats,
};
