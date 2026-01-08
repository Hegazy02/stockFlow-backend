const Joi = require("joi");

// Create expense validation schema
const createExpenseSchema = Joi.object({
  title: Joi.string().trim().max(200).required().messages({
    "any.required": "Expense title is required",
    "string.empty": "Expense title cannot be empty",
    "string.max": "Title cannot exceed 200 characters",
  }),
  amount: Joi.number().min(0).required().messages({
    "any.required": "Amount is required",
    "number.min": "Amount cannot be negative",
  }),
  category: Joi.string().trim().max(100).default("General").messages({
    "string.max": "Category cannot exceed 100 characters",
  }),
  date: Joi.date().default(Date.now).messages({
    "date.base": "Invalid date format",
  }),
  note: Joi.string().trim().max(500).allow("", null).messages({
    "string.max": "Note cannot exceed 500 characters",
  }),
});

// Update expense validation schema
const updateExpenseSchema = Joi.object({
  title: Joi.string().trim().max(200).messages({
    "string.empty": "Expense title cannot be empty",
    "string.max": "Title cannot exceed 200 characters",
  }),
  amount: Joi.number().min(0).messages({
    "number.min": "Amount cannot be negative",
  }),
  category: Joi.string().trim().max(100).messages({
    "string.max": "Category cannot exceed 100 characters",
  }),
  date: Joi.date().messages({
    "date.base": "Invalid date format",
  }),
  note: Joi.string().trim().max(500).allow("", null).messages({
    "string.max": "Note cannot exceed 500 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// Expense ID validation schema
const expenseIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Expense ID is required",
      "string.pattern.base": "Expense ID must be a valid MongoDB ObjectId",
    }),
});

// Bulk delete validation schema
const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      "any.required": "Expense IDs array is required",
      "array.min": "At least one expense ID must be provided",
      "array.base": "IDs must be provided as an array",
      "string.pattern.base": "Each ID must be a valid MongoDB ObjectId",
    }),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  bulkDeleteSchema,
};
