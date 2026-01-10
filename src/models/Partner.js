const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Partner name is required"],
    trim: true,
    maxlength: [100, "Partner name cannot exceed 100 characters"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  type: {
    type: String,
    required: [true, "Partner type is required"],
    enum: {
      values: ["Customer", "Supplier"],
      message: "Type must be either Customer or Supplier",
    },
  },
  balance: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Number,
    default: 0,
  },
  left: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
partnerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update timestamp on update
partnerSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Static method to recalculate partner balance, paid, and left from transactions
partnerSchema.statics.recalculateFromTransactions = async function (partnerId) {
  if (!partnerId) {
    return null;
  }

  const Transaction = mongoose.model("Transaction");

  // Ensure partnerId is converted to ObjectId
  let partnerObjectId;
  try {
    partnerObjectId =
      partnerId instanceof mongoose.Types.ObjectId
        ? partnerId
        : new mongoose.Types.ObjectId(partnerId);
  } catch (error) {
    throw new Error(`Invalid partnerId: ${partnerId}`);
  }

  // Aggregate transactions for this partner
  const result = await Transaction.aggregate([
    {
      $match: {
        partnerId: partnerObjectId,
      },
    },
    {
      $group: {
        _id: null,
        totalBalance: {
          $sum: {
            $cond: {
              if: {
                $in: ["$transactionType", ["return_purchases", "return_sales"]],
              },
              then: { $multiply: [{ $ifNull: ["$balance", 0] }, -1] },
              else: { $ifNull: ["$balance", 0] },
            },
          },
        },
        totalPaid: {
          $sum: {
            $cond: {
              if: {
                $in: ["$transactionType", ["return_purchases", "return_sales"]],
              },
              then: { $multiply: [{ $ifNull: ["$paid", 0] }, -1] },
              else: { $ifNull: ["$paid", 0] },
            },
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalBalance = result.length > 0 ? result[0].totalBalance || 0 : 0;
  const totalPaid = result.length > 0 ? result[0].totalPaid || 0 : 0;
  const totalLeft = totalBalance - totalPaid;

  // Update partner with calculated values
  const partner = await this.findByIdAndUpdate(
    partnerObjectId,
    {
      balance: totalBalance,
      paid: totalPaid,
      left: totalLeft,
      updatedAt: Date.now(),
    },
    { new: true, runValidators: true }
  );

  return partner;
};

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = Partner;
