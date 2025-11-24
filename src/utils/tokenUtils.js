const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user's MongoDB ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  const payload = {
    userId: userId
  };

  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const options = {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  };

  return jwt.sign(payload, secret, options);
};

module.exports = {
  generateToken
};
