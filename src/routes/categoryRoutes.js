const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories
} = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  bulkDeleteSchema
} = require('../validators/categoryValidator');

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (add auth middleware when ready)
 */
router.post('/', validate(createCategorySchema), createCategory);

/**
 * @route   POST /api/categories/bulk-delete
 * @desc    Bulk delete categories by IDs
 * @access  Private (add auth middleware when ready)
 */
router.post('/bulk-delete', validate(bulkDeleteSchema), bulkDeleteCategories);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with optional filtering and pagination
 * @access  Public
 */
router.get('/', getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get a single category by ID
 * @access  Public
 */
router.get('/:id', validate(categoryIdSchema), getCategoryById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category by ID
 * @access  Private (add auth middleware when ready)
 */
router.put('/:id', validate(categoryIdSchema), validate(updateCategorySchema), updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category by ID
 * @access  Private (add auth middleware when ready)
 */
router.delete('/:id', validate(categoryIdSchema), deleteCategory);

module.exports = router;
