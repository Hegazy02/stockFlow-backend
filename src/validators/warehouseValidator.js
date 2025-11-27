const Joi = require('joi');

const createWarehouseSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  location: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Location is required',
      'string.max': 'Location cannot exceed 200 characters',
      'any.required': 'Location is required'
    }),
  managerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Manager ID must be a valid MongoDB ObjectId',
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .default('Active')
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
});

const updateWarehouseSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  location: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Location cannot be empty',
      'string.max': 'Location cannot exceed 200 characters'
    }),
  managerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Manager ID must be a valid MongoDB ObjectId'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      'array.min': '"ids" must contain at least 1 items',
      'any.required': '"ids" is required',
      'string.pattern.base': 'Each ID must be a valid MongoDB ObjectId'
    })
});

module.exports = {
  createWarehouseSchema,
  updateWarehouseSchema,
  bulkDeleteSchema
};
