/**
 * Progress tracker for resumable crawling
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const PROGRESS_DIR = path.join(__dirname, '../../.progress');
const PROGRESS_FILE = 'crawl-progress.json';

/**
 * Ensure progress directory exists
 */
function ensureProgressDir() {
  if (!fs.existsSync(PROGRESS_DIR)) {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  }
}

/**
 * Get progress file path
 * @param {string} season - Season identifier
 * @returns {string} Progress file path
 */
function getProgressFilePath(season) {
  return path.join(PROGRESS_DIR, `${season}-${PROGRESS_FILE}`);
}

/**
 * Load progress for a season
 * @param {string} season - Season to load progress for
 * @returns {object|null} Progress data or null if not found
 */
function loadProgress(season) {
  try {
    ensureProgressDir();
    const filePath = getProgressFilePath(season);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to load progress', { season, error: error.message });
    return null;
  }
}

/**
 * Save progress for a season
 * @param {string} season - Season to save progress for
 * @param {object} progress - Progress data
 */
function saveProgress(season, progress) {
  try {
    ensureProgressDir();
    const filePath = getProgressFilePath(season);
    
    const data = {
      season,
      lastUpdated: new Date().toISOString(),
      ...progress,
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    logger.debug(`Progress saved for ${season}`);
  } catch (error) {
    logger.error('Failed to save progress', { season, error: error.message });
  }
}

/**
 * Clear progress for a season
 * @param {string} season - Season to clear progress for
 */
function clearProgress(season) {
  try {
    const filePath = getProgressFilePath(season);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Progress cleared for ${season}`);
    }
  } catch (error) {
    logger.error('Failed to clear progress', { season, error: error.message });
  }
}

/**
 * Check if position is completed for a season
 * @param {string} season - Season
 * @param {string} position - Position
 * @returns {boolean} True if completed
 */
function isPositionCompleted(season, position) {
  const progress = loadProgress(season);
  
  if (!progress || !progress.completedPositions) {
    return false;
  }
  
  return progress.completedPositions.includes(position);
}

/**
 * Mark position as completed
 * @param {string} season - Season
 * @param {string} position - Position
 * @param {object} stats - Statistics for this position
 */
function markPositionCompleted(season, position, stats) {
  const progress = loadProgress(season) || {
    completedPositions: [],
    positionStats: {},
  };
  
  if (!progress.completedPositions.includes(position)) {
    progress.completedPositions.push(position);
  }
  
  progress.positionStats[position] = stats;
  
  saveProgress(season, progress);
}

/**
 * Get remaining positions for a season
 * @param {string} season - Season
 * @param {string[]} allPositions - All available positions
 * @returns {string[]} Remaining positions to crawl
 */
function getRemainingPositions(season, allPositions) {
  const progress = loadProgress(season);
  
  if (!progress || !progress.completedPositions) {
    return allPositions;
  }
  
  return allPositions.filter(pos => !progress.completedPositions.includes(pos));
}

module.exports = {
  loadProgress,
  saveProgress,
  clearProgress,
  isPositionCompleted,
  markPositionCompleted,
  getRemainingPositions,
};
