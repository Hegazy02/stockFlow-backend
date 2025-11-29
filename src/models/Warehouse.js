const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      unique: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    manager: {
      type: String,
      trim: true,
      maxlength: [100, "Manager cannot exceed 100 characters"],
    },
    // managerId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: [true, "Manager ID is required"],
    // },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
warehouseSchema.index({ managerId: 1 });
warehouseSchema.index({ status: 1 });

// // populate manager
// warehouseSchema.virtual("manager", {
//   ref: "User", // the model to populate
//   localField: "managerId", // field in warehouse
//   foreignField: "_id", // field in manage
//   justOne: true, // only a single object
// });
// warehouseSchema.set("toJSON", {
//   virtuals: true,
//   transform: (doc, ret) => {
//     delete ret.managerId; // remove the original field
//     delete ret.id; // remove id if you don't want it

//     return ret;
//   },
// });
// warehouseSchema.set("toObject", {
//   virtuals: true,
//   transform: (doc, ret) => {
//     delete ret.managerId; // remove the original field
//     delete ret.id; // remove id if you don't want it

//     return ret;
//   },
// });

module.exports = mongoose.model("Warehouse", warehouseSchema);
