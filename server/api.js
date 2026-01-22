/**
 * API Server for FC Online Player Database
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connect, getDatabase } = require('../src/database/connection');
const logger = require('../src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Constants
const POSITIONS = [
  'ST', 'LW', 'RW', 'CF', 'CAM',
  'LM', 'RM', 'CM', 'CDM',
  'LWB', 'RWB', 'LB', 'RB', 'CB', 'GK'
];

const SEASONS = [
  'ICONTM', 'ICON', 'ICONTMB', 'FAC', '25DP', 'FSL', 'WS', 'DCB', 'CH',
  '25IM', '25IMF', 'LE', 'NO7', 'WB', 'GRU', 'BDO', 'BLD', 'PRM',
  '24EP', 'CU', 'MDL', 'LD', 'UT', 'JNM', 'DC', 'FC', '23HW', 'CC',
  'HG', 'RTN', 'BWC', 'WC22', '26TY', '26TYN', '25TY', '25TYN', '24TY',
  '24TYN', '23TY', '23TYN', '22TY', '22TYN', '21TY', '21TYN', '20TY',
  '20TYN', '19TY', '18TY', '25TS', '24TS', '23TS', '22TS', '21TS',
  '20TS', '19TS', 'SPL', 'LN', 'BTB', 'CAP', 'EBS', 'LOL', 'FA',
  'VTR', 'EU24', 'LH', 'MC', 'UP', 'TB', 'TC', 'TT', 'GR', 'HOT',
  'OTW', 'BOE', 'BOE21', 'COC', 'CFA', 'MOG', 'NHD', 'NTG',
  '25', '24', '23', '22', '21', '20', '19', '18', '17',
  '25PL', '24PL', '23PL', '22PL', '21PL', '20A', '19S', '19A', '18S', '18A',
  '23NG', '22NG', '21NG', '20NG', '19NG',
  '25HR', '24HR', '23HR', '22HR',
  '24UCL', '23UCL', '22UCL', '21UCL', '20UCL', '19UCL',
  '25VB', '24VB', '23VB', '22VB', 'VFG', 'VNL', 'VN',
  'JA', 'MCC', 'MCI', 'ICONM', 'PSG', 'RMFC', 'LA', 'TKL', 'TKI',
  'THB', 'THL', 'VLA', 'HC', '12KH',
  '20KL', '20KLB', '21KL', '21KLB', '22KL', '22KLB', '23KL', '23KLB',
  '24KL', '24KLB', '25KL', 'K18', 'K19', 'K21', 'K22', 'K23',
  '22TG', '21TG', '24WL', '23WL', '22WL', '21WL', '20WL', '19WL',
  'SYL', 'DYL', 'RYL', 'TYL', 'MLS', 'TK', '25CSL', 'FLG', 'EL'
];

/**
 * API Routes
 */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Get constants (positions, seasons)
app.get('/api/constants', (req, res) => {
  res.json({
    positions: POSITIONS,
    seasons: SEASONS,
  });
});

// Get all position coefficients
app.get('/api/position-coefficients/all', (req, res) => {
  try {
    const positionCoefficients = require('../src/config/positionCoefficients.json');
    res.json({
      success: true,
      data: positionCoefficients,
    });
  } catch (error) {
    logger.error('Get all position coefficients error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get position coefficients',
    });
  }
});

// Get position coefficients by position
app.get('/api/position-coefficients/:position', (req, res) => {
  try {
    const { position } = req.params;
    const positionCoefficients = require('../src/config/positionCoefficients.json');
    
    // Find coefficient key (handles grouped positions like RW/LW)
    let coefficientKey = null;
    let coefficients = null;
    
    // Direct match
    if (positionCoefficients[position]) {
      coefficientKey = position;
      coefficients = positionCoefficients[position];
    } else {
      // Search in grouped positions
      for (const key of Object.keys(positionCoefficients)) {
        if (key.includes('/')) {
          const positions = key.split('/');
          if (positions.includes(position)) {
            coefficientKey = key;
            coefficients = positionCoefficients[key];
            break;
          }
        }
      }
    }
    
    if (!coefficients) {
      return res.status(404).json({
        success: false,
        error: `Position ${position} not found`,
      });
    }
    
    res.json({
      success: true,
      data: {
        position,
        groupKey: coefficientKey,
        coefficients,
      },
    });
  } catch (error) {
    logger.error('Get position coefficients error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get position coefficients',
    });
  }
});

// Search players
app.get('/api/players/search', async (req, res) => {
  try {
    const {
      name,
      position,
      season,      // For backward compatibility (single season)
      seasons,     // New: comma-separated list of seasons
      minOverall,
      maxOverall,
      page = 1,
      limit = 20,
      sortBy = 'overall',
      sortOrder = 'desc',
    } = req.query;

    const db = getDatabase();
    const collection = db.collection('players');

    // Build query
    const query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (position) {
      query.position = position;
    }

    // Handle multiple seasons (comma-separated) or single season
    if (seasons) {
      const seasonArray = seasons.split(',').map(s => s.trim()).filter(s => s);
      if (seasonArray.length > 0) {
        query.season = { $in: seasonArray };
      }
    } else if (season) {
      query.season = season;
    }

    if (minOverall || maxOverall) {
      query.overallDisplay = {};
      if (minOverall) query.overallDisplay.$gte = parseInt(minOverall);
      if (maxOverall) query.overallDisplay.$lte = parseInt(maxOverall);
    }

    // Count total
    const total = await collection.countDocuments(query);

    // Build sort
    const sort = {};
    if (sortBy === 'overall') {
      sort.overallDisplay = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Get players
    const players = await collection
      .find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    res.json({
      success: true,
      data: players,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Search players error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to search players',
    });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const collection = db.collection('players');

    const player = await collection.findOne({ playerId: id });

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    logger.error('Get player error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get player',
    });
  }
});

// Get stats comparison
app.get('/api/players/:id/compare', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, season } = req.query;

    const db = getDatabase();
    const collection = db.collection('players');

    const player = await collection.findOne({ playerid: id });

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }

    // Get similar players (same position, similar overall)
    const query = {
      position: position || player.position,
      playerid: { $ne: id },
    };

    if (season) {
      query.season = season;
    }

    // Get players with overall within ±5
    const overall = player.overallDisplay || 0;
    query.overallDisplay = {
      $gte: overall - 5,
      $lte: overall + 5,
    };

    const similarPlayers = await collection
      .find(query)
      .sort({ overallDisplay: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      data: {
        player,
        similarPlayers,
      },
    });
  } catch (error) {
    logger.error('Compare players error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to compare players',
    });
  }
});

// Get aggregate stats
app.get('/api/stats/aggregate', async (req, res) => {
  try {
    const { groupBy = 'season' } = req.query;
    const db = getDatabase();
    const collection = db.collection('players');

    let pipeline = [];

    if (groupBy === 'season') {
      pipeline = [
        {
          $group: {
            _id: '$season',
            count: { $sum: 1 },
            avgOverall: { $avg: '$overallDisplay' },
            maxOverall: { $max: '$overallDisplay' },
            minOverall: { $min: '$overallDisplay' },
          },
        },
        { $sort: { count: -1 } },
      ];
    } else if (groupBy === 'position') {
      pipeline = [
        {
          $group: {
            _id: '$position',
            count: { $sum: 1 },
            avgOverall: { $avg: '$overallDisplay' },
          },
        },
        { $sort: { count: -1 } },
      ];
    }

    const stats = await collection.aggregate(pipeline).toArray();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Aggregate stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await connect();
    logger.info('Connected to MongoDB');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 API Server running on http://localhost:${PORT}`);
      logger.info(`   - API: http://localhost:${PORT}/api`);
      logger.info(`   - Search: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  process.exit(0);
});

// Start server if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
