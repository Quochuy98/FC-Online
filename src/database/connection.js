/**
 * MongoDB connection manager using Mongoose
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { MONGODB_CONFIG } = require('../config/constants');

let isConnected = false;

/**
 * Connect to MongoDB database using Mongoose
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connect() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    logger.info('Connecting to MongoDB with Mongoose...');
    
    if (!MONGODB_CONFIG.uri) {
      throw new Error('MONGODB_URI is not configured. Please set it in your .env file.');
    }
    
    // Ensure URI includes database name
    let mongoUri = MONGODB_CONFIG.uri;
    
    // Parse URI to check if database name is present
    const uriMatch = mongoUri.match(/mongodb\+srv:\/\/[^/]+(\/([^?]+))?(\?.*)?$/);
    const hasDbName = uriMatch && uriMatch[2] && uriMatch[2] !== '';
    
    if (!hasDbName) {
      // URI doesn't have database name, add it
      // Handle case where URI ends with /?appName=... or just /?
      if (mongoUri.includes('/?')) {
        // Replace /? with /dbName?
        mongoUri = mongoUri.replace('/?', `/${MONGODB_CONFIG.dbName}?`);
      } else if (mongoUri.endsWith('/')) {
        // URI ends with /, just append dbName
        mongoUri = `${mongoUri}${MONGODB_CONFIG.dbName}`;
      } else if (mongoUri.includes('?')) {
        // URI has query params but no database, insert before ?
        mongoUri = mongoUri.replace('?', `/${MONGODB_CONFIG.dbName}?`);
      } else {
        // URI has no query params and no database, append /dbName
        mongoUri = `${mongoUri}/${MONGODB_CONFIG.dbName}`;
      }
    }
    
    // Add appName for MongoDB Atlas if not present
    if (mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('appName=')) {
      const separator = mongoUri.includes('?') ? '&' : '?';
      mongoUri = `${mongoUri}${separator}appName=Cluster0`;
    }
    
    // Mongoose connection options
    const options = {
      // Connection pool options
      maxPoolSize: 10, // Default is 10, good for traditional servers
      minPoolSize: 1,
      // Timeout options
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      // Retry options
      retryWrites: true,
      retryReads: true,
      // Server selection timeout
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(mongoUri, options);
    
    isConnected = true;
    logger.info(`Connected to MongoDB database: ${MONGODB_CONFIG.dbName}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { 
      error: error.message,
      stack: error.stack,
      uri: MONGODB_CONFIG.uri ? 'configured' : 'missing'
    });
    isConnected = false;
    throw error;
  }
}

/**
 * Get mongoose connection
 * @returns {mongoose.Connection|null} Mongoose connection or null if not connected
 */
function getConnection() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  return null;
}

/**
 * Check if database is connected
 * @returns {boolean} True if connected
 */
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Close database connection
 */
async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  }
}

module.exports = {
  connect,
  getConnection,
  isDatabaseConnected,
  disconnect,
  // Backward compatibility
  getDatabase: getConnection,
};
