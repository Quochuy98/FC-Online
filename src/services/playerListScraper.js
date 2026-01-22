/**
 * Service for scraping player list pages
 */

const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { fetchWithRetry } = require('./httpClient');
const { BASE_URL } = require('../config/constants');

/**
 * Build URL for player list page
 * @param {string} position - Player position
 * @param {string[]} seasons - Array of seasons to filter by
 * @returns {string} Formatted URL
 */
function buildPlayerListUrl(position, seasons) {
  // Build query parameters with proper encoding
  // Note: seasons array filters players that have ALL specified seasons
  // e.g., [ICON, EL] returns players with BOTH ICON AND EL cards
  const params = new URLSearchParams();
  params.append('positions[0]', position);
  
  seasons.forEach((season, index) => {
    params.append(`seasons[${index}]`, season);
  });

  return `${BASE_URL}/players?${params.toString()}`;
}

/**
 * Extract player data from list page
 * @param {string} html - HTML content
 * @returns {Array<object>} Array of player objects with basic info
 */
function extractPlayerList(html) {
  const $ = cheerio.load(html);
  const players = [];

  // Find all player cards
  $('.d-flex.align-items-center').each((index, element) => {
    const $element = $(element);
    const $link = $element.find('a[href*="/players/"]');
    
    if ($link.length === 0) return;

    const href = $link.attr('href');
    const playerUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    
    // Extract player ID from URL (e.g., cristiano-ronaldo-zzwyoyoy)
    const playerId = href.split('/').pop();
    
    // Extract player name
    const name = $link.find('.text-truncate').text().trim();
    
    // Extract avatar URL
    const avatarUrl = $link.find('img').attr('src');
    
    // Extract season badge
    const seasonBadge = $link.find('.season-badge').attr('class');
    const season = seasonBadge ? seasonBadge.split('bg-')[1]?.trim() : null;
    
    // Extract positions and ratings
    const positions = [];
    $link.find('.small.text-muted .pos-ST, .small.text-muted .pos-LW, .small.text-muted .pos-RW, .small.text-muted .pos-CF, .small.text-muted .pos-CAM, .small.text-muted .pos-LM, .small.text-muted .pos-RM, .small.text-muted .pos-CM, .small.text-muted .pos-CDM, .small.text-muted .pos-LWB, .small.text-muted .pos-RWB, .small.text-muted .pos-LB, .small.text-muted .pos-RB, .small.text-muted .pos-CB, .small.text-muted .pos-GK').each((i, pos) => {
      const position = $(pos).text().trim();
      const rating = $(pos).parent().contents().filter(function() {
        return this.type === 'text';
      }).text().trim();
      
      if (position) {
        positions.push({
          position,
          rating: rating.replace(/\s+/g, '').trim(),
        });
      }
    });

    // Extract overall rating (hexagon value)
    const overallRating = $link.find('.hexagon-text').text().trim();
    
    // Extract star rating
    const starCount = $link.find('.star-rating .fa-star.fas').length;

    if (name && playerId) {
      players.push({
        playerId,
        name,
        playerUrl,
        avatarUrl: avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${BASE_URL}${avatarUrl}`) : null,
        season,
        positions,
        overallRating: overallRating || null,
        starRating: starCount,
      });
    }
  });

  return players;
}

/**
 * Scrape player list for a specific position and seasons
 * @param {string} position - Player position
 * @param {string[]} seasons - Array of seasons
 * @returns {Promise<Array<object>>} Array of player data
 */
async function scrapePlayerList(position, seasons) {
  try {
    const url = buildPlayerListUrl(position, seasons);
    logger.info(`Scraping player list: ${position} - ${seasons.join(', ')}`);
    
    const html = await fetchWithRetry(url);
    const players = extractPlayerList(html);
    
    logger.info(`Found ${players.length} players for position ${position}`);
    
    return players;
  } catch (error) {
    logger.error('Failed to scrape player list', {
      position,
      seasons,
      error: error.message,
    });
    return [];
  }
}

module.exports = {
  buildPlayerListUrl,
  extractPlayerList,
  scrapePlayerList,
};
