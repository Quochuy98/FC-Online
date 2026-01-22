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
    
    // Unique index for playerId + season
    await collection.createIndex({ playerId: 1, season: 1 }, { unique: true });
    
    // Text index for full-text search on name (supports fuzzy search)
    // Note: For MongoDB Atlas with apiStrict: true, we need to use a different approach
    try {
      // Check if text index already exists
      const indexes = await collection.indexes();
      const textIndexExists = indexes.some(idx => 
        idx.name === 'name_text_index' || 
        (idx.key && idx.key.name === 'text')
      );
      
      if (!textIndexExists) {
        // Create text index without deprecated options for strict mode compatibility
        await collection.createIndex(
          { name: 'text' },
          { 
            name: 'name_text_index',
            weights: { name: 10 } // Higher weight for name field
          }
        );
        logger.info('Text index created for name field');
      } else {
        logger.info('Text index already exists, skipping...');
      }
    } catch (error) {
      // Index might already exist or other error
      if (error.code === 85 || error.message.includes('already exists') || error.message.includes('duplicate')) {
        logger.info('Text index already exists, skipping...');
      } else if (error.message.includes('apiStrict')) {
        // If strict mode prevents text index, log warning and continue
        logger.warn('Text index cannot be created with apiStrict: true. Using regex search fallback.');
        logger.warn('To enable text search, create the index manually in MongoDB Atlas or disable strict mode.');
      } else {
        logger.error('Failed to create text index', { error: error.message });
        throw error;
      }
    }
    
    // Regular indexes
    await collection.createIndex({ name: 1 });
    await collection.createIndex({ position: 1 });
    await collection.createIndex({ season: 1 });
    await collection.createIndex({ overallDisplay: -1 }); // For sorting by rating
    await collection.createIndex({ createdAt: 1 });
    
    // Compound index for common search patterns
    await collection.createIndex({ position: 1, season: 1, overallDisplay: -1 });
    await collection.createIndex({ season: 1, overallDisplay: -1 });
    
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
