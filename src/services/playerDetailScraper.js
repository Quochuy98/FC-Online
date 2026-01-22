/**
 * Service for scraping player detail pages
 */

const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { fetchWithRetry } = require('./httpClient');
const { transformStats } = require('../config/statsMapping');

/**
 * Extract general stats from player detail page
 * @param {object} $ - Cheerio instance
 * @returns {object} Object containing all player stats
 */
function extractGeneralStats($) {
  const stats = {};
  
  // Find the playerTabsContent div and extract stats from "all-stats" tab
  $('#playerTabsContent #all-stats .card-body').each((index, cardBody) => {
    $(cardBody).find('.d-flex.justify-content-between').each((i, statRow) => {
      const $row = $(statRow);
      const statName = $row.find('.small').text().trim();
      const statValue = $row.find('.stat-value').text().trim();
      const baseValue = $row.find('.stat-value').attr('data-base');
      const originalValue = $row.find('.stat-value').attr('o-val');
      
      if (statName && statValue) {
        stats[statName] = {
          value: parseInt(statValue) || statValue,
          baseValue: baseValue ? parseInt(baseValue) : null,
          originalValue: originalValue ? parseInt(originalValue) : null,
        };
      }
    });
  });
  
  return stats;
}

/**
 * Extract hidden stats/traits from player detail page
 * @param {object} $ - Cheerio instance
 * @returns {Array<object>} Array of traits/hidden stats
 */
function extractHiddenStats($) {
  const hiddenStats = [];
  
  // Find the div with class "row row-cols-2 row-cols-md-3 g-3 py-3"
  $('.row.row-cols-2.row-cols-md-3.g-3.py-3 .col').each((index, element) => {
    const $element = $(element);
    const $content = $element.find('.border.rounded');
    
    const iconUrl = $content.find('img').attr('src');
    const name = $content.find('strong').text().trim();
    const description = $content.find('small').text().trim();
    
    if (name) {
      hiddenStats.push({
        name,
        description: description || null,
        iconUrl: iconUrl || null,
      });
    }
  });
  
  return hiddenStats;
}

/**
 * Extract club career information
 * @param {object} $ - Cheerio instance
 * @returns {Array<object>} Array of club career entries
 */
function extractClubCareer($) {
  const clubCareer = [];
  
  // Find the "Sự nghiệp CLB" section
  $('h5:contains("Sự nghiệp CLB")').parent().next('.card-body').find('.border-bottom').each((index, element) => {
    const text = $(element).text().trim();
    
    if (text) {
      // Parse year and club name
      // Format: "2023: Al Nassr" or "2021 - 2022: Manchester United"
      const match = text.match(/^([\d\s\-]+):\s*(.+)$/);
      
      if (match) {
        clubCareer.push({
          period: match[1].trim(),
          club: match[2].trim(),
        });
      } else {
        clubCareer.push({
          period: null,
          club: text,
        });
      }
    }
  });
  
  return clubCareer;
}

/**
 * Extract additional player information from detail page
 * @param {object} $ - Cheerio instance
 * @returns {object} Additional player information
 */
function extractAdditionalInfo($) {
  const info = {};
  
  // Extract player name from page title or header
  const playerName = $('h1').first().text().trim() || 
                    $('title').text().split('-')[0]?.trim();
  
  if (playerName) {
    info.name = playerName;
  }
  
  // Extract main avatar/image
  const mainImage = $('.player-avatar img, .card img').first().attr('src');
  if (mainImage) {
    info.mainImageUrl = mainImage;
  }
  
  // Extract overall rating if available
  const overallRating = $('.hexagon-text').first().text().trim();
  if (overallRating) {
    info.overallRating = parseInt(overallRating) || overallRating;
  }
  
  return info;
}

/**
 * Scrape complete player details
 * @param {string} playerUrl - URL to player detail page
 * @param {string} playerId - Player ID
 * @param {string} season - Season
 * @returns {Promise<object>} Complete player data
 */
async function scrapePlayerDetail(playerUrl, playerId, season) {
  try {
    logger.debug(`Scraping player detail: ${playerId}`);
    
    const html = await fetchWithRetry(playerUrl);
    const $ = cheerio.load(html);
    
    // Extract all data
    const generalStats = extractGeneralStats($);
    const hiddenStats = extractHiddenStats($);
    const clubCareer = extractClubCareer($);
    const additionalInfo = extractAdditionalInfo($);
    
    // Transform stats to use English keys with Vietnamese names
    const transformedStats = transformStats(generalStats);
    
    // Build complete player object
    const playerData = {
      playerId,
      season,
      playerUrl,
      ...additionalInfo,
      stats: transformedStats,
      hiddenStats,
      clubCareer,
      scrapedAt: new Date(),
    };
    
    logger.debug(`Successfully scraped player: ${playerId}`);
    
    return playerData;
  } catch (error) {
    logger.error('Failed to scrape player detail', {
      playerId,
      playerUrl,
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  extractGeneralStats,
  extractHiddenStats,
  extractClubCareer,
  extractAdditionalInfo,
  scrapePlayerDetail,
};
