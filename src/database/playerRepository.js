/**
 * Player repository for database operations using Mongoose
 */

const Player = require('../models/Player');
const logger = require('../utils/logger');

/**
 * Create or update a player in the database
 * @param {object} playerData - Player data to upsert
 * @returns {Promise<object>} Upserted player document
 */
async function upsertPlayer(playerData) {
  try {
    // Mongoose handles plain objects for Mixed type, no conversion needed
    const player = await Player.upsert(playerData);
    return player;
  } catch (error) {
    logger.error('Failed to upsert player', { 
      playerId: playerData.playerId,
      season: playerData.season,
      error: error.message 
    });
    throw error;
  }
}

/**
 * Check if player exists in database
 * @param {string} playerId - Player ID
 * @param {string} season - Season
 * @returns {Promise<boolean>} True if player exists
 */
async function playerExists(playerId, season) {
  try {
    const exists = await Player.exists({ playerId, season });
    return !!exists;
  } catch (error) {
    logger.error('Failed to check player existence', { 
      playerId, 
      season,
      error: error.message 
    });
    return false;
  }
}

/**
 * Get player by ID and season
 * @param {string} playerId - Player ID
 * @param {string} season - Season
 * @returns {Promise<object|null>} Player data or null
 */
async function getPlayer(playerId, season) {
  try {
    const player = await Player.findByPlayerIdAndSeason(playerId, season);
    return player;
  } catch (error) {
    logger.error('Failed to get player', { 
      playerId, 
      season,
      error: error.message 
    });
    return null;
  }
}

/**
 * Create indexes for better query performance
 * Note: Mongoose automatically creates indexes defined in the schema
 * This function ensures all indexes are created and can be used to create additional ones
 */
async function createIndexes() {
  try {
    // Mongoose will automatically create indexes defined in the schema
    // We can also ensure they exist by calling ensureIndexes
    await Player.ensureIndexes();
    
    logger.info('Database indexes created/verified successfully');
  } catch (error) {
    logger.error('Failed to create indexes', { error: error.message });
    // Don't throw - indexes might already exist
  }
}

module.exports = {
  upsertPlayer,
  playerExists,
  getPlayer,
  createIndexes,
  // Export Player model for direct use if needed
  Player,
};
