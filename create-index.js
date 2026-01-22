/**
 * Create overallDisplay index for existing database
 * Run this script once to add the new index
 */

require('dotenv').config();
const { connectToDatabase, closeConnection } = require('./src/database/connection');
const { createIndexes } = require('./src/database/playerRepository');
const logger = require('./src/utils/logger');

async function main() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectToDatabase();
    
    logger.info('Creating indexes...');
    await createIndexes();
    
    logger.info('✅ Index creation completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create indexes', { error: error.message });
    process.exit(1);
  }
}

main();
