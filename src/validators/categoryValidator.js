const Joi = require('joi');

// Create category validation schema
const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .pattern(/\S/)
    .messages({
      'any.required': 'Category name is required',
      'string.empty': 'Category name cannot be empty',
      'string.max': 'Category name must not exceed 100 characters',
      'string.pattern.base': 'Category name cannot be only whitespace'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .default('Active')
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
});

// Update category validation schema (all fields optional, at least one required)
const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .pattern(/\S/)
    .messages({
      'string.empty': 'Category name cannot be empty',
      'string.max': 'Category name must not exceed 100 characters',
      'string.pattern.base': 'Category name cannot be only whitespace'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Category ID validation schema for URL parameters
const categoryIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Category ID is required',
      'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId'
    })
});

// Bulk delete validation schema
const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      'any.required': 'Category IDs array is required',
      'array.min': 'At least one category ID must be provided',
      'array.base': 'IDs must be provided as an array',
      'string.pattern.base': 'Each ID must be a valid MongoDB ObjectId'
    })
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  bulkDeleteSchema
};
