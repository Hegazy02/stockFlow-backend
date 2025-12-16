const Joi = require('joi');

const createPartnerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Partner name is required',
      'string.max': 'Partner name cannot exceed 100 characters',
      'any.required': 'Partner name is required'
    }),
  phoneNumber: Joi.string()
    .trim()
    .max(20)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.max': 'Phone number cannot exceed 20 characters',
      'any.required': 'Phone number is required'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  type: Joi.string()
    .valid('Customer', 'Supplier')
    .required()
    .messages({
      'any.only': 'Type must be either Customer or Supplier',
      'any.required': 'Partner type is required'
    }),
  balance: Joi.forbidden().messages({
    'any.unknown': 'Balance is automatically calculated from transactions and cannot be set manually'
  }),
  paid: Joi.forbidden().messages({
    'any.unknown': 'Paid is automatically calculated from transactions and cannot be set manually'
  }),
  left: Joi.forbidden().messages({
    'any.unknown': 'Left is automatically calculated from transactions and cannot be set manually'
  })
});

const updatePartnerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Partner name cannot be empty',
      'string.max': 'Partner name cannot exceed 100 characters'
    }),
  phoneNumber: Joi.string()
    .trim()
    .max(20)
    .optional()
    .messages({
      'string.empty': 'Phone number cannot be empty',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  type: Joi.string()
    .valid('Customer', 'Supplier')
    .optional()
    .messages({
      'any.only': 'Type must be either Customer or Supplier'
    }),
  balance: Joi.forbidden().messages({
    'any.unknown': 'Balance is automatically calculated from transactions and cannot be set manually'
  }),
  paid: Joi.forbidden().messages({
    'any.unknown': 'Paid is automatically calculated from transactions and cannot be set manually'
  }),
  left: Joi.forbidden().messages({
    'any.unknown': 'Left is automatically calculated from transactions and cannot be set manually'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const partnerIdSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid partner ID format',
      'any.required': 'Partner ID is required'
    })
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid partner ID format'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one partner ID is required',
      'any.required': 'Partner IDs are required'
    })
});

module.exports = {
  createPartnerSchema,
  updatePartnerSchema,
  partnerIdSchema,
  bulkDeleteSchema
};
