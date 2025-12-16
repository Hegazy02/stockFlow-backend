const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: [
      function () {
        return (
          this.transactionType === "purchases" ||
          this.transactionType === "deposit_suppliers" ||
          this.transactionType === "deposit_customers"
        );
      },
      function () {
        if (
          this.transactionType === "purchases" ||
          this.transactionType === "deposit_suppliers" ||
          this.transactionType === "deposit_customers"
        ) {
          return "Partner is required for this transactions";
        }
      },
    ],
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
      costPrice: {
        type: Number,
        required: [true, "Cost price is required"],
        min: [0, "Cost price cannot be negative"],
      },
      _id: false, // Disable _id for subdocuments
    },
  ],
  transactionType: {
    type: String,
    required: [true, "Transaction type is required"],
    enum: {
      values: ["sales", "purchases", "deposit_suppliers", "deposit_customers"],
      message:
        "Transaction type must be either sales or purchases or deposit_suppliers or deposit_customers",
    },
  },
  balance: {
    type: Number,
    required: [true, "Balance is required"],
    min: [0, "Balance cannot be negative"],
    default: 0,
  },
  paid: {
    type: Number,
    required: [true, "Paid amount is required"],
    min: [0, "Paid amount cannot be negative"],
    default: 0,
  },
  left: {
    type: Number,
    min: [0, "Left amount cannot be negative"],
    default: 0,
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

// Pre-save hook to calculate 'left' field
transactionSchema.pre("save", function (next) {
  this.left = this.balance - this.paid;
  next();
});

// Pre-update hook to calculate 'left' field
transactionSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    const balance =
      update.$set.balance !== undefined ? update.$set.balance : null;
    const paid = update.$set.paid !== undefined ? update.$set.paid : null;

    if (balance !== null || paid !== null) {
      // We need to fetch the current document to get missing values
      this.model.findOne(this.getQuery()).then((doc) => {
        if (doc) {
          const newBalance = balance !== null ? balance : doc.balance;
          const newPaid = paid !== null ? paid : doc.paid;
          update.$set.left = newBalance - newPaid;
        }
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Index for faster queries
transactionSchema.index({ "products.productId": 1, createdAt: -1 });
transactionSchema.index({ partnerId: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
