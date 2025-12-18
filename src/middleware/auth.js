// const jwt = require('jsonwebtoken');

// /**
//  * Authentication middleware to verify JWT tokens
//  * Extracts token from Authorization header, verifies it, and attaches user info to request
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @param {Function} next - Express next middleware function
//  */
// const authenticate = (req, res, next) => {
//   try {
//     // Extract token from Authorization header
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({
//         success: false,
//         message: 'Access denied. No token provided.'
//       });
//     }

//     // Check if header follows "Bearer <token>" format
//     const parts = authHeader.split(' ');
    
//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid token format. Use: Bearer <token>'
//       });
//     }

//     const token = parts[1];

//     // Verify token
//     const secret = process.env.JWT_SECRET;
    
//     if (!secret) {
//       throw new Error('JWT_SECRET is not defined in environment variables');
//     }

//     const decoded = jwt.verify(token, secret);

//     // Attach user information to request object
//     req.user = {
//       userId: decoded.userId
//     };

//     next();
//   } catch (error) {
//     // Handle JWT-specific errors
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid token.'
//       });
//     }
    
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Token has expired.'
//       });
//     }

//     // Handle other errors
//     return res.status(401).json({
//       success: false,
//       message: 'Authentication failed.'
//     });
//   }
// };

// module.exports = authenticate;
