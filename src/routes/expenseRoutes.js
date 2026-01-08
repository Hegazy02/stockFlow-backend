const express = require("express");
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses,
  getExpenseStats,
} = require("../controllers/expenseController");
const validate = require("../middleware/validate");
const {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  bulkDeleteSchema,
} = require("../validators/expenseValidator");

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 * @access  Private (add auth middleware when ready)
 */
router.post("/", validate(createExpenseSchema), createExpense);

/**
 * @route   POST /api/expenses/bulk-delete
 * @desc    Bulk delete expenses by IDs
 * @access  Private (add auth middleware when ready)
 */
router.post("/bulk-delete", validate(bulkDeleteSchema), bulkDeleteExpenses);

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses with optional filtering
 * @access  Public
 */
router.get("/", getAllExpenses);

/**
 * @route   GET /api/expenses/stats
 * @desc    Get expense statistics
 * @access  Public
 */
router.get("/stats", getExpenseStats);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get a single expense by ID
 * @access  Public
 */
router.get("/:id", validate(expenseIdSchema), getExpenseById);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update an expense by ID
 * @access  Private (add auth middleware when ready)
 */
router.put(
  "/:id",
  validate(expenseIdSchema),
  validate(updateExpenseSchema),
  updateExpense
);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense by ID
 * @access  Private (add auth middleware when ready)
 */
router.delete("/:id", validate(expenseIdSchema), deleteExpense);

module.exports = router;
