/**
 * Script to create text index for MongoDB Atlas Text Search
 * Run this once to enable text search functionality
 * 
 * Usage: node scripts/createTextIndex.js
 */

require('dotenv').config();
const { connect, disconnect } = require('../src/database/connection');
const { createIndexes } = require('../src/database/playerRepository');
const logger = require('../src/utils/logger');

async function main() {
  try {
    logger.info('Creating text index for MongoDB Atlas Text Search...');
    
    await connect();
    await createIndexes();
    
    logger.info('✅ Text index created successfully!');
    logger.info('You can now use MongoDB Text Search for better search results.');
    
  } catch (error) {
    logger.error('Failed to create text index', { error: error.message });
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();
