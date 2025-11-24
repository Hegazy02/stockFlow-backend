const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Set strictQuery mode for type safety
    mongoose.set('strictQuery', true);

    // Connect to MongoDB using connection string from environment variables
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Terminate process on connection failure
    process.exit(1);
  }
};

module.exports = connectDB;
