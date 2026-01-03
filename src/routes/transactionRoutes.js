const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  getTransactionStats,
  getPartnerTransactions,
  returnProducts,
} = require("../controllers/transactionController");
const validate = require("../middleware/validate");
const {
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdSchema,
  bulkDeleteSchema,
  partnerTransactionsSchema,
  returnProductsSchema,
} = require("../validators/transactionValidator");

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post("/", validate(createTransactionSchema), createTransaction);

/**
 * @route   POST /api/transactions/bulk-delete
 * @desc    Bulk delete transactions by IDs
 * @access  Private
 */
router.post("/bulk-delete", validate(bulkDeleteSchema), bulkDeleteTransactions);

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics
 * @access  Public
 */
router.get("/stats", getTransactionStats);

/**
 * @route   GET /api/transactions/partner
 * @desc    Get all transactions for a specific partner with totals
 * @access  Public
 * @query   partnerId (required), page (optional, default: 1), limit (optional, default: 10)
 */
router.get(
  "/partner",
  validate(partnerTransactionsSchema),
  getPartnerTransactions
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with optional filtering and pagination
 * @access  Public
 */
router.get("/", getAllTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction by ID
 * @access  Public
 */
router.get("/:id", validate(transactionIdSchema), getTransactionById);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction by ID
 * @access  Private
 */
router.put(
  "/:id",
  validate(transactionIdSchema),
  validate(updateTransactionSchema),
  updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction by ID
 * @access  Private
 */
router.delete("/:id", validate(transactionIdSchema), deleteTransaction);

/**
 * @route   POST /api/transactions/:id/returns
 * @desc    Return products from a transaction
 * @access  Private
 */
router.post(
  "/:id/returns",
  validate(transactionIdSchema),
  validate(returnProductsSchema),
  returnProducts
);

module.exports = router;
