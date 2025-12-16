const Partner = require("../models/Partner");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Create a new partner
const createPartner = async (req, res, next) => {
  try {
    const { name, phoneNumber, description, type } = req.body;

    const partner = new Partner({
      name,
      phoneNumber,
      description,
      type,
    });

    await partner.save();

    res.status(201).json({
      success: true,
      message: "Partner created successfully",
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// Get all partners with filtering and pagination
const getAllPartners = async (req, res, next) => {
  try {
    const { type, name, page = 1, limit = 10 } = req.query;

    // Build match stage for filtering
    const matchStage = {};
    console.log("tyyyype", type);

    // Filter by type
    if (type) {
      if (type.toLowerCase().includes("customer") || type == "sales") {
        matchStage.type = { $in: ["Customer"] };
      } else if (type.toLowerCase().includes("supplier") || type == "purchases") {
        matchStage.type = { $in: ["Supplier"] };
      } else {
        matchStage.type = { $in: ["Customer", "Supplier"] };
      }
    }

    // Search in name, phoneNumber, or description
    if (name) {
      matchStage.$or = [
        { name: { $regex: name, $options: "i" } },
        { phoneNumber: { $regex: name, $options: "i" } },
        { description: { $regex: name, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build aggregation pipeline
    const pipeline = [
      // 1️⃣ Match partners based on filters
      { $match: matchStage },

      // 2️⃣ Sort before lookup to ensure consistent ordering
      { $sort: { createdAt: -1, _id: -1 } },

      // 3️⃣ Lookup transactions for each partner
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "partnerId",
          as: "transactions",
        },
      },

      // 4️⃣ Unwind transactions to calculate sums
      {
        $unwind: {
          path: "$transactions",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 5️⃣ Group back by partner and calculate totals
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          phoneNumber: { $first: "$phoneNumber" },
          description: { $first: "$description" },
          type: { $first: "$type" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          balance: {
            $sum: { $ifNull: ["$transactions.balance", 0] },
          },
          paid: {
            $sum: { $ifNull: ["$transactions.paid", 0] },
          },
        },
      },

      // 6️⃣ Calculate left (balance - paid)
      {
        $addFields: {
          left: { $subtract: ["$balance", "$paid"] },
        },
      },

      // 7️⃣ Sort by createdAt descending, then by _id for consistent ordering
      { $sort: { createdAt: -1, _id: -1 } },

      // 8️⃣ Get total count before pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    // Execute aggregation
    const result = await Partner.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const partners = result[0]?.data || [];

    // Preserve order by mapping with index and sorting results
    const partnerIds = partners.map((p) => p._id.toString());

    // Update partner documents in database with calculated values
    const updatePromises = partners.map((partner) =>
      Partner.findByIdAndUpdate(
        partner._id,
        {
          balance: partner.balance,
          paid: partner.paid,
          left: partner.left,
          updatedAt: Date.now(),
        },
        { new: true, runValidators: true }
      )
    );

    // Wait for all updates to complete
    const updatedPartners = await Promise.all(updatePromises);

    // Ensure order is preserved by sorting updated partners by original order
    const updatedPartnersMap = new Map(
      updatedPartners.map((p) => [p._id.toString(), p])
    );
    const orderedPartners = partnerIds.map((id) => updatedPartnersMap.get(id));

    res.status(200).json({
      success: true,
      data: orderedPartners,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single partner by ID
const getPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Recalculate balance, paid, and left from transactions
    partner = await Partner.recalculateFromTransactions(id);

    res.status(200).json({
      success: true,
      data: partner,
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

    // Remove balance, paid, and left from updateData as they are calculated from transactions
    delete updateData.balance;
    delete updateData.paid;
    delete updateData.left;

    let partner = await Partner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Recalculate balance, paid, and left from transactions
    partner = await Partner.recalculateFromTransactions(id);

    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
      data: partner,
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
        message: "Partner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Partner deleted successfully",
      data: partner,
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
        deletedCount: result.deletedCount,
      },
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
  bulkDeletePartners,
};
