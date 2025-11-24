/**
 * Validation middleware factory
 * Accepts a Joi schema and returns middleware that validates request data
 */
const validate = (schema) => {
  return (req, res, next) => {
    // Combine all request data sources for validation
    const dataToValidate = {
      ...req.body,
      ...req.query,
      ...req.params
    };

    // Validate against the provided schema
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      // Format validation errors into user-friendly messages
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // Attach validated data to request
    req.validatedData = value;
    next();
  };
};

module.exports = validate;
