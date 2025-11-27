const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const validate = require('../middleware/validate');
const {
  createWarehouseSchema,
  updateWarehouseSchema,
  bulkDeleteSchema
} = require('../validators/warehouseValidator');

// Bulk delete must come before /:id routes
router.post('/bulk-delete', validate(bulkDeleteSchema), warehouseController.bulkDeleteWarehouses);

router.post('/', validate(createWarehouseSchema), warehouseController.createWarehouse);
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.put('/:id', validate(updateWarehouseSchema), warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;
