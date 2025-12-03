const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: [true, "Partner ID is required"],
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product ID is required"],
      },
      quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
      },
      _id: false, // Disable _id for subdocuments
    },
  ],
  transactionType: {
    type: String,
    required: [true, "Transaction type is required"],
    enum: {
      values: ["addition", "subtraction"],
      message: "Transaction type must be either addition or subtraction",
    },
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, "Note cannot exceed 500 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
transactionSchema.index({ "products.productId": 1, createdAt: -1 });
transactionSchema.index({ partnerId: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
