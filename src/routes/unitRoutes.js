const express = require('express');
const router = express.Router();
const {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  bulkDeleteUnits
} = require('../controllers/unitController');
const validate = require('../middleware/validate');
const {
  createUnitSchema,
  updateUnitSchema,
  unitIdSchema,
  bulkDeleteSchema
} = require('../validators/unitValidator');

/**
 * @route   POST /api/units
 * @desc    Create a new unit
 * @access  Private
 */
router.post('/', validate(createUnitSchema), createUnit);

/**
 * @route   POST /api/units/bulk-delete
 * @desc    Bulk delete units by IDs
 * @access  Private
 */
router.post('/bulk-delete', validate(bulkDeleteSchema), bulkDeleteUnits);

/**
 * @route   GET /api/units
 * @desc    Get all units with optional filtering and pagination
 * @access  Public
 */
router.get('/', getAllUnits);

/**
 * @route   GET /api/units/:id
 * @desc    Get a single unit by ID
 * @access  Public
 */
router.get('/:id', validate(unitIdSchema), getUnitById);

/**
 * @route   PUT /api/units/:id
 * @desc    Update a unit by ID
 * @access  Private
 */
router.put('/:id', validate(unitIdSchema), validate(updateUnitSchema), updateUnit);

/**
 * @route   DELETE /api/units/:id
 * @desc    Delete a unit by ID
 * @access  Private
 */
router.delete('/:id', validate(unitIdSchema), deleteUnit);

module.exports = router;
