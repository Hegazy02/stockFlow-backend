const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
    maxlength: [100, "Category name must not exceed 100 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description must not exceed 500 characters"],
  },
  status: {
    type: String,
    enum: {
      values: ["Active", "Inactive"],
      message: "Status must be either Active or Inactive",
    },
    default: "Active",
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


// Create index on status field for filtering
categorySchema.index({ status: 1 });

// Update the updatedAt timestamp before saving
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt timestamp before updating
categorySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
