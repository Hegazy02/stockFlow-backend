const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Partner = require("../models/Partner");
const mongoose = require("mongoose");

// Create a new transaction (single transaction with multiple products)
const createTransaction = async (req, res, next) => {
  try {
    const { partnerId, products, transactionType, balance, paid, note } =
      req.body;

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
                  $add: [
                    "$$value",
                    {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $or: [
                                {
                                  $eq: ["$$this.transactionType", "purchases"],
                                },
                                {
                                  $eq: [
                                    "$$this.transactionType",
                                    "return_sales",
                                  ],
                                },
                              ],
                            },
                            then: "$$this.quantity",
                          },
                          {
                            case: {
                              $or: [
                                { $eq: ["$$this.transactionType", "sales"] },
                                {
                                  $eq: [
                                    "$$this.transactionType",
                                    "return_purchases",
                                  ],
                                },
                              ],
                            },
                            then: { $multiply: ["$$this.quantity", -1] },
                          },
                        ],
                        default: 0,
                      },
                    },
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

    // 5️⃣ Create transaction
    const transaction = new Transaction({
      partnerId: partnerId || null,
      products: products.map((p) => {
        const productFromDb = existingProducts.find(
          (ep) => ep._id.toString() === p.productId
        );

        return {
          productId: p.productId,
          quantity: parseInt(p.quantity),
          // ✅ STORE PRICES (fallback to database values if not provided)
          costPrice: parseFloat(p.costPrice ?? productFromDb.costPrice),
          sellingPrice: parseFloat(
            p.sellingPrice ?? productFromDb.sellingPrice
          ),
        };
      }),
      transactionType,
      balance: finalBalance,
      paid: finalPaid,
      note: note || "",
    });

    await transaction.save();

    // 6️⃣ Recalculate partner balance, paid, and left if partner exists
    if (transaction.partnerId) {
      // Extract ID if partnerId is populated, otherwise use directly
      const partnerIdToRecalc =
        transaction.partnerId._id || transaction.partnerId;
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
      sellingPrice: item.sellingPrice,
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
      serialNumber,
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

    // Filter by serialNumber
    if (serialNumber) {
      matchStage.serialNumber = { $regex: serialNumber, $options: "i" };
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
                sellingPrice: "$$prod.sellingPrice",
                productInfo: {
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
                      _id: "$$matchedProduct._id",
                      name: "$$matchedProduct.name",
                      sku: "$$matchedProduct.sku",
                      sellingPrice: {
                        $ifNull: [
                          "$$prod.sellingPrice",
                          "$$matchedProduct.sellingPrice",
                        ],
                      },
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

      // 9️⃣ Calculate totalQuantity and product summary
      {
        $addFields: {
          totalQuantity: {
            $cond: {
              if: {
                $and: [
                  { $isArray: "$products" },
                  { $gt: [{ $size: "$products" }, 0] },
                ],
              },
              then: {
                $reduce: {
                  input: "$products",
                  initialValue: 0,
                  in: {
                    $add: ["$$value", { $ifNull: ["$$this.quantity", 0] }],
                  },
                },
              },
              else: 0,
            },
          },
          productCount: {
            $cond: {
              if: { $isArray: "$products" },
              then: { $size: "$products" },
              else: 0,
            },
          },
          firstProductName: {
            $cond: {
              if: {
                $and: [
                  { $isArray: "$products" },
                  { $gt: [{ $size: "$products" }, 0] },
                ],
              },
              then: {
                $let: {
                  vars: {
                    firstProduct: { $arrayElemAt: ["$products", 0] },
                  },
                  in: { $ifNull: ["$$firstProduct.productInfo.name", null] },
                },
              },
              else: null,
            },
          },
        },
      },

      // 🔟 Clean up fields and format product display
      {
        $project: {
          _id: 1,
          partnerId: 1,
          transactionType: 1,
          serialNumber: 1,
          createdAt: 1,
          note: 1,
          balance: 1,
          paid: 1,
          left: 1,
          totalQuantity: 1,

          "partner.name": 1,
          "partner.type": 1,

          productDisplay: {
            $cond: {
              if: { $eq: ["$productCount", 0] },
              then: null,
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$productCount", 1] },
                      { $ne: ["$firstProductName", null] },
                    ],
                  },
                  then: "$firstProductName",
                  else: {
                    $concat: [{ $toString: "$productCount" }, " products"],
                  },
                },
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

    let matchQuery = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      matchQuery = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      matchQuery = { serialNumber: id };
    }

    const transactions = await Transaction.aggregate([
      // Match the specific transaction
      { $match: matchQuery },

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
                    _id: "$$matchedProduct._id",
                    name: "$$matchedProduct.name",
                    sku: "$$matchedProduct.sku",
                    quantity: "$$prod.quantity",
                    //if transactionType is sales or return_sales then total = quantity * sellingPrice else total = quantity * costPrice
                    total: {
                      $cond: {
                        if: {
                          $in: ["$transactionType", ["sales", "return_sales"]],
                        },
                        then: {
                          $multiply: [
                            "$$prod.quantity",
                            {
                              $ifNull: [
                                "$$prod.sellingPrice",
                                "$$matchedProduct.sellingPrice",
                              ],
                            },
                          ],
                        },
                        else: {
                          $multiply: ["$$prod.quantity", "$$prod.costPrice"],
                        },
                      },
                    },
                    price: {
                      $cond: {
                        if: {
                          $in: ["$transactionType", ["sales", "return_sales"]],
                        },
                        then: {
                          $ifNull: [
                            "$$prod.sellingPrice",
                            "$$matchedProduct.sellingPrice",
                          ],
                        },
                        else: "$$prod.costPrice",
                      },
                    },
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
          serialNumber: 1,
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
      const partnerIdToRecalc =
        transaction.partnerId._id || transaction.partnerId;
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
    const partnerIds = [
      ...new Set(transactions.map((t) => t.partnerId).filter(Boolean)),
    ];

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
      return_sales: { totalQuantity: 0, count: 0 },
      return_purchases: { totalQuantity: 0, count: 0 },
    };

    stats.forEach((stat) => {
      if (formattedStats[stat._id]) {
        formattedStats[stat._id] = {
          totalQuantity: stat.totalQuantity,
          count: stat.count,
        };
      }
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    next(error);
  }
};

// Get all transactions for a specific partner with totals
const getPartnerTransactions = async (req, res, next) => {
  try {
    const { partnerId, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    // Verify partner exists
    const partnerExists = await Partner.exists({ _id: partnerObjectId });
    if (!partnerExists) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const matchStage = {
      partnerId: partnerObjectId,
    };

    // =======================
    // Main data pipeline
    // =======================
    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "partners",
          localField: "partnerId",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: { path: "$partner", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "prod",
              in: {
                productId: "$$prod.productId",
                quantity: "$$prod.quantity",
                costPrice: "$$prod.costPrice",
                sellingPrice: "$$prod.sellingPrice",
                productInfo: {
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
                      _id: "$$matchedProduct._id",
                      name: "$$matchedProduct.name",
                      sku: "$$matchedProduct.sku",
                      sellingPrice: {
                        $ifNull: [
                          "$$prod.sellingPrice",
                          "$$matchedProduct.sellingPrice",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },

      {
        $addFields: {
          totalQuantity: {
            $reduce: {
              input: "$products",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.quantity"] },
            },
          },
          productCount: { $size: "$products" },
          firstProductName: {
            $arrayElemAt: ["$products.productInfo.name", 0],
          },
        },
      },

      {
        $project: {
          _id: 1,
          transactionType: 1,
          serialNumber: 1,
          createdAt: 1,
          note: 1,
          balance: 1,
          paid: 1,
          left: 1,
          totalQuantity: 1,

          "partner.name": 1,
          "partner.type": 1,

          productDisplay: {
            $cond: {
              if: { $eq: ["$productCount", 0] },
              then: null,
              else: {
                $cond: {
                  if: { $eq: ["$productCount", 1] },
                  then: "$firstProductName",
                  else: {
                    $concat: [{ $toString: "$productCount" }, " products"],
                  },
                },
              },
            },
          },
        },
      },
    ];

    // =======================
    // Count pipeline
    // =======================
    const countPipeline = [{ $match: matchStage }, { $count: "total" }];

    // =======================
    // Totals pipeline
    // =======================
    const totalsPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          balance: { $sum: { $ifNull: ["$balance", 0] } },
          paid: { $sum: { $ifNull: ["$paid", 0] } },
        },
      },
      {
        $addFields: {
          left: { $subtract: ["$balance", "$paid"] },
        },
      },
    ];

    // Run in parallel 🚀
    const [data, countResult, totalsResult] = await Promise.all([
      Transaction.aggregate(pipeline),
      Transaction.aggregate(countPipeline),
      Transaction.aggregate(totalsPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const totals = totalsResult[0] || { balance: 0, paid: 0, left: 0 };

    res.status(200).json({
      success: true,
      data: {
        transactions: data,
        totals: totals,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Return products from a transaction
const returnProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { products, note } = req.body;

    // 1️⃣ Find the original transaction
    const originalTransaction = await Transaction.findById(id).populate(
      "products.productId",
      "name"
    );
    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: "Original transaction not found",
      });
    }

    if (!["sales", "purchases"].includes(originalTransaction.transactionType)) {
      return res.status(400).json({
        success: false,
        message: "Returns can only be made for sales or purchases transactions",
      });
    }

    // Determine return type
    const returnType =
      originalTransaction.transactionType === "sales"
        ? "return_sales"
        : "return_purchases";

    // 2️⃣ Fetch any existing returns for this transaction to calculate remaining quantities
    const previousReturns = await Transaction.find({
      originalTransactionId: originalTransaction._id,
    });

    // 3️⃣ Validate returned products and quantities
    const returnProductsData = [];
    let totalReturnBalance = 0;

    for (const returnItem of products) {
      const originalItem = originalTransaction.products.find((p) => {
        const prodId = p.productId._id ? p.productId._id : p.productId;
        return prodId.toString() === returnItem.productId;
      });

      if (!originalItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${returnItem.productId} was not part of the original transaction`,
        });
      }

      // Calculate already returned quantity
      const alreadyReturned = previousReturns.reduce((sum, ret) => {
        const item = ret.products.find(
          (p) => p.productId.toString() === returnItem.productId
        );
        return sum + (item ? item.quantity : 0);
      }, 0);

      const remainingQuantity = originalItem.quantity - alreadyReturned;

      // Check if quantity exceeds remaining
      if (parseInt(returnItem.quantity) > remainingQuantity) {
        const productName = originalItem.productId.name || "Unknown Product";
        return res.status(400).json({
          success: false,
          message: `Return quantity for product ${productName} exceeds remaining quantity (${remainingQuantity}). Original: ${originalItem.quantity}, Already returned: ${alreadyReturned}`,
        });
      }

      // Calculate balance contribution (use original price stored in transaction)
      const priceUsed =
        originalTransaction.transactionType === "sales"
          ? originalItem.sellingPrice
          : originalItem.costPrice;
      totalReturnBalance += priceUsed * parseInt(returnItem.quantity);

      returnProductsData.push({
        productId: returnItem.productId,
        quantity: parseInt(returnItem.quantity),
        costPrice: originalItem.costPrice,
        sellingPrice: originalItem.sellingPrice,
      });
    }

    // 4️⃣ Create return transaction
    const returnTransaction = new Transaction({
      partnerId: originalTransaction.partnerId,
      products: returnProductsData,
      transactionType: returnType,
      balance: totalReturnBalance,
      paid: 0, // Default to 0, usually returns result in credit or refund handled separately
      note:
        note ||
        `Return for transaction ${
          originalTransaction.serialNumber || originalTransaction._id
        }`,
      originalTransactionId: originalTransaction._id,
    });

    await returnTransaction.save();

    // 5️⃣ Recalculate partner balance if exists
    if (returnTransaction.partnerId) {
      await Partner.recalculateFromTransactions(returnTransaction.partnerId);
    }

    // 6️⃣ Populate references for response
    await returnTransaction.populate([
      { path: "products.productId", select: "name sku" },
      { path: "partnerId", select: "name type" },
    ]);

    // Format response
    const responseData = returnTransaction.toObject();
    responseData.products = responseData.products.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
    }));

    res.status(201).json({
      success: true,
      message: "Return transaction created successfully",
      data: responseData,
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
  getPartnerTransactions,
  returnProducts,
};
