/**
 * MongoDB connection manager
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
const logger = require('../utils/logger');
const { MONGODB_CONFIG } = require('../config/constants');

let client = null;
let db = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<object>} Database instance
 */
async function connect() {
  if (db) {
    return db;
  }

  try {
    logger.info('Connecting to MongoDB...');
    
    if (!MONGODB_CONFIG.uri) {
      throw new Error('MONGODB_URI is not configured. Please set it in your .env file.');
    }
    
    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    // For MongoDB Atlas (mongodb+srv://), use ServerApiVersion
    // Note: strict: false allows text indexes to be created
    // For local MongoDB, use legacy options
    const clientOptions = MONGODB_CONFIG.uri.startsWith('mongodb+srv://')
      ? {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: false, // Set to false to allow text index creation
            deprecationErrors: true,
          }
        }
      : {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
    
    client = new MongoClient(MONGODB_CONFIG.uri, clientOptions);

    await client.connect();
    db = client.db(MONGODB_CONFIG.dbName);
    
    logger.info(`Connected to MongoDB database: ${MONGODB_CONFIG.dbName}`);
    
    return db;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
}

/**
 * Get database instance
 * @returns {object|null} Database instance or null if not connected
 */
function getDatabase() {
  return db;
}

/**
 * Close database connection
 */
async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('Disconnected from MongoDB');
  }
}

module.exports = {
  connect,
  getDatabase,
  disconnect,
};
