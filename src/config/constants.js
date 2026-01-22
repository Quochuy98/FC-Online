/**
 * Application constants
 */

// Ensure dotenv is loaded before reading environment variables
if (!process.env.MONGODB_URI && typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv might already be loaded or not available
  }
}

const BASE_URL = 'https://automua.com';

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

// Request configuration
const REQUEST_CONFIG = {
  delay: parseInt(process.env.REQUEST_DELAY) || 500, // Delay between requests (ms)
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000, // 30 seconds
  concurrency: parseInt(process.env.CONCURRENCY) || 3, // Number of parallel requests
};

// MongoDB configuration
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fconline',
  dbName: process.env.DB_NAME || 'fconline',
  collections: {
    players: process.env.PLAYERS_COLLECTION || 'players',
  },
};

// Validate MongoDB URI
if (!MONGODB_CONFIG.uri || typeof MONGODB_CONFIG.uri !== 'string') {
  throw new Error('MONGODB_URI is required. Please set it in your .env file or use default: mongodb://localhost:27017/fconline');
}

module.exports = {
  BASE_URL,
  POSITIONS,
  SEASONS,
  REQUEST_CONFIG,
  MONGODB_CONFIG,
};
