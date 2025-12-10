const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, "SKU is required"],
    unique: true,
    trim: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [200, "Product name must not exceed 200 characters"],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category ID is required"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description must not exceed 1000 characters"],
  },
  // costPrice: {
  //   type: Number,
  //   required: [true, "Cost price is required"],
  //   min: [0, "Cost price must be a positive number"],
  // },
  sellingPrice: {
    type: Number,
    required: [true, "Selling price is required"],
    min: [0, "Selling price must be a positive number"],
  },
  // supplierId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Supplier",
  //   required: [true, "Supplier ID is required"],
  // },
  // status: {
  //   type: String,
  //   enum: ["Active", "Inactive"],
  //   default: "Active",
  // },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// populate category
productSchema.virtual("category", {
  ref: "Category", // the model to populate
  localField: "categoryId", // field in Product
  foreignField: "_id", // field in Category
  justOne: true, // only a single object
});
// Remove categoryId
productSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.categoryId; // remove the original field
    delete ret.id; // remove id if you don't want it

    return ret;
  },
});
productSchema.set("toObject", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.categoryId; // remove the original field
    delete ret.id; // remove id if you don't want it

    return ret;
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
