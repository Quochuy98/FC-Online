/**
 * Track progress across multiple seasons crawl
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const PROGRESS_DIR = path.join(__dirname, '../../.progress');
const SEASONS_PROGRESS_FILE = 'seasons-crawl-progress.json';

/**
 * Ensure progress directory exists
 */
function ensureProgressDir() {
  if (!fs.existsSync(PROGRESS_DIR)) {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  }
}

/**
 * Load seasons crawl progress
 * @returns {object|null} Progress data
 */
function loadSeasonsProgress() {
  try {
    ensureProgressDir();
    const filePath = path.join(PROGRESS_DIR, SEASONS_PROGRESS_FILE);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to load seasons progress', { error: error.message });
    return null;
  }
}

/**
 * Save seasons crawl progress
 * @param {object} progress - Progress data
 */
function saveSeasonsProgress(progress) {
  try {
    ensureProgressDir();
    const filePath = path.join(PROGRESS_DIR, SEASONS_PROGRESS_FILE);
    
    const data = {
      lastUpdated: new Date().toISOString(),
      ...progress,
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error('Failed to save seasons progress', { error: error.message });
  }
}

/**
 * Clear seasons crawl progress
 */
function clearSeasonsProgress() {
  try {
    const filePath = path.join(PROGRESS_DIR, SEASONS_PROGRESS_FILE);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Seasons crawl progress cleared');
    }
  } catch (error) {
    logger.error('Failed to clear seasons progress', { error: error.message });
  }
}

/**
 * Mark season as completed
 * @param {string} season - Season code
 */
function markSeasonCompleted(season) {
  const progress = loadSeasonsProgress() || {
    completedSeasons: [],
    startedAt: new Date().toISOString(),
  };
  
  if (!progress.completedSeasons.includes(season)) {
    progress.completedSeasons.push(season);
  }
  
  saveSeasonsProgress(progress);
  logger.debug(`Season ${season} marked as completed`);
}

/**
 * Get remaining seasons to crawl
 * @param {string[]} allSeasons - All seasons to crawl
 * @returns {string[]} Remaining seasons
 */
function getRemainingSeasons(allSeasons) {
  const progress = loadSeasonsProgress();
  
  if (!progress || !progress.completedSeasons) {
    return allSeasons;
  }
  
  return allSeasons.filter(s => !progress.completedSeasons.includes(s));
}

/**
 * Get crawl statistics
 * @param {string[]} allSeasons - All seasons
 * @returns {object} Statistics
 */
function getCrawlStats(allSeasons) {
  const progress = loadSeasonsProgress();
  
  if (!progress) {
    return {
      total: allSeasons.length,
      completed: 0,
      remaining: allSeasons.length,
      completedSeasons: [],
    };
  }
  
  const completed = progress.completedSeasons || [];
  
  return {
    total: allSeasons.length,
    completed: completed.length,
    remaining: allSeasons.length - completed.length,
    completedSeasons: completed,
  };
}

module.exports = {
  loadSeasonsProgress,
  saveSeasonsProgress,
  clearSeasonsProgress,
  markSeasonCompleted,
  getRemainingSeasons,
  getCrawlStats,
};
