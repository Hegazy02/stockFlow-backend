const Joi = require("joi");

const createTransactionSchema = Joi.object({
  partnerId: Joi.when("transactionType", {
    is: "purchases",
    then: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid partner ID format",
        "any.required": "Partner ID is required for purchases",
      }),
    otherwise: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional()
      .allow(null),
  }),
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            "string.pattern.base": "Invalid product ID format",
            "any.required": "Product ID is required",
          }),
        quantity: Joi.number().integer().min(1).required().messages({
          "number.base": "Quantity must be a number",
          "number.integer": "Quantity must be an integer",
          "number.min": "Quantity must be at least 1",
          "any.required": "Quantity is required",
        }),
        costPrice: Joi.number().min(0).required().messages({
          "number.base": "Cost price must be a number",
          "number.min": "Cost price cannot be negative",
          "any.required": "Cost price is required",
        }),
      })
    )
    .when("transactionType", {
      is: Joi.valid("sales", "purchases"),
      then: Joi.array().min(1).required().messages({
        "any.required":
          "Products are required for sales or purchase transactions",
        "array.min": "At least one product is required",
      }),
      otherwise: Joi.array().optional(), // allows empty array for other types
    }),
  transactionType: Joi.string()
    .valid("sales", "purchases", "deposit_suppliers", "deposit_customers")
    .required()
    .messages({
      "any.only":
        "Transaction type must be either sales or purchases or deposit_suppliers or deposit_customers",
      "any.required": "Transaction type is required",
    }),
    balance: Joi.when("transactionType", {
      is: Joi.valid("sales", "purchases"),
      then: Joi.number().min(0).required().messages({
        "number.base": "Balance must be a number",
        "number.min": "Balance cannot be negative",
        "any.required": "Balance is required",
      }),
      otherwise: Joi.number().optional().allow(null),
    }),
    
    paid: Joi.number()
    .min(0)
    .default(0)
    .custom((value, helpers) => {
      const { transactionType, balance } = helpers.state.ancestors[0];
      // ✅ Only validate for sales & purchases
      if (transactionType !== "sales" && transactionType !== "purchases") {
        return value;
      }
  
      // ✅ If balance is null/undefined, skip comparison
      if (balance === null || balance === undefined) {
        return value;
      }
  
      if (value > balance) {
        return helpers.error("any.invalid");
      }
  
      return value;
    })
    .messages({
      "number.base": "Paid amount must be a number",
      "number.min": "Paid amount cannot be negative",
      "any.invalid": "Paid amount cannot be more than balance",
    }),
  
  
  note: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Note cannot exceed 500 characters",
  }),
});

const updateTransactionSchema = Joi.object({
  balance: Joi.number().min(0).optional().messages({
    "number.base": "Balance must be a number",
    "number.min": "Balance cannot be negative",
  }),
  paid: Joi.number().min(0).optional().messages({
    "number.base": "Paid amount must be a number",
    "number.min": "Paid amount cannot be negative",
  }),
  note: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Note cannot exceed 500 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

const transactionIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      "any.required": "Transaction ID is required",
    }),
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid transaction ID format",
        })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one transaction ID is required",
      "any.required": "Transaction IDs are required",
    }),
});

const partnerTransactionsSchema = Joi.object({
  partnerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid partner ID format",
      "any.required": "Partner ID is required",
    }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdSchema,
  bulkDeleteSchema,
  partnerTransactionsSchema,
};
