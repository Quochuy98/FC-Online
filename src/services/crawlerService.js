/**
 * Main crawler orchestration service
 */

const logger = require('../utils/logger');
const { POSITIONS, SEASONS, REQUEST_CONFIG } = require('../config/constants');
const { scrapePlayerList } = require('./playerListScraper');
const { scrapePlayerDetail } = require('./playerDetailScraper');
const { upsertPlayer, playerExists } = require('../database/playerRepository');
const {
  loadProgress,
  clearProgress,
  markPositionCompleted,
  getRemainingPositions,
} = require('../utils/progressTracker');
const { processBatches } = require('../utils/promisePool');

/**
 * Crawl players for a specific position and season
 * @param {string} position - Player position
 * @param {string} season - Season
 * @param {object} options - Crawl options
 * @returns {Promise<object>} Crawl statistics
 */
async function crawlPositionAndSeason(position, season, options = {}) {
  const stats = {
    position,
    season,
    playersFound: 0,
    playersScraped: 0,
    playersSkipped: 0,
    playersFailed: 0,
    startTime: Date.now(),
  };

  try {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`📍 Position: ${position} | Season: ${season}`);
    logger.info(`${'='.repeat(60)}`);
    
    // Get player list
    logger.info(`🔍 Fetching player list...`);
    const players = await scrapePlayerList(position, [season]);
    stats.playersFound = players.length;
    
    if (players.length === 0) {
      logger.warn(`⚠️  No players found for ${position} - ${season}`);
      return stats;
    }
    
    const concurrency = options.concurrency || REQUEST_CONFIG.concurrency;
    logger.info(`✅ Found ${players.length} players for ${position} (concurrency: ${concurrency})`);
    
    // Process players in parallel batches
    const processPlayer = async (player, index) => {
      const progress = `[${index + 1}/${players.length}]`;
      
      try {
        // Skip if already exists and skipExisting is true
        if (options.skipExisting) {
          const exists = await playerExists(player.playerId, season);
          if (exists) {
            logger.info(`${progress} ⏭️  Skipping: ${player.name} (already exists)`);
            stats.playersSkipped++;
            return { status: 'skipped', player };
          }
        }
        
        logger.info(`${progress} 🔄 Processing: ${player.name}...`);
        
        // Scrape player details
        const detailedData = await scrapePlayerDetail(
          player.playerUrl,
          player.playerId,
          season
        );
        
        // Merge list data with detailed data
        const completePlayerData = {
          ...player,
          ...detailedData,
          position, // Add the position we're crawling for
        };
        
        // Save to database
        await upsertPlayer(completePlayerData);
        
        logger.info(`${progress} ✅ Saved: ${player.name}`);
        stats.playersScraped++;
        
        return { status: 'success', player };
        
      } catch (error) {
        logger.error(`${progress} ❌ Failed: ${player.name}`, {
          playerId: player.playerId,
          error: error.message,
        });
        stats.playersFailed++;
        return { status: 'failed', player, error };
      }
    };
    
    // Process in parallel batches
    await processBatches(players, processPlayer, concurrency);
    
    // Calculate duration
    stats.duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    
    // Summary
    logger.info(`\n${'─'.repeat(60)}`);
    logger.info(`📊 Summary for ${position} - ${season}:`);
    logger.info(`   Found: ${stats.playersFound} | Scraped: ${stats.playersScraped} | Skipped: ${stats.playersSkipped} | Failed: ${stats.playersFailed}`);
    logger.info(`   Duration: ${stats.duration}s`);
    logger.info(`${'─'.repeat(60)}\n`);
    
  } catch (error) {
    logger.error(`Failed to crawl ${position} - ${season}`, {
      error: error.message,
    });
  }
  
  return stats;
}

/**
 * Crawl all positions for a specific season
 * @param {string} season - Season to crawl
 * @param {object} options - Crawl options
 * @returns {Promise<Array<object>>} Array of crawl statistics
 */
async function crawlSeason(season, options = {}) {
  const startTime = Date.now();
  
  // Check for existing progress
  const previousProgress = loadProgress(season);
  const shouldResume = options.resume !== false && previousProgress;
  
  let positionsToProcess = POSITIONS;
  
  if (shouldResume) {
    positionsToProcess = getRemainingPositions(season, POSITIONS);
    
    if (positionsToProcess.length === 0) {
      logger.info(`\n✅ Season ${season} already completed!`);
      logger.info(`   Use --force to re-crawl or clear progress manually.\n`);
      return previousProgress.positionStats ? Object.values(previousProgress.positionStats) : [];
    }
    
    logger.info(`\n🔄 RESUMING CRAWL FROM CHECKPOINT`);
    logger.info(`   Completed: ${POSITIONS.length - positionsToProcess.length}/${POSITIONS.length} positions`);
    logger.info(`   Remaining: ${positionsToProcess.length} positions`);
  } else {
    // Clear old progress if starting fresh
    if (options.force || !options.resume) {
      clearProgress(season);
    }
  }
  
  logger.info(`\n${'='.repeat(80)}`);
  logger.info(`🚀 ${shouldResume ? 'RESUMING' : 'STARTING'} SEASON CRAWL: ${season}`);
  logger.info(`   Total Positions: ${POSITIONS.length}`);
  logger.info(`   Positions to Process: ${positionsToProcess.length}`);
  logger.info(`   Skip Existing Players: ${options.skipExisting !== false ? 'Yes' : 'No'}`);
  logger.info(`${'='.repeat(80)}\n`);
  
  const allStats = [];
  
  for (let i = 0; i < positionsToProcess.length; i++) {
    const position = positionsToProcess[i];
    const totalProcessed = POSITIONS.length - positionsToProcess.length + i + 1;
    const positionProgress = `[${totalProcessed}/${POSITIONS.length}]`;
    
    logger.info(`\n🎯 ${positionProgress} Starting position: ${position}`);
    
    const stats = await crawlPositionAndSeason(position, season, options);
    allStats.push(stats);
    
    // Save progress checkpoint
    markPositionCompleted(season, position, stats);
    
    // Calculate estimated time remaining
    const elapsed = (Date.now() - startTime) / 1000;
    const avgTimePerPosition = elapsed / (i + 1);
    const remaining = avgTimePerPosition * (positionsToProcess.length - i - 1);
    const eta = remaining > 0 ? `${(remaining / 60).toFixed(1)}m` : '0m';
    
    logger.info(`⏱️  Progress: ${totalProcessed}/${POSITIONS.length} positions | ETA: ${eta}`);
  }
  
  // Calculate totals
  const totals = allStats.reduce(
    (acc, stat) => ({
      playersFound: acc.playersFound + stat.playersFound,
      playersScraped: acc.playersScraped + stat.playersScraped,
      playersSkipped: acc.playersSkipped + stat.playersSkipped,
      playersFailed: acc.playersFailed + stat.playersFailed,
    }),
    { playersFound: 0, playersScraped: 0, playersSkipped: 0, playersFailed: 0 }
  );
  
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  // Clear progress on successful completion
  clearProgress(season);
  
  // Final summary
  logger.info(`\n${'='.repeat(80)}`);
  logger.info(`🎉 COMPLETED SEASON CRAWL: ${season}`);
  logger.info(`${'='.repeat(80)}`);
  logger.info(`📊 TOTAL STATISTICS:`);
  logger.info(`   Positions Processed: ${positionsToProcess.length}`);
  logger.info(`   Players Found: ${totals.playersFound}`);
  logger.info(`   Players Scraped: ${totals.playersScraped}`);
  logger.info(`   Players Skipped: ${totals.playersSkipped}`);
  logger.info(`   Players Failed: ${totals.playersFailed}`);
  logger.info(`   Total Duration: ${totalDuration} minutes`);
  logger.info(`   Average per Position: ${(totalDuration / positionsToProcess.length).toFixed(2)} minutes`);
  logger.info(`${'='.repeat(80)}\n`);
  
  return allStats;
}

/**
 * Crawl all seasons and positions
 * @param {object} options - Crawl options
 * @returns {Promise<object>} Overall crawl statistics
 */
async function crawlAll(options = {}) {
  logger.info('Starting full crawl of all positions and seasons');
  
  const startTime = Date.now();
  const seasonStats = [];
  
  for (const season of SEASONS) {
    const stats = await crawlSeason(season, options);
    seasonStats.push({ season, stats });
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds
  
  logger.info(`Completed full crawl in ${duration}s`);
  
  return {
    duration,
    seasonStats,
  };
}

/**
 * Crawl specific positions and seasons
 * @param {string[]} positions - Array of positions to crawl
 * @param {string[]} seasons - Array of seasons to crawl
 * @param {object} options - Crawl options
 * @returns {Promise<Array<object>>} Array of crawl statistics
 */
async function crawlCustom(positions, seasons, options = {}) {
  logger.info('Starting custom crawl', { positions, seasons });
  
  const allStats = [];
  
  for (const season of seasons) {
    for (const position of positions) {
      const stats = await crawlPositionAndSeason(position, season, options);
      allStats.push(stats);
    }
  }
  
  return allStats;
}

module.exports = {
  crawlPositionAndSeason,
  crawlSeason,
  crawlAll,
  crawlCustom,
};
