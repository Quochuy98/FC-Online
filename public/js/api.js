/**
 * API Client for FC Online Player Database
 */

const API_BASE_URL = window.location.origin;

class PlayerAPI {
  /**
   * Fetch constants (positions, seasons)
   */
  static async getConstants() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/constants`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch constants:', error);
      throw error;
    }
  }

  /**
   * Search players
   */
  static async searchPlayers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/players/search?${queryString}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search players');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to search players:', error);
      throw error;
    }
  }

  /**
   * Get player by ID
   */
  static async getPlayer(playerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/players/${playerId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get player');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get player:', error);
      throw error;
    }
  }

  /**
   * Get stats aggregate
   */
  static async getStatsAggregate(groupBy = 'season') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats/aggregate?groupBy=${groupBy}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get stats');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }
}

/**
 * Utility functions
 */
const Utils = {
  /**
   * Get URL parameters
   */
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Update URL without reload
   */
  updateUrl(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.set(key, params[key]);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url);
  },

  /**
   * Format number
   */
  formatNumber(num) {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};
