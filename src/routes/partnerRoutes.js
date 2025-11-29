const express = require('express');
const router = express.Router();
const {
  createPartner,
  getAllPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  bulkDeletePartners
} = require('../controllers/partnerController');
const validate = require('../middleware/validate');
const {
  createPartnerSchema,
  updatePartnerSchema,
  partnerIdSchema,
  bulkDeleteSchema
} = require('../validators/partnerValidator');

/**
 * @route   POST /api/partners
 * @desc    Create a new partner
 * @access  Private
 */
router.post('/', validate(createPartnerSchema), createPartner);

/**
 * @route   POST /api/partners/bulk-delete
 * @desc    Bulk delete partners by IDs
 * @access  Private
 */
router.post('/bulk-delete', validate(bulkDeleteSchema), bulkDeletePartners);

/**
 * @route   GET /api/partners
 * @desc    Get all partners with optional filtering and pagination
 * @access  Public
 */
router.get('/', getAllPartners);

/**
 * @route   GET /api/partners/:id
 * @desc    Get a single partner by ID
 * @access  Public
 */
router.get('/:id', validate(partnerIdSchema), getPartnerById);

/**
 * @route   PUT /api/partners/:id
 * @desc    Update a partner by ID
 * @access  Private
 */
router.put('/:id', validate(partnerIdSchema), validate(updatePartnerSchema), updatePartner);

/**
 * @route   DELETE /api/partners/:id
 * @desc    Delete a partner by ID
 * @access  Private
 */
router.delete('/:id', validate(partnerIdSchema), deletePartner);

module.exports = router;
