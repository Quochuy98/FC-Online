/**
 * HTTP client with retry logic and rate limiting
 */

const axios = require('axios');
const logger = require('../utils/logger');
const delay = require('../utils/delay');
const { REQUEST_CONFIG } = require('../config/constants');

/**
 * Make HTTP GET request with retry logic
 * @param {string} url - URL to fetch
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<string>} HTML response
 */
async function fetchWithRetry(url, retries = REQUEST_CONFIG.maxRetries) {
  try {
    logger.debug(`Fetching: ${url}`);
    
    const response = await axios.get(url, {
      timeout: REQUEST_CONFIG.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
      },
    });

    // Add delay to avoid overwhelming the server
    await delay(REQUEST_CONFIG.delay);

    return response.data;
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Request failed, retrying... (${retries} retries left)`, {
        url,
        error: error.message,
      });
      
      // Exponential backoff
      await delay(REQUEST_CONFIG.delay * (REQUEST_CONFIG.maxRetries - retries + 1));
      
      return fetchWithRetry(url, retries - 1);
    }

    logger.error('Request failed after all retries', {
      url,
      error: error.message,
    });
    
    throw error;
  }
}

module.exports = {
  fetchWithRetry,
};
