/**
 * Quick start example - Crawl a small subset of data
 * This example crawls ST position for EL season only
 */

require('dotenv').config();

const logger = require('../src/utils/logger');
const { connect, disconnect } = require('../src/database/connection');
const { createIndexes } = require('../src/database/playerRepository');
const { crawlPositionAndSeason } = require('../src/services/crawlerService');

async function quickStart() {
  try {
    logger.info('=== Quick Start Example ===');
    logger.info('This will crawl ST position for EL season');
    
    // Connect to database
    await connect();
    
    // Create indexes
    await createIndexes();
    
    // Crawl ST position for EL season
    const stats = await crawlPositionAndSeason('ST', 'EL', {
      skipExisting: true, // Skip players that already exist
    });
    
    logger.info('Crawl completed!', stats);
    
  } catch (error) {
    logger.error('Quick start failed', { error: error.message });
  } finally {
    await disconnect();
  }
}

quickStart();
