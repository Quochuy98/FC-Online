/**
 * Stats mapping - Vietnamese names to English keys
 * This makes it easier to query and process stats in code
 */

const STATS_MAPPING = {
  // Attack stats
  'Tốc độ': 'speed',
  'Tăng tốc': 'acceleration',
  'Dứt điểm': 'finishing',
  'Lực sút': 'shotPower',
  'Sút xa': 'longShots',
  'Chọn vị trí': 'positioning',
  'Vô lê': 'volleys',
  'Penalty': 'penalties',
  
  // Passing stats
  'Chuyền ngắn': 'shortPassing',
  'Tầm nhìn': 'vision',
  'Tạt bóng': 'crossing',
  'Chuyền dài': 'longPassing',
  'Đá phạt': 'freeKickAccuracy',
  'Sút xoáy': 'curve',
  
  // Dribbling stats
  'Rê bóng': 'dribbling',
  'Giữ bóng': 'ballControl',
  'Khéo léo': 'agility',
  'Thăng bằng': 'balance',
  'Phản ứng': 'reactions',
  
  // Defending stats
  'Kèm người': 'marking',
  'Lấy bóng': 'standingTackle',
  'Cắt bóng': 'interceptions',
  'Xoạc bóng': 'slidingTackle',
  
  // Physical stats
  'Đánh đầu': 'heading',
  'Sức mạnh': 'strength',
  'Thể lực': 'stamina',
  'Quyết đoán': 'aggression',
  'Nhảy': 'jumping',
  'Bình tĩnh': 'composure',
  
  // Goalkeeper stats
  'TM đổ người': 'gkDiving',
  'TM bắt bóng': 'gkHandling',
  'TM phát bóng': 'gkKicking',
  'TM phản xạ': 'gkReflexes',
  'TM chọn vị trí': 'gkPositioning',
};

/**
 * Reverse mapping for lookup (English -> Vietnamese)
 */
const STATS_NAMES = Object.entries(STATS_MAPPING).reduce((acc, [vnName, enKey]) => {
  acc[enKey] = vnName;
  return acc;
}, {});

/**
 * Get English key from Vietnamese name
 * @param {string} vietnameseName - Vietnamese stat name
 * @returns {string} English key or original name if not found
 */
function getStatKey(vietnameseName) {
  return STATS_MAPPING[vietnameseName] || vietnameseName;
}

/**
 * Get Vietnamese name from English key
 * @param {string} englishKey - English stat key
 * @returns {string} Vietnamese name or original key if not found
 */
function getStatName(englishKey) {
  return STATS_NAMES[englishKey] || englishKey;
}

/**
 * Transform stats object from Vietnamese keys to English keys
 * @param {object} stats - Stats object with Vietnamese keys
 * @returns {object} Stats object with English keys and name property
 */
function transformStats(stats) {
  const transformed = {};
  
  for (const [vnName, statData] of Object.entries(stats)) {
    const key = getStatKey(vnName);
    transformed[key] = {
      name: vnName, // Keep Vietnamese name for display
      ...statData,
    };
  }
  
  return transformed;
}

module.exports = {
  STATS_MAPPING,
  STATS_NAMES,
  getStatKey,
  getStatName,
  transformStats,
};
