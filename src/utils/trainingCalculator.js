/**
 * Training Calculator - Calculate OVR after training
 * Uses position coefficients to calculate overall rating
 */

const positionCoefficients = require('../config/positionCoefficients.json');
const logger = require('./logger');

/**
 * Find coefficient key for a given position
 * Handles grouped positions like "RW/LW", "LS/ST/RS"
 * 
 * @param {string} position - Position code (ST, RW, CB, etc.)
 * @returns {string|null} Coefficient key or null if not found
 */
function findCoefficientKey(position) {
  // Direct match
  if (positionCoefficients[position]) {
    return position;
  }
  
  // Search in grouped positions (e.g., "RW/LW", "LS/ST/RS")
  for (const key of Object.keys(positionCoefficients)) {
    if (key.includes('/')) {
      const positions = key.split('/');
      if (positions.includes(position)) {
        return key;
      }
    }
  }
  
  return null;
}

/**
 * Calculate overall rating for a specific position based on player stats
 * Formula: OVR = (Σ(stat_value × coefficient)) / Σ(coefficients)
 * 
 * @param {string} position - Position code (ST, RW, CB, etc.)
 * @param {object} playerStats - Player stats object with English keys
 * @returns {number} Calculated overall rating (0-99)
 */
function calculatePositionOVR(position, playerStats) {
  try {
    const coefficientKey = findCoefficientKey(position);
    
    if (!coefficientKey) {
      logger.warn(`Position ${position} not found in coefficients`);
      return 0;
    }
    
    const coefficients = positionCoefficients[coefficientKey];

    let totalWeightedValue = 0;
    let totalCoefficient = 0;

    // Calculate weighted sum
    for (const [statKey, config] of Object.entries(coefficients)) {
      const coefficient = config.coefficient;
      const statValue = playerStats[statKey]?.value || 0;
      
      totalWeightedValue += statValue * coefficient;
      totalCoefficient += coefficient;
    }

    // Calculate OVR (rounded to nearest integer)
    if (totalCoefficient === 0) {
      return 0;
    }

    const ovr = Math.round(totalWeightedValue / totalCoefficient);
    return Math.min(99, Math.max(0, ovr)); // Clamp between 0-99
  } catch (error) {
    logger.error('Failed to calculate position OVR', {
      position,
      error: error.message,
    });
    return 0;
  }
}

/**
 * Calculate OVR for all positions the player can play
 * 
 * @param {object} playerStats - Player stats object with English keys
 * @param {array} positions - Array of position codes to calculate
 * @returns {object} Object with position as key and OVR as value
 */
function calculateAllPositionOVR(playerStats, positions = []) {
  const results = {};
  
  // If no positions specified, calculate for all positions
  const positionsToCalculate = positions.length > 0 
    ? positions 
    : Object.keys(positionCoefficients);

  for (const position of positionsToCalculate) {
    results[position] = calculatePositionOVR(position, playerStats);
  }

  return results;
}

/**
 * Simulate training - increase specific stats and recalculate OVR
 * 
 * @param {string} position - Position to train for
 * @param {object} currentStats - Current player stats
 * @param {object} statIncreases - Object with stat keys and increase amounts
 * @returns {object} Result with old OVR, new OVR, and updated stats
 */
function simulateTraining(position, currentStats, statIncreases) {
  try {
    // Calculate current OVR
    const currentOVR = calculatePositionOVR(position, currentStats);

    // Create new stats object with increases
    const newStats = JSON.parse(JSON.stringify(currentStats)); // Deep clone
    
    for (const [statKey, increase] of Object.entries(statIncreases)) {
      if (newStats[statKey]) {
        const currentValue = newStats[statKey].value || 0;
        const newValue = Math.min(99, currentValue + increase); // Cap at 99
        newStats[statKey].value = newValue;
      }
    }

    // Calculate new OVR
    const newOVR = calculatePositionOVR(position, newStats);

    return {
      position,
      currentOVR,
      newOVR,
      improvement: newOVR - currentOVR,
      currentStats,
      newStats,
      statIncreases,
    };
  } catch (error) {
    logger.error('Failed to simulate training', {
      position,
      error: error.message,
    });
    return null;
  }
}

/**
 * Get the most impactful stats for a position (sorted by coefficient)
 * 
 * @param {string} position - Position code
 * @param {number} topN - Number of top stats to return
 * @returns {array} Array of stat objects with key, name, and coefficient
 */
function getKeyStatsForPosition(position, topN = 5) {
  try {
    const coefficientKey = findCoefficientKey(position);
    
    if (!coefficientKey) {
      return [];
    }
    
    const coefficients = positionCoefficients[coefficientKey];

    // Convert to array and sort by coefficient
    const statsArray = Object.entries(coefficients).map(([key, config]) => ({
      key,
      name: config.name,
      coefficient: config.coefficient,
    }));

    statsArray.sort((a, b) => b.coefficient - a.coefficient);

    return statsArray.slice(0, topN);
  } catch (error) {
    logger.error('Failed to get key stats', {
      position,
      error: error.message,
    });
    return [];
  }
}

/**
 * Calculate optimal training plan to reach target OVR
 * 
 * @param {string} position - Position code
 * @param {object} currentStats - Current player stats
 * @param {number} targetOVR - Target overall rating
 * @param {number} maxStatIncrease - Maximum increase per stat (default: 5)
 * @returns {object} Training plan with recommended stat increases
 */
function calculateTrainingPlan(position, currentStats, targetOVR, maxStatIncrease = 5) {
  try {
    const currentOVR = calculatePositionOVR(position, currentStats);
    
    if (currentOVR >= targetOVR) {
      return {
        success: false,
        message: 'Current OVR already meets or exceeds target',
        currentOVR,
        targetOVR,
      };
    }

    // Get key stats for position
    const keyStats = getKeyStatsForPosition(position, 10);
    
    // Try to increase stats proportionally based on coefficient
    const statIncreases = {};
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const testStats = JSON.parse(JSON.stringify(currentStats));
      
      // Apply increases
      for (const [key, increase] of Object.entries(statIncreases)) {
        if (testStats[key]) {
          testStats[key].value = Math.min(99, (testStats[key].value || 0) + increase);
        }
      }

      const testOVR = calculatePositionOVR(position, testStats);
      
      if (testOVR >= targetOVR) {
        return {
          success: true,
          currentOVR,
          targetOVR,
          achievedOVR: testOVR,
          statIncreases,
          totalIncrease: Object.values(statIncreases).reduce((sum, val) => sum + val, 0),
        };
      }

      // Increase the most impactful stat
      for (const stat of keyStats) {
        const currentIncrease = statIncreases[stat.key] || 0;
        const currentValue = currentStats[stat.key]?.value || 0;
        
        if (currentIncrease < maxStatIncrease && currentValue + currentIncrease < 99) {
          statIncreases[stat.key] = currentIncrease + 1;
          break;
        }
      }

      iterations++;
    }

    return {
      success: false,
      message: 'Could not reach target OVR within constraints',
      currentOVR,
      targetOVR,
      maxStatIncrease,
    };
  } catch (error) {
    logger.error('Failed to calculate training plan', {
      position,
      targetOVR,
      error: error.message,
    });
    return null;
  }
}

/**
 * Get all available positions with their coefficients
 * 
 * @returns {array} Array of position codes (expanded from grouped positions)
 */
function getAllPositions() {
  const positions = [];
  
  for (const key of Object.keys(positionCoefficients)) {
    if (key.includes('/')) {
      // Expand grouped positions
      positions.push(...key.split('/'));
    } else {
      positions.push(key);
    }
  }
  
  return positions;
}

/**
 * Get coefficient details for a position
 * 
 * @param {string} position - Position code
 * @returns {object} Coefficients object or null
 */
function getPositionCoefficients(position) {
  const coefficientKey = findCoefficientKey(position);
  return coefficientKey ? positionCoefficients[coefficientKey] : null;
}

module.exports = {
  calculatePositionOVR,
  calculateAllPositionOVR,
  simulateTraining,
  getKeyStatsForPosition,
  calculateTrainingPlan,
  getAllPositions,
  getPositionCoefficients,
  findCoefficientKey,
};
