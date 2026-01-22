/**
 * Main entry point for FC Online Player Crawler
 */

require('dotenv').config();

const logger = require('./utils/logger');
const { connect, disconnect } = require('./database/connection');
const { createIndexes } = require('./database/playerRepository');
const {
  crawlPositionAndSeason,
  crawlSeason,
  crawlAll,
  crawlCustom,
} = require('./services/crawlerService');
const {
  clearSeasonsProgress,
  markSeasonCompleted,
  getRemainingSeasons,
  getCrawlStats,
} = require('./utils/seasonsProgress');

/**
 * Main application entry point
 */
async function main() {
  try {
    logger.info('=== FC Online Player Crawler Started ===');
    
    // Connect to database
    await connect();
    
    // Create database indexes
    await createIndexes();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    const options = {
      skipExisting: !args.includes('--force'), // Skip existing players by default
    };
    
    switch (command) {
      case 'all':
        // Crawl all positions and seasons
        logger.info('Starting full crawl (all positions and seasons)');
        await crawlAll(options);
        break;
        
      case 'seasons': {
        // Crawl multiple seasons with resume capability
        const { SEASONS } = require('./config/constants');
        const count = args[1] ? parseInt(args[1]) : null;
        
        if (count && (isNaN(count) || count < 1)) {
          logger.error('Please specify a valid number. Example: npm start seasons 10');
          process.exit(1);
        }
        
        // Determine which seasons to crawl
        const allSeasonsToCrawl = count ? SEASONS.slice(0, count) : SEASONS;
        
        // Check for existing progress
        const shouldResume = !args.includes('--force');
        let seasonsToCrawl = allSeasonsToCrawl;
        
        if (shouldResume) {
          const remaining = getRemainingSeasons(allSeasonsToCrawl);
          const stats = getCrawlStats(allSeasonsToCrawl);
          
          if (remaining.length === 0) {
            logger.info(`\n✅ All ${allSeasonsToCrawl.length} seasons already completed!`);
            logger.info(`   Use --force to re-crawl from beginning.\n`);
            break;
          }
          
          if (remaining.length < allSeasonsToCrawl.length) {
            logger.info(`\n🔄 RESUMING SEASONS CRAWL FROM CHECKPOINT`);
            logger.info(`   Total: ${stats.total} seasons`);
            logger.info(`   Completed: ${stats.completed} seasons`);
            logger.info(`   Remaining: ${stats.remaining} seasons`);
            logger.info(`   Completed seasons: ${stats.completedSeasons.join(', ')}\n`);
          }
          
          seasonsToCrawl = remaining;
        } else {
          // Force mode - clear progress
          clearSeasonsProgress();
        }
        
        // Start crawling
        logger.info(`\n${'='.repeat(80)}`);
        logger.info(`🌟 STARTING MULTI-SEASON CRAWL`);
        logger.info(`   Total Seasons: ${allSeasonsToCrawl.length}`);
        logger.info(`   Seasons to Crawl: ${seasonsToCrawl.length}`);
        logger.info(`   Skip Existing Players: ${options.skipExisting ? 'Yes' : 'No'}`);
        logger.info(`   Resume: ${shouldResume ? 'Yes' : 'No (--force)'}`);
        logger.info(`${'='.repeat(80)}\n`);
        
        const startTime = Date.now();
        
        for (let i = 0; i < seasonsToCrawl.length; i++) {
          const s = seasonsToCrawl[i];
          const totalIndex = allSeasonsToCrawl.indexOf(s) + 1;
          
          logger.info(`\n${'='.repeat(80)}`);
          logger.info(`🌟 SEASON ${totalIndex}/${allSeasonsToCrawl.length}: ${s} (${i + 1}/${seasonsToCrawl.length} remaining)`);
          logger.info(`${'='.repeat(80)}\n`);
          
          try {
            await crawlSeason(s, options);
            markSeasonCompleted(s);
            
            logger.info(`\n✅ Season ${s} completed and checkpointed!`);
          } catch (error) {
            logger.error(`\n❌ Season ${s} failed: ${error.message}`);
            logger.info(`   Progress saved. Run again to resume from next season.`);
          }
          
          // Short pause between seasons
          if (i < seasonsToCrawl.length - 1) {
            logger.info(`\n⏸️  Brief pause before next season (2s)...\n`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        
        // Final summary
        logger.info(`\n${'='.repeat(80)}`);
        logger.info(`🎉 MULTI-SEASON CRAWL COMPLETED!`);
        logger.info(`${'='.repeat(80)}`);
        logger.info(`   Seasons Crawled: ${seasonsToCrawl.length}`);
        logger.info(`   Total Duration: ${totalDuration} minutes`);
        logger.info(`   Average per Season: ${(totalDuration / seasonsToCrawl.length).toFixed(2)} minutes`);
        logger.info(`${'='.repeat(80)}\n`);
        
        // Clear progress on successful completion
        clearSeasonsProgress();
        break;
      }
        
      case 'season':
        // Crawl specific season
        const season = args[1];
        if (!season) {
          logger.error('Please specify a season. Example: npm start season EL');
          process.exit(1);
        }
        logger.info(`Crawling season: ${season}`);
        await crawlSeason(season, options);
        break;
        
      case 'position':
        // Crawl specific position and season
        const position = args[1];
        const positionSeason = args[2];
        if (!position || !positionSeason) {
          logger.error('Please specify position and season. Example: npm start position ST EL');
          process.exit(1);
        }
        logger.info(`Crawling position ${position} for season ${positionSeason}`);
        await crawlPositionAndSeason(position, positionSeason, options);
        break;
        
      case 'custom':
        // Crawl custom positions and seasons
        // Format: npm start custom ST,LW,RW EL,ICON
        const positionsArg = args[1];
        const seasonsArg = args[2];
        
        if (!positionsArg || !seasonsArg) {
          logger.error('Please specify positions and seasons. Example: npm start custom ST,LW,RW EL,ICON');
          process.exit(1);
        }
        
        const positions = positionsArg.split(',').map(p => p.trim());
        const seasons = seasonsArg.split(',').map(s => s.trim());
        
        logger.info(`Crawling custom: positions=${positions.join(', ')}, seasons=${seasons.join(', ')}`);
        await crawlCustom(positions, seasons, options);
        break;
        
      case 'help':
      default:
        printHelp();
        break;
    }
    
    logger.info('=== FC Online Player Crawler Completed ===');
    
  } catch (error) {
    logger.error('Application error', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnect();
  }
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
FC Online Player Crawler
========================

Usage: npm start [command] [options]

Commands:
  seasons [count]               Crawl multiple seasons sequentially (AUTO-RESUME)
                                - No count: crawl ALL 100+ seasons
                                - With count: crawl first N seasons
                                - Auto-resume if interrupted (Ctrl+C safe!)
  
  season <season>               Crawl all positions for a specific season
  position <pos> <season>       Crawl specific position and season
  custom <positions> <seasons>  Crawl custom positions and seasons (comma-separated)
  all                           Crawl all positions and all seasons
  help                          Show this help message

Options:
  --force                       Force re-crawl (skip resume, clear checkpoint)

Examples:
  npm start seasons                      # Crawl ALL seasons (auto-resume on restart)
  npm start seasons 10                   # Crawl first 10 seasons (auto-resume)
  npm start seasons 5                    # Crawl top 5 popular seasons
  npm start season EL                    # Crawl single season EL
  npm start position ST EL               # Crawl ST position for season EL
  npm start custom ST,LW,RW EL,ICON      # Crawl multiple positions and seasons
  npm start seasons --force              # Re-crawl all seasons from beginning

Auto-Resume Feature:
  If you stop the crawl (Ctrl+C or crash), just run the same command again:
  
  $ npm start seasons 10
  # Crawls season 1, 2, 3... then you press Ctrl+C
  
  $ npm start seasons 10
  # Auto-resumes from season 4! (skips 1-3)
  
  Use --force to start from beginning and clear checkpoints.

Popular Seasons (recommended to start with):
  ICONTM, ICON, EL, 25TY, 24TY, FAC, 25DP, FSL, ICONTMB, WS

Environment Variables:
  MONGODB_URI          MongoDB connection string (default: mongodb://localhost:27017/fconline)
  DB_NAME              Database name (default: fconline)
  PLAYERS_COLLECTION   Collection name (default: players)
  REQUEST_DELAY        Delay between requests in ms (default: 1000)
  MAX_RETRIES          Max retry attempts (default: 3)

Configuration:
  Create a .env file in the root directory with your settings.
  See .env.example for reference.
  `);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await disconnect();
  process.exit(0);
});

// Run the application
main();
