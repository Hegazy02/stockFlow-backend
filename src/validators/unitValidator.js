const Joi = require('joi');

const createUnitSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.empty': 'Unit name is required',
      'string.max': 'Unit name cannot exceed 50 characters',
      'any.required': 'Unit name is required'
    }),
  abbreviation: Joi.string()
    .trim()
    .max(10)
    .required()
    .messages({
      'string.empty': 'Unit abbreviation is required',
      'string.max': 'Unit abbreviation cannot exceed 10 characters',
      'any.required': 'Unit abbreviation is required'
    }),
  description: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 200 characters'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .optional()
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
});

const updateUnitSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.empty': 'Unit name cannot be empty',
      'string.max': 'Unit name cannot exceed 50 characters'
    }),
  abbreviation: Joi.string()
    .trim()
    .max(10)
    .optional()
    .messages({
      'string.empty': 'Unit abbreviation cannot be empty',
      'string.max': 'Unit abbreviation cannot exceed 10 characters'
    }),
  description: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 200 characters'
    }),
  status: Joi.string()
    .valid('Active', 'Inactive')
    .optional()
    .messages({
      'any.only': 'Status must be either Active or Inactive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const unitIdSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid unit ID format',
      'any.required': 'Unit ID is required'
    })
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid unit ID format'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one unit ID is required',
      'any.required': 'Unit IDs are required'
    })
});

module.exports = {
  createUnitSchema,
  updateUnitSchema,
  unitIdSchema,
  bulkDeleteSchema
};
