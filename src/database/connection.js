/**
 * MongoDB connection manager
 */

const { MongoClient } = require('mongodb');
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
    
    client = new MongoClient(MONGODB_CONFIG.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
 * @returns {object} Database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connect() first.');
  }
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
