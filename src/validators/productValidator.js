const Joi = require("joi");

// Create product validation schema
const createProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().required().messages({
    "any.required": "SKU is required",
    "string.empty": "SKU cannot be empty",
  }),
  name: Joi.string().trim().max(200).required().messages({
    "any.required": "Product name is required",
    "string.empty": "Product name cannot be empty",
    "string.max": "Product name must not exceed 200 characters",
  }),
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Category ID is required",
      "string.pattern.base": "Category ID must be a valid MongoDB ObjectId",
    }),
  description: Joi.string().trim().max(1000).allow("", null).messages({
    "string.max": "Description must not exceed 1000 characters",
  }),
  // costPrice: Joi.number()
  //   .min(0)
  //   .required()
  //   .messages({
  //     'any.required': 'Cost price is required',
  //     'number.min': 'Cost price must be a positive number',
  //     'number.base': 'Cost price must be a number'
  //   }),
  // sellingPrice: Joi.number()
  //   .min(0)
  //   .required()
  //   .messages({
  //     'any.required': 'Selling price is required',
  //     'number.min': 'Selling price must be a positive number',
  //     'number.base': 'Selling price must be a number'
  //   }),
  // supplierId: Joi.string()
  //   .pattern(/^[0-9a-fA-F]{24}$/)
  //   .required()
  //   .messages({
  //     'any.required': 'Supplier ID is required',
  //     'string.pattern.base': 'Supplier ID must be a valid MongoDB ObjectId'
  //   }),
  // status: Joi.string()
  //   .valid('Active', 'Inactive')
  //   .default('Active')
  //   .messages({
  //     'any.only': 'Status must be either Active or Inactive'
  //   })
});

// Update product validation schema (all fields optional)
const updateProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().messages({
    "string.empty": "SKU cannot be empty",
  }),
  name: Joi.string().trim().max(200).messages({
    "string.empty": "Product name cannot be empty",
    "string.max": "Product name must not exceed 200 characters",
  }),
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Category ID must be a valid MongoDB ObjectId",
    }),
  description: Joi.string().trim().max(1000).allow("", null).messages({
    "string.max": "Description must not exceed 1000 characters",
  }),
  //
  //   costPrice: Joi.number().min(0).messages({
  //     "number.min": "Cost price must be a positive number",
  //     "number.base": "Cost price must be a number",
  //   }),
  //   sellingPrice: Joi.number().min(0).messages({
  //     "number.min": "Selling price must be a positive number",
  //     "number.base": "Selling price must be a number",
  //   }),
  //   supplierId: Joi.string()
  //     .pattern(/^[0-9a-fA-F]{24}$/)
  //     .messages({
  //       "string.pattern.base": "Supplier ID must be a valid MongoDB ObjectId",
  //     }),
  //   status: Joi.string().valid("Active", "Inactive").messages({
  //     "any.only": "Status must be either Active or Inactive",
  //   }),
  // })
  //   .min(1)
  //   .messages({
  //     "object.min": "At least one field must be provided for update",
});
// Get product by ID validation schema
const productIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Product ID is required",
      "string.pattern.base": "Product ID must be a valid MongoDB ObjectId",
    }),
});

// Bulk delete validation schema
const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      "any.required": "Product IDs array is required",
      "array.min": "At least one product ID must be provided",
      "array.base": "IDs must be provided as an array",
      "string.pattern.base": "Each ID must be a valid MongoDB ObjectId",
    }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  bulkDeleteSchema,
};
