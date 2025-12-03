const Joi = require('joi');

const createTransactionSchema = Joi.object({
  partnerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid partner ID format',
      'any.required': 'Partner ID is required'
    }),
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid product ID format',
            'any.required': 'Product ID is required'
          }),
        quantity: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one product is required',
      'any.required': 'Products array is required'
    }),
  transactionType: Joi.string()
    .valid('addition', 'subtraction')
    .required()
    .messages({
      'any.only': 'Transaction type must be either addition or subtraction',
      'any.required': 'Transaction type is required'
    }),
  note: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Note cannot exceed 500 characters'
    })
});

const transactionIdSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid transaction ID format',
      'any.required': 'Transaction ID is required'
    })
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid transaction ID format'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one transaction ID is required',
      'any.required': 'Transaction IDs are required'
    })
});

module.exports = {
  createTransactionSchema,
  transactionIdSchema,
  bulkDeleteSchema
};
