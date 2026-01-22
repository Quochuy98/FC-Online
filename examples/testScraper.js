/**
 * Test script to verify scraper functionality
 * This script tests the scraper without saving to database
 */

require('dotenv').config();

const { scrapePlayerList } = require('../src/services/playerListScraper');
const { scrapePlayerDetail } = require('../src/services/playerDetailScraper');
const logger = require('../src/utils/logger');

async function testPlayerList() {
  logger.info('=== Testing Player List Scraper ===');
  
  try {
    const players = await scrapePlayerList('ST', ['EL']);
    logger.info(`Found ${players.length} players`);
    
    if (players.length > 0) {
      logger.info('First player:', players[0]);
    }
    
    return players;
  } catch (error) {
    logger.error('Failed to test player list scraper', { error: error.message });
    return [];
  }
}

async function testPlayerDetail(playerUrl, playerId, season) {
  logger.info('=== Testing Player Detail Scraper ===');
  
  try {
    const playerData = await scrapePlayerDetail(playerUrl, playerId, season);
    logger.info('Player data:', JSON.stringify(playerData, null, 2));
    
    return playerData;
  } catch (error) {
    logger.error('Failed to test player detail scraper', { error: error.message });
    return null;
  }
}

async function main() {
  logger.info('Starting scraper tests...');
  
  // Test 1: Get player list
  const players = await testPlayerList();
  
  // Test 2: Get first player details
  if (players.length > 0) {
    const firstPlayer = players[0];
    await testPlayerDetail(firstPlayer.playerUrl, firstPlayer.playerId, 'EL');
  }
  
  logger.info('Tests completed!');
}

// Run tests
main().catch(error => {
  logger.error('Test failed', { error: error.message });
  process.exit(1);
});
