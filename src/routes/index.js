const express = require("express");
const router = express.Router();
const path = require("path");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const warehouseRoutes = require("./warehouseRoutes");
const partnerRoutes = require("./partnerRoutes");
const unitRoutes = require("./unitRoutes");
const transactionRoutes = require("./transactionRoutes");
const expenseRoutes = require("./expenseRoutes");

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/endpoints
 * @desc    Get API endpoints documentation in JSON format
 * @access  Public
 */
router.get("/endpoints", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/api-endpoints.json"));
});

// Mount authentication routes at /auth prefix
router.use("/auth", authRoutes);

// Mount product routes at /products prefix
router.use("/products", productRoutes);

// Mount category routes at /categories prefix
router.use("/categories", categoryRoutes);

// Mount warehouse routes at /warehouses prefix
router.use("/warehouses", warehouseRoutes);

// Mount partner routes at /partners prefix
router.use("/partners", partnerRoutes);

// Mount unit routes at /units prefix
router.use("/units", unitRoutes);

// Mount transaction routes at /transactions prefix
router.use("/transactions", transactionRoutes);

// Mount expense routes at /expenses prefix
router.use("/expenses", expenseRoutes);

module.exports = router;
