/**
 * Player repository for database operations
 */

const { getDatabase } = require('./connection');
const { MONGODB_CONFIG } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get players collection
 * @returns {object} MongoDB collection
 */
function getPlayersCollection() {
  const db = getDatabase();
  return db.collection(MONGODB_CONFIG.collections.players);
}

/**
 * Create or update a player in the database
 * @param {object} playerData - Player data to upsert
 * @returns {Promise<object>} Upsert result
 */
async function upsertPlayer(playerData) {
  try {
    const collection = getPlayersCollection();
    
    // Use playerId and season as unique identifier
    const filter = {
      playerId: playerData.playerId,
      season: playerData.season,
    };

    const result = await collection.updateOne(
      filter,
      { 
        $set: {
          ...playerData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return result;
  } catch (error) {
    logger.error('Failed to upsert player', { 
      playerId: playerData.playerId,
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
    const collection = getPlayersCollection();
    const count = await collection.countDocuments({
      playerId,
      season,
    });
    return count > 0;
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
    const collection = getPlayersCollection();
    return await collection.findOne({ playerId, season });
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
 */
async function createIndexes() {
  try {
    const collection = getPlayersCollection();
    
    await collection.createIndex({ playerId: 1, season: 1 }, { unique: true });
    await collection.createIndex({ name: 1 });
    await collection.createIndex({ position: 1 });
    await collection.createIndex({ season: 1 });
    await collection.createIndex({ overallDisplay: -1 }); // For sorting by rating
    await collection.createIndex({ createdAt: 1 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create indexes', { error: error.message });
  }
}

module.exports = {
  upsertPlayer,
  playerExists,
  getPlayer,
  createIndexes,
};
