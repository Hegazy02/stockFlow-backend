const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts
} = require('../controllers/productController');
const validate = require('../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  bulkDeleteSchema
} = require('../validators/productValidator');

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (add auth middleware when ready)
 */
router.post('/', validate(createProductSchema), createProduct);

/**
 * @route   POST /api/products/bulk-delete
 * @desc    Bulk delete products by IDs
 * @access  Private (add auth middleware when ready)
 */
router.post('/bulk-delete', validate(bulkDeleteSchema), bulkDeleteProducts);

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filtering
 * @access  Public
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 */
router.get('/:id', validate(productIdSchema), getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by ID
 * @access  Private (add auth middleware when ready)
 */
router.put('/:id', validate(productIdSchema), validate(updateProductSchema), updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by ID
 * @access  Private (add auth middleware when ready)
 */
router.delete('/:id', validate(productIdSchema), deleteProduct);

module.exports = router;
