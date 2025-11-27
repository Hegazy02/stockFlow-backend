const Warehouse = require("../models/Warehouse");
const User = require("../models/User");

// Create warehouse
exports.createWarehouse = async (req, res, next) => {
  try {
    const { title, location, manager, status } = req.body;

    // Check if warehouse with same title exists
    const existingWarehouse = await Warehouse.findOne({ title });
    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: "Warehouse with this title already exists",
      });
    }

    // // Verify manager exists
    // const manager = await User.findById(managerId);
    // if (!manager) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Manager not found",
    //   });
    // }

    const warehouse = await Warehouse.create({
      title,
      location,
      // managerId,
      manager,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// Get all warehouses
exports.getAllWarehouses = async (req, res, next) => {
  try {
    const { status, managerId, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (managerId) {
      query.managerId = managerId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Warehouse.countDocuments(query);

    const warehouses = await Warehouse.find(query)
      // .populate("manager", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: warehouses,
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

// Get warehouse by ID
exports.getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// Update warehouse
exports.updateWarehouse = async (req, res, next) => {
  try {
    const { title, location, manager, status } = req.body;

    // Check if warehouse exists
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // If title is being updated, check for duplicates
    if (title && title !== warehouse.title) {
      const existingWarehouse = await Warehouse.findOne({ title });
      if (existingWarehouse) {
        return res.status(400).json({
          success: false,
          message: "Warehouse with this title already exists",
        });
      }
    }

    // If managerId is being updated, verify manager exists
    // if (managerId) {
    //   const manager = await User.findById(managerId);
    //   if (!manager) {
    //     return res.status(404).json({
    //       success: false,
    //       message: "Manager not found",
    //     });
    //   }
    // }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      // { title, location, managerId, status },
      { title, location, manager, status },
      { new: true, runValidators: true }
    );
    // .populate("managerId", "username email")
    res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: updatedWarehouse,
    });
  } catch (error) {
    next(error);
  }
};

// Delete warehouse
exports.deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete warehouses
exports.bulkDeleteWarehouses = async (req, res, next) => {
  try {
    const { ids } = req.body;

    const result = await Warehouse.deleteMany({
      _id: { $in: ids },
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} warehouse(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
  // Get all warehouse Managers
  // exports.getAllWarehouseManagers = async (req, res, next) => {
  //   try {
  //     const managers = await User.find({ role: "Warehouse Manager" });

  //     res.status(200).json({
  //       success: true,
  //       data: managers,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
};
