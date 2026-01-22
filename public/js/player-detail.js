/**
 * Player Detail Page Logic
 */

// DOM Elements
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const playerDetailsDiv = document.getElementById('playerDetails');
const playerAvatar = document.getElementById('playerAvatar');
const playerName = document.getElementById('playerName');
const playerSeasonBadge = document.getElementById('playerSeasonBadge');
const playerPositionsDiv = document.getElementById('playerPositions');
const statsTabsNav = document.getElementById('statsTabs');
const statsTabsContent = document.getElementById('statsTabsContent');
const hiddenStatsDiv = document.getElementById('hiddenStats');
const hiddenStatsSection = document.getElementById('hiddenStatsSection');
const clubCareerDiv = document.getElementById('clubCareer');
const clubCareerSection = document.getElementById('clubCareerSection');

// Store current player data
let currentPlayer = null;

// Store training values for each position tab
let trainingData = {};

// Training limits
const MAX_TRAINED_STATS = 5; // Maximum number of stats that can be trained
const MAX_TRAINING_VALUE = 2; // Maximum training value per stat (+2)

// Upgrade Level OVR Bonuses (based on FC Online upgrade system)
const UPGRADE_OVR_BONUS = {
  1: 0,   2: 1,   3: 2,   4: 4,   5: 6,
  6: 9,   7: 12,  8: 15,  9: 18,  10: 21,
  11: 23, 12: 25, 13: 27
};

/**
 * Get color class based on stat value
 */
function getStatColorClass(value) {
  if (value >= 160) return 'text-blue-600 font-bold';
  if (value >= 150) return 'text-yellow-600 font-bold';
  if (value >= 140) return 'text-yellow-600 font-bold';
  if (value >= 130) return 'text-orange-600 font-bold';
  if (value >= 120) return 'text-purple-600 font-semibold';
  return 'text-gray-800';
}

/**
 * Initialize page
 */
async function init() {
  try {
    // Get player ID from URL
    const params = Utils.getUrlParams();
    const id = params.id;
    
    if (!id) {
      showError('Không tìm thấy ID cầu thủ');
      return;
    }
    
    // Fetch player data
    const result = await PlayerAPI.getPlayer(id);
    const player = result.data;
    
    // Display player
    displayPlayer(player);
    
    // Hide loading
    loadingDiv.classList.add('hidden');
    playerDetailsDiv.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading player:', error);
    loadingDiv.classList.add('hidden');
    showError('Không thể tải thông tin cầu thủ. Vui lòng thử lại!');
  }
}

/**
 * Display player information
 */
async function displayPlayer(player) {
  currentPlayer = player;
  
  // Header
  playerAvatar.src = player.avatarUrl || '/images/default-player.png';
  playerAvatar.onerror = () => playerAvatar.src = '/images/default-player.png';
  playerName.textContent = player.name;
  playerSeasonBadge.className = `season-badge bg-${player.season}`;
  playerSeasonBadge.title = player.season;
  
  // Display all positions with ratings
  displayPositions(player);
  
  // Render tabs and stats
  await renderStatsTabs(player);
  
  // Hidden stats
  displayHiddenStats(player);
  
  // Club career
  displayClubCareer(player);
}

/**
 * Display all positions and ratings
 */
function displayPositions(player) {
  playerPositionsDiv.innerHTML = '';
  
  if (!player.positions || !Array.isArray(player.positions) || player.positions.length === 0) {
    playerPositionsDiv.innerHTML = '<span class="text-gray-400 text-sm">Không có thông tin vị trí</span>';
    return;
  }
  
  player.positions.forEach((pos, index) => {
    const positionBadge = document.createElement('div');
    
    // Primary position gets special styling
    const isPrimary = pos.position === player.position;
    const bgColor = isPrimary ? 'bg-primary' : 'bg-gray-600';
    const borderClass = isPrimary ? 'border-2 border-primary-dark' : '';
    
    // Extract rating by index (format: "122|121|120" → ratings[index])
    let rating = '';
    if (pos.rating && typeof pos.rating === 'string') {
      const ratings = pos.rating.split('|');
      rating = ratings[index] || ratings[0] || '';
    } else if (typeof pos.rating === 'number') {
      rating = pos.rating;
    }
    
    positionBadge.className = `inline-flex items-center gap-2 px-3 py-2 ${bgColor} text-white rounded-lg text-sm font-semibold ${borderClass} transition-all hover:scale-105`;
    
    positionBadge.innerHTML = `
      <span class="font-bold">${pos.position}</span>
      <span class="text-amber-300 font-bold">${rating}</span>
    `;
    
    playerPositionsDiv.appendChild(positionBadge);
  });
}

/**
 * Available position groups for training (must match positionCoefficients.json)
 */
const POSITION_GROUPS = [
  'RW/LW',
  'LS/ST/RS',
  'LF/CF/RF',
  'LAM/CAM/RAM',
  'RM/LM',
  'LCM/CM/RCM',
  'LDM/CDM/RDM',
  'LWB/RWB',
  'CB',
  'SW',
  'LB/RB',
  'GK'
];

/**
 * Render stats tabs (only 2 tabs now)
 */
async function renderStatsTabs(player) {
  if (!player.positions || !Array.isArray(player.positions) || player.positions.length === 0) {
    statsTabsNav.innerHTML = '<p class="text-gray-400 py-4">Không có thông tin vị trí</p>';
    statsTabsContent.innerHTML = '';
    return;
  }
  
  // Create 2 fixed tabs
  statsTabsNav.innerHTML = '';
  
  // Tab 1: "Chỉ số chung"
  const allTab = createTabButton('all', 'Chỉ số chung', true);
  statsTabsNav.appendChild(allTab);
  
  // Tab 2: "Đào tạo cầu thủ"
  const trainingTab = createTabButton('training', 'Đào tạo cầu thủ', false);
  statsTabsNav.appendChild(trainingTab);
  
  // Create tab contents
  statsTabsContent.innerHTML = '';
  
  // Tab 1 content: "Chỉ số chung"
  const allContent = document.createElement('div');
  allContent.id = 'allTab';
  allContent.className = 'stats-tab-content';
  allContent.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <tbody class="divide-y divide-gray-100" id="allStatsTable"></tbody>
      </table>
    </div>
  `;
  statsTabsContent.appendChild(allContent);
  
  // Display all stats in "Chỉ số chung"
  displayAllStats(player.stats, 'allStatsTable');
  
  // Tab 2 content: "Đào tạo cầu thủ"
  const trainingContent = document.createElement('div');
  trainingContent.id = 'trainingTab';
  trainingContent.className = 'stats-tab-content hidden';
  statsTabsContent.appendChild(trainingContent);
  
  // Render training tab with dropdown
  renderTrainingTab(player);
  
  // Setup tab switching
  setupTabs();
}

/**
 * Render training tab with position selector
 */
function renderTrainingTab(player) {
  const trainingContent = document.getElementById('trainingTab');
  if (!trainingContent) return;
  
  // Get first position group as default
  const defaultPosition = POSITION_GROUPS[0];
  
  trainingContent.innerHTML = `
    <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
      <label for="position-selector" class="block text-sm font-semibold text-gray-700 mb-3">
        🎯 Chọn vị trí để đào tạo:
      </label>
      <select 
        id="position-selector" 
        onchange="window.onPositionChange()"
        class="w-full px-4 py-3 text-base font-semibold text-blue-700 bg-white border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
      >
        ${POSITION_GROUPS.map(group => `
          <option value="${group}">${group}</option>
        `).join('')}
      </select>
      <p class="text-xs text-gray-600 mt-2 italic">
        💡 Chỉ số và hệ số sẽ thay đổi theo vị trí bạn chọn
      </p>
    </div>
    <div id="training-content">
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-2 text-gray-500">Đang tải chỉ số...</p>
      </div>
    </div>
  `;
  
  // Load default position
  loadTrainingPosition(defaultPosition, player.stats);
}

/**
 * Handle position change in training tab
 */
window.onPositionChange = function() {
  const select = document.getElementById('position-selector');
  if (!select || !currentPlayer) return;
  
  const position = select.value;
  loadTrainingPosition(position, currentPlayer.stats);
};

/**
 * Load training position stats
 */
async function loadTrainingPosition(positionGroup, playerStats) {
  const trainingContentDiv = document.getElementById('training-content');
  if (!trainingContentDiv) return;
  
  // Show loading
  trainingContentDiv.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-gray-500">Đang tải chỉ số cho ${positionGroup}...</p>
    </div>
  `;
  
  try {
    // Fetch coefficients for this position group
    const response = await fetch(`/api/position-coefficients/${encodeURIComponent(positionGroup)}`);
    const result = await response.json();
    
    if (!result.success) {
      trainingContentDiv.innerHTML = `
        <p class="text-center text-red-500 py-8">
          Không tìm thấy hệ số cho vị trí ${positionGroup}
        </p>
      `;
      return;
    }
    
    const coefficients = result.data.coefficients;
    const contentId = 'trainingTab';
    
    // Sort stats by coefficient (descending)
    const statsWithCoef = [];
    for (const [key, config] of Object.entries(coefficients)) {
      if (playerStats[key]) {
        statsWithCoef.push({
          key,
          stat: playerStats[key],
          coefficient: config.coefficient,
        });
      }
    }
    
    statsWithCoef.sort((a, b) => b.coefficient - a.coefficient);
    
    // Initialize training data for this position
    if (!trainingData[contentId]) {
      trainingData[contentId] = {
        coefficients,
        stats: {},
        statTeamColors: {},
        level: 0,
        teamColor: 0,
        upgradeLevel: 1,
      };
      statsWithCoef.forEach(s => {
        trainingData[contentId].stats[s.key] = 0;
        trainingData[contentId].statTeamColors[s.key] = 0;
      });
    } else {
      // Update coefficients and reset stats if position changed
      trainingData[contentId].coefficients = coefficients;
      // Reset stats for new position
      trainingData[contentId].stats = {};
      trainingData[contentId].statTeamColors = {};
      statsWithCoef.forEach(s => {
        trainingData[contentId].stats[s.key] = 0;
        trainingData[contentId].statTeamColors[s.key] = 0;
      });
    }
    
    // Render content
    renderTrainingContent(positionGroup, statsWithCoef, contentId);
    
  } catch (error) {
    console.error('Error loading training position:', error);
    trainingContentDiv.innerHTML = `
      <p class="text-center text-red-500 py-8">
        Lỗi khi tải dữ liệu. Vui lòng thử lại!
      </p>
    `;
  }
}

/**
 * Render training content with buffs and stats table
 */
function renderTrainingContent(positionGroup, statsWithCoef, contentId) {
  const trainingContentDiv = document.getElementById('training-content');
  if (!trainingContentDiv) return;
  
  trainingContentDiv.innerHTML = `
    <!-- Compact Layout: Buffs + OVR side by side -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <!-- Left: Buffs Controls (2 columns) -->
      <div class="lg:col-span-2">
        <div class="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300 h-full">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-gray-700">⚡ Buffs & Enhancements</p>
            <p class="text-xs text-purple-600 italic">Áp dụng cho tất cả chỉ số</p>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <!-- Upgrade Level -->
            <div class="bg-white p-2 rounded-lg border border-yellow-300">
              <label for="${contentId}-upgradeLevel-select" class="block text-xs font-semibold text-gray-600 mb-1">
                ⭐ Cấp thẻ
              </label>
              <div class="flex items-center gap-2">
                <div id="${contentId}-upgrade-icon" class="upgrade-icon upgrade-level-1" style="flex-shrink: 0;"></div>
                <select 
                  id="${contentId}-upgradeLevel-select" 
                  onchange="updateUpgradeLevel('${contentId}')"
                  class="flex-1 px-2 py-1 text-xs font-bold text-yellow-700 bg-white border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <option value="1">+1 (+0)</option>
                  <option value="2">+2 (+1)</option>
                  <option value="3">+3 (+2)</option>
                  <option value="4">+4 (+4)</option>
                  <option value="5">+5 (+6)</option>
                  <option value="6">+6 (+9)</option>
                  <option value="7">+7 (+12)</option>
                  <option value="8">+8 (+15)</option>
                  <option value="9">+9 (+18)</option>
                  <option value="10">+10 (+21)</option>
                  <option value="11">+11 (+23)</option>
                  <option value="12">+12 (+25)</option>
                  <option value="13">+13 (+27)</option>
                </select>
              </div>
            </div>
            
            <!-- Level -->
            <div class="bg-white p-2 rounded-lg border border-purple-200">
              <label for="${contentId}-level-select" class="block text-xs font-semibold text-gray-600 mb-1">
                🎚️ Level
              </label>
              <select 
                id="${contentId}-level-select" 
                onchange="updateBuffFromDropdown('${contentId}', 'level')"
                class="w-full px-2 py-1 text-xs font-bold text-purple-700 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:border-purple-300 transition-colors"
              >
                <option value="0">1</option>
                <option value="1">2</option>
                <option value="2">3</option>
                <option value="3">4</option>
                <option value="4">5</option>
              </select>
            </div>
            
            <!-- Team Color -->
            <div class="bg-white p-2 rounded-lg border border-indigo-200">
              <label for="${contentId}-teamColor-select" class="block text-xs font-semibold text-gray-600 mb-1">
                🎨 Team Color
              </label>
              <select 
                id="${contentId}-teamColor-select" 
                onchange="updateBuffFromDropdown('${contentId}', 'teamColor')"
                class="w-full px-2 py-1 text-xs font-bold text-indigo-700 bg-white border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <option value="0">+0</option>
                <option value="1">+1</option>
                <option value="2">+2</option>
                <option value="3">+3</option>
                <option value="4">+4</option>
                <option value="5">+5</option>
                <option value="6">+6</option>
                <option value="7">+7</option>
                <option value="8">+8</option>
                <option value="9">+9</option>
              </select>
            </div>
          </div>
          
          <!-- Training Info (inline) -->
          <div class="mt-3 pt-3 border-t border-purple-200">
            <div class="flex items-center justify-between text-xs">
              <span class="text-purple-700">📋 Tối đa <strong>5 chỉ số</strong>, mỗi chỉ số <strong>+2</strong></span>
              <span class="font-bold text-purple-900" id="stats-counter">
                Đã đào tạo: <span class="text-red-600">0/5</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right: OVR Display (1 column) -->
      <div class="lg:col-span-1">
        <div class="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300 h-full flex flex-col justify-center text-center">
          <p class="text-xs font-semibold text-gray-600 mb-2">💎 Overall Rating</p>
          <div class="text-5xl font-bold text-amber-600 mb-2" id="${contentId}-ovr">0</div>
          <div class="text-xs text-gray-600 space-y-1">
            <div class="flex justify-center gap-4">
              <span>Base: <strong id="${contentId}-base-ovr">0</strong></span>
              <span class="text-green-600">Buff: <strong id="${contentId}-buff-ovr">0</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Position Group Info (compact) -->
    <div class="mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
      <span class="text-xs text-blue-800">
        <span class="font-semibold">Vị trí:</span> ${positionGroup}
      </span>
      <span class="text-xs text-blue-600 italic">Sắp xếp theo hệ số (cao → thấp)</span>
    </div>
    
    <!-- Stats Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="py-2 px-3 text-left text-xs font-semibold text-gray-600">Chỉ số</th>
            <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Giá trị</th>
            <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Đào tạo</th>
            <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Team Color</th>
            <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Hệ số</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100" id="${contentId}-table"></tbody>
      </table>
    </div>
  `;
  
  // Render stats table
  const tbody = document.getElementById(`${contentId}-table`);
  if (tbody) {
    renderStatsTableWithCoefficient(statsWithCoef, tbody, contentId);
    
    // Initial updates
    updateAllTrainingButtons(contentId);
    updateAllStatDisplays(contentId);
    calculateAndDisplayOVR(contentId);
  }
}

/**
 * Create tab button
 */
function createTabButton(tabId, label, isActive) {
  const button = document.createElement('button');
  button.dataset.tab = tabId;
  button.className = `stats-tab py-4 px-4 border-b-2 font-semibold transition-colors ${
    isActive 
      ? 'border-primary text-primary' 
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`;
  button.textContent = label;
  return button;
}

/**
 * Display all stats (default order)
 */
function displayAllStats(stats, tableId) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!stats) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-10 text-gray-400 italic">
          Không có dữ liệu chỉ số
        </td>
      </tr>
    `;
    return;
  }
  
  const statsOrder = [
    'speed', 'acceleration', 'finishing', 'shotPower', 
    'longShots', 'positioning', 'volleys', 'penalties',
    'shortPassing', 'vision', 'crossing', 'longPassing',
    'freeKickAccuracy', 'curve', 'dribbling', 'ballControl',
    'agility', 'balance', 'reactions', 'marking', 
    'standingTackle', 'interceptions', 'slidingTackle',
    'heading', 'strength', 'stamina', 'aggression',
    'jumping', 'composure', 'gkDiving', 'gkHandling',
    'gkKicking', 'gkReflexes', 'gkPositioning'
  ];
  
  const statsToDisplay = [];
  for (const key of statsOrder) {
    if (stats[key]) {
      statsToDisplay.push({ key, stat: stats[key] });
    }
  }
  
  renderStatsTable(statsToDisplay, tbody);
}

/**
 * Fetch and display position-specific stats
 */
async function fetchAndDisplayPositionStats(position, playerStats, contentId) {
  try {
    const response = await fetch(`/api/position-coefficients/${position}`);
    const result = await response.json();
    
    const content = document.getElementById(contentId);
    if (!content) return;
    
    if (!result.success) {
      content.innerHTML = `
        <p class="text-center text-red-500 py-8">
          Không tìm thấy hệ số cho vị trí ${position}
        </p>
      `;
      return;
    }
    
    const coefficients = result.data.coefficients;
    
    // Sort stats by coefficient (descending)
    const statsWithCoef = [];
    for (const [key, config] of Object.entries(coefficients)) {
      if (playerStats[key]) {
        statsWithCoef.push({
          key,
          stat: playerStats[key],
          coefficient: config.coefficient,
        });
      }
    }
    
    statsWithCoef.sort((a, b) => b.coefficient - a.coefficient);
    
    // Initialize training data for this position
    if (!trainingData[contentId]) {
      trainingData[contentId] = {
        coefficients,
        stats: {},
        statTeamColors: {},  // NEW: Team color per stat
        level: 0,
        teamColor: 0,
        upgradeLevel: 1, // Default level 1 (+0 OVR)
      };
      statsWithCoef.forEach(s => {
        trainingData[contentId].stats[s.key] = 0;
        trainingData[contentId].statTeamColors[s.key] = 0;  // Initialize to 0
      });
    }
    
    // Render table
    content.innerHTML = `
      <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-blue-800">
          <span class="font-semibold">Nhóm vị trí:</span> ${result.data.groupKey}
        </p>
        <p class="text-xs text-blue-600 mt-1">
          Các chỉ số được sắp xếp theo hệ số quan trọng (cao → thấp)
        </p>
      </div>
      
      <!-- Buffs Controls -->
      <div class="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-700">⚡ Buffs & Enhancements</p>
          <p class="text-xs text-purple-600 italic">Áp dụng cho tất cả chỉ số</p>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <!-- Upgrade Level -->
          <div class="bg-white p-3 rounded-lg border border-yellow-300">
            <label for="${contentId}-upgradeLevel-select" class="block text-xs font-semibold text-gray-600 mb-2">
              ⭐ Cấp thẻ
            </label>
            <div class="flex items-center gap-2">
              <div id="${contentId}-upgrade-icon" class="upgrade-icon upgrade-level-1" style="flex-shrink: 0;"></div>
              <select 
                id="${contentId}-upgradeLevel-select" 
                onchange="updateUpgradeLevel('${contentId}')"
                class="flex-1 px-2 py-2 text-sm font-bold text-yellow-700 bg-white border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer hover:border-yellow-400 transition-colors"
              >
                <option value="1">+1 (+0 OVR)</option>
                <option value="2">+2 (+1 OVR)</option>
                <option value="3">+3 (+2 OVR)</option>
                <option value="4">+4 (+4 OVR)</option>
                <option value="5">+5 (+6 OVR)</option>
                <option value="6">+6 (+9 OVR)</option>
                <option value="7">+7 (+12 OVR)</option>
                <option value="8">+8 (+15 OVR)</option>
                <option value="9">+9 (+18 OVR)</option>
                <option value="10">+10 (+21 OVR)</option>
                <option value="11">+11 (+23 OVR)</option>
                <option value="12">+12 (+25 OVR)</option>
                <option value="13">+13 (+27 OVR)</option>
              </select>
            </div>
          </div>
          
          <!-- Level -->
          <div class="bg-white p-3 rounded-lg border border-purple-200">
            <label for="${contentId}-level-select" class="block text-xs font-semibold text-gray-600 mb-2">
              🎚️ Level
            </label>
            <select 
              id="${contentId}-level-select" 
              onchange="updateBuffFromDropdown('${contentId}', 'level')"
              class="w-full px-3 py-2 text-lg font-bold text-purple-600 bg-white border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:border-purple-400 transition-colors"
            >
              <option value="0">1</option>
              <option value="1">2</option>
              <option value="2">3</option>
              <option value="3">4</option>
              <option value="4">5</option>
            </select>
          </div>
          
          <!-- Team Color -->
          <div class="bg-white p-3 rounded-lg border border-indigo-200">
            <label for="${contentId}-teamColor-select" class="block text-xs font-semibold text-gray-600 mb-2">
              🎨 Team Color
            </label>
            <select 
              id="${contentId}-teamColor-select" 
              onchange="updateBuffFromDropdown('${contentId}', 'teamColor')"
              class="w-full px-3 py-2 text-lg font-bold text-indigo-600 bg-white border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:border-indigo-400 transition-colors"
            >
              <option value="0">+0</option>
              <option value="1">+1</option>
              <option value="2">+2</option>
              <option value="3">+3</option>
              <option value="4">+4</option>
              <option value="5">+5</option>
              <option value="6">+6</option>
              <option value="7">+7</option>
              <option value="8">+8</option>
              <option value="9">+9</option>
            </select>
          </div>
        </div>
      </div>
      
      <style>
        .upgrade-icon {
          width: 30px;
          height: 18px;
          background-image: url('/images/enchant.png');
          background-repeat: no-repeat;
          background-size: 100%;
        }
        .upgrade-level-1 { background-position: 0 7.692308%; }
        .upgrade-level-2 { background-position: 0 46.153846%; }
        .upgrade-level-3 { background-position: 0 53.846154%; }
        .upgrade-level-4 { background-position: 0 61.538462%; }
        .upgrade-level-5 { background-position: 0 69.230769%; }
        .upgrade-level-6 { background-position: 0 76.923077%; }
        .upgrade-level-7 { background-position: 0 84.615385%; }
        .upgrade-level-8 { background-position: 0 92.307692%; }
        .upgrade-level-9 { background-position: 0 100%; }
        .upgrade-level-10 { background-position: 0 15.384615%; }
        .upgrade-level-11 { background-position: 0 23.076923%; }
        .upgrade-level-12 { background-position: 0 30.769231%; }
        .upgrade-level-13 { background-position: 0 38.461538%; }
      </style>
      
      <!-- OVR Display -->
      <div class="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-700">💎 Overall Rating (OVR)</p>
            <p class="text-xs text-gray-500 mt-1">Base + Stats Buffs + Upgrade Level</p>
          </div>
          <div class="text-right">
            <div class="text-4xl font-bold text-amber-600" id="${contentId}-ovr">0</div>
            <div class="text-xs text-gray-500 mt-1">
              <span>Base: <span id="${contentId}-base-ovr" class="font-semibold text-gray-700">0</span></span>
              <span class="text-green-600 ml-2">+<span id="${contentId}-buff-ovr" class="font-semibold">0</span></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Training Info -->
      <div class="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-700">📚 Quy tắc đào tạo</p>
            <p class="text-xs text-gray-600 mt-1">Tối đa <strong>5 chỉ số</strong>, mỗi chỉ số tối đa <strong>+2</strong></p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-600">Đã đào tạo:</p>
            <p class="text-2xl font-bold text-blue-600" id="${contentId}-stats-counter">0/5</p>
          </div>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-2 px-3 text-left text-xs font-semibold text-gray-600">Chỉ số</th>
              <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Giá trị</th>
              <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Đào tạo</th>
              <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Team Color</th>
              <th class="py-2 px-3 text-center text-xs font-semibold text-gray-600">Hệ số</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100" id="${contentId}-table"></tbody>
        </table>
      </div>
    `;
    
    const tbody = document.getElementById(`${contentId}-table`);
    renderStatsTableWithCoefficient(statsWithCoef, tbody, contentId);
    
    // Initialize button states and counter
    updateAllTrainingButtons(contentId);
    
  } catch (error) {
    console.error('Failed to fetch position coefficients:', error);
    const content = document.getElementById(contentId);
    if (content) {
      content.innerHTML = `
        <p class="text-center text-red-500 py-8">
          Lỗi khi tải dữ liệu: ${error.message}
        </p>
      `;
    }
  }
}

/**
 * Render stats table (4 columns = 2 stats per row)
 */
function renderStatsTable(statsArray, tbody) {
  for (let i = 0; i < statsArray.length; i += 4) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    for (let j = 0; j < 4; j++) {
      const statData = statsArray[i + j];
      if (statData) {
        const { stat } = statData;
        // Display value with game buffs
        const value = stat.value || 0;
        const displayName = stat.name || formatStatKey(statData.key);
        
        const nameCell = document.createElement('td');
        nameCell.className = 'py-3 px-4 text-sm font-medium text-gray-700';
        nameCell.textContent = displayName;
        
        const valueCell = document.createElement('td');
        valueCell.className = 'py-3 px-4 text-sm';
        const colorClass = getStatColorClass(value);
        
        valueCell.innerHTML = `<span class="${colorClass}">${value}</span>`;
        
        row.appendChild(nameCell);
        row.appendChild(valueCell);
      } else {
        const emptyNameCell = document.createElement('td');
        emptyNameCell.className = 'py-3 px-4';
        const emptyValueCell = document.createElement('td');
        emptyValueCell.className = 'py-3 px-4';
        row.appendChild(emptyNameCell);
        row.appendChild(emptyValueCell);
      }
    }
    
    tbody.appendChild(row);
  }
}

/**
 * Render stats table with coefficient and training controls (1 stat per row)
 */
function renderStatsTableWithCoefficient(statsArray, tbody, contentId) {
  statsArray.forEach(statData => {
    const { key, stat, coefficient } = statData;
    // Display value (with game buffs) but use value for OVR calculation
    const value = parseInt(stat.value) || 0;
    const displayName = stat.name || formatStatKey(key);
    const trainingValue = trainingData[contentId].stats[key] || 0;
    
    console.log(`Rendering stat: ${key}, value: ${value}, training: ${trainingValue}`);
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    // Stat name
    const nameCell = document.createElement('td');
    nameCell.className = 'py-2 px-3 text-sm font-medium text-gray-700';
    nameCell.textContent = displayName;
    
    // Current value
    const valueCell = document.createElement('td');
    valueCell.className = 'py-2 px-3 text-center';
    const colorClass = getStatColorClass(value);
    valueCell.innerHTML = `<span class="${colorClass}" id="${contentId}-${key}-value">${value}</span>`;
    
    // Training controls
    const trainingCell = document.createElement('td');
    trainingCell.className = 'py-2 px-2 text-center';
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'flex items-center justify-center gap-1';
    
    // Minus button
    const minusBtn = document.createElement('button');
    minusBtn.id = `${contentId}-${key}-minus`;
    minusBtn.className = 'px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed';
    minusBtn.textContent = '−';
    minusBtn.disabled = trainingValue <= 0;
    minusBtn.onclick = () => window.updateTraining(contentId, key, -1);
    
    // Training value display
    const trainingSpan = document.createElement('span');
    trainingSpan.id = `${contentId}-${key}-training`;
    trainingSpan.className = 'mx-2 font-semibold text-sm min-w-[20px] inline-block';
    trainingSpan.textContent = trainingValue;
    
    // Plus button - Giới hạn training tối đa +2, và tối đa 5 chỉ số
    const plusBtn = document.createElement('button');
    plusBtn.id = `${contentId}-${key}-plus`;
    plusBtn.className = 'px-2 py-1 text-sm rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed';
    plusBtn.textContent = '+';
    
    // Check limits
    const trainedCount = countTrainedStats(contentId);
    const isAtMax = trainingValue >= MAX_TRAINING_VALUE;
    const isLimitReached = trainedCount >= MAX_TRAINED_STATS && trainingValue === 0;
    plusBtn.disabled = isAtMax || isLimitReached;
    plusBtn.onclick = () => window.updateTraining(contentId, key, 1);
    
    console.log(`Button state for ${key}: value=${value}, training=${trainingValue}, trainedCount=${trainedCount}, disabled=${plusBtn.disabled}`);
    
    controlsDiv.appendChild(minusBtn);
    controlsDiv.appendChild(trainingSpan);
    controlsDiv.appendChild(plusBtn);
    trainingCell.appendChild(controlsDiv);
    
    // Team Color controls (per stat)
    const teamColorCell = document.createElement('td');
    teamColorCell.className = 'py-2 px-2 text-center';
    
    const teamColorDiv = document.createElement('div');
    teamColorDiv.className = 'flex items-center justify-center gap-1';
    
    const statTeamColorValue = trainingData[contentId].statTeamColors[key] || 0;
    
    // Minus button
    const tcMinusBtn = document.createElement('button');
    tcMinusBtn.id = `${contentId}-${key}-tc-minus`;
    tcMinusBtn.className = 'px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed';
    tcMinusBtn.textContent = '−';
    tcMinusBtn.disabled = statTeamColorValue <= 0;
    tcMinusBtn.onclick = () => window.updateStatTeamColor(contentId, key, -1);
    
    // Team Color value display
    const tcSpan = document.createElement('span');
    tcSpan.id = `${contentId}-${key}-tc-value`;
    tcSpan.className = 'mx-2 font-semibold text-sm min-w-[20px] inline-block text-indigo-600';
    tcSpan.textContent = statTeamColorValue;
    
    // Plus button - Max +9
    const tcPlusBtn = document.createElement('button');
    tcPlusBtn.id = `${contentId}-${key}-tc-plus`;
    tcPlusBtn.className = 'px-2 py-1 text-sm rounded bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed';
    tcPlusBtn.textContent = '+';
    tcPlusBtn.disabled = statTeamColorValue >= 9;
    tcPlusBtn.onclick = () => window.updateStatTeamColor(contentId, key, 1);
    
    teamColorDiv.appendChild(tcMinusBtn);
    teamColorDiv.appendChild(tcSpan);
    teamColorDiv.appendChild(tcPlusBtn);
    teamColorCell.appendChild(teamColorDiv);
    
    // Coefficient
    const coefCell = document.createElement('td');
    coefCell.className = 'py-2 px-3 text-xs text-gray-500 text-center font-semibold';
    coefCell.textContent = `×${coefficient}`;
    
    row.appendChild(nameCell);
    row.appendChild(valueCell);
    row.appendChild(trainingCell);
    row.appendChild(teamColorCell);
    row.appendChild(coefCell);
    
    tbody.appendChild(row);
  });
  
  // Update initial stat displays (in case there are default buffs)
  updateAllStatDisplays(contentId);
  
  // Calculate and display initial OVR
  calculateAndDisplayOVR(contentId);
}

/**
 * Count number of trained stats (value > 0)
 */
function countTrainedStats(contentId) {
  if (!trainingData[contentId]) return 0;
  
  const stats = trainingData[contentId].stats;
  return Object.values(stats).filter(val => val > 0).length;
}

/**
 * Update all stat displays with current buffs
 * Note: Upgrade Level does NOT affect individual stats, only total OVR
 */
function updateAllStatDisplays(contentId) {
  if (!trainingData[contentId] || !currentPlayer) return;
  
  const { stats: trainingStats, statTeamColors, level, teamColor } = trainingData[contentId];
  const levelBuff = level || 0;
  const teamColorBuff = teamColor || 0;
  const globalBuff = levelBuff + teamColorBuff;
  
  // Update each stat display
  for (const key of Object.keys(trainingStats)) {
    const baseValue = parseInt(currentPlayer.stats[key]?.value) || 0;
    const trainingValue = trainingStats[key] || 0;
    const statTeamColor = (statTeamColors && statTeamColors[key]) || 0;
    const totalBuff = trainingValue + globalBuff + statTeamColor;
    const totalValue = baseValue + totalBuff;
    
    const valueElement = document.getElementById(`${contentId}-${key}-value`);
    if (valueElement) {
      const colorClass = getStatColorClass(totalValue);
      valueElement.className = colorClass;
      
      // Display with breakdown: "141 (+13)" or just "141" if no buffs
      if (totalBuff > 0) {
        valueElement.innerHTML = `${totalValue} <span class="text-xs text-gray-500">(+${totalBuff})</span>`;
      } else {
        valueElement.textContent = totalValue;
      }
    }
  }
}

/**
 * Update all training buttons based on limits
 */
function updateAllTrainingButtons(contentId) {
  if (!trainingData[contentId]) return;
  
  const trainedCount = countTrainedStats(contentId);
  const stats = trainingData[contentId].stats;
  
  // Update all buttons
  for (const key of Object.keys(stats)) {
    const trainingValue = stats[key] || 0;
    const minusBtn = document.getElementById(`${contentId}-${key}-minus`);
    const plusBtn = document.getElementById(`${contentId}-${key}-plus`);
    
    if (minusBtn) {
      minusBtn.disabled = trainingValue <= 0;
    }
    
    if (plusBtn) {
      // Disable if:
      // 1. Already at max training value (+2), OR
      // 2. Already trained 5 stats AND this stat is not trained yet
      const isAtMax = trainingValue >= MAX_TRAINING_VALUE;
      const isLimitReached = trainedCount >= MAX_TRAINED_STATS && trainingValue === 0;
      plusBtn.disabled = isAtMax || isLimitReached;
    }
  }
  
  // Update stats counter display
  const counterDisplay = document.getElementById(`${contentId}-stats-counter`);
  if (counterDisplay) {
    counterDisplay.textContent = `${trainedCount}/${MAX_TRAINED_STATS}`;
    // Change color if limit reached
    if (trainedCount >= MAX_TRAINED_STATS) {
      counterDisplay.className = 'font-bold text-red-600';
    } else {
      counterDisplay.className = 'font-bold text-blue-600';
    }
  }
}

/**
 * Update upgrade level and icon
 */
window.updateUpgradeLevel = function(contentId) {
  if (!trainingData[contentId]) {
    console.error('Training data not found for:', contentId);
    return;
  }
  
  const select = document.getElementById(`${contentId}-upgradeLevel-select`);
  if (!select) {
    console.error('Select element not found for upgrade level');
    return;
  }
  
  const level = parseInt(select.value) || 1;
  const oldLevel = trainingData[contentId].upgradeLevel || 1;
  const ovrBonus = UPGRADE_OVR_BONUS[level];
  
  console.log('====================================');
  console.log(`🔧 Upgrade Level Changed: ${oldLevel} → ${level}`);
  console.log(`   OVR Bonus: +${ovrBonus}`);
  console.log('====================================');
  
  trainingData[contentId].upgradeLevel = level;
  
  // Update icon
  const icon = document.getElementById(`${contentId}-upgrade-icon`);
  if (icon) {
    icon.className = `upgrade-icon upgrade-level-${level}`;
  }
  
  // Update stat displays (upgrade level doesn't affect individual stats, only OVR)
  // But we still call it for consistency
  updateAllStatDisplays(contentId);
  
  // Recalculate OVR
  calculateAndDisplayOVR(contentId);
};

/**
 * Update buff value from dropdown
 */
window.updateBuffFromDropdown = function(contentId, buffType) {
  if (!trainingData[contentId]) {
    console.error('Training data not found for:', contentId);
    return;
  }
  
  const select = document.getElementById(`${contentId}-${buffType}-select`);
  if (!select) {
    console.error('Select element not found:', `${contentId}-${buffType}-select`);
    return;
  }
  
  const newValue = parseInt(select.value) || 0;
  const oldValue = trainingData[contentId][buffType] || 0;
  
  console.log(`${buffType}: ${oldValue} → ${newValue}`);
  
  trainingData[contentId][buffType] = newValue;
  
  // Update all stat displays with new buffs
  updateAllStatDisplays(contentId);
  
  // Recalculate OVR
  calculateAndDisplayOVR(contentId);
};

/**
 * Update training value for a stat
 */
window.updateTraining = function(contentId, statKey, delta) {
  console.log('updateTraining called:', { contentId, statKey, delta });
  
  if (!trainingData[contentId]) {
    console.error('Training data not found for:', contentId);
    return;
  }
  
  if (!currentPlayer || !currentPlayer.stats) {
    console.error('Current player data not available');
    return;
  }
  
  const currentTraining = trainingData[contentId].stats[statKey] || 0;
  const value = parseInt(currentPlayer.stats[statKey]?.value) || 0;
  const trainedCount = countTrainedStats(contentId);
  
  console.log('Current state:', { currentTraining, value, trainedCount });
  
  // Calculate new training value
  let newTraining = currentTraining + delta;
  
  // Check limits
  if (delta > 0) {
    // Adding training
    // Check if we can add a new stat to training
    if (currentTraining === 0 && trainedCount >= MAX_TRAINED_STATS) {
      console.log('Cannot train more stats - limit reached:', trainedCount, '/', MAX_TRAINED_STATS);
      return; // Cannot add new stat
    }
    // Check max training value per stat
    if (newTraining > MAX_TRAINING_VALUE) {
      newTraining = MAX_TRAINING_VALUE;
    }
  }
  
  // Giới hạn training: 0 đến +2
  newTraining = Math.max(0, newTraining);
  newTraining = Math.min(MAX_TRAINING_VALUE, newTraining);
  
  console.log('New training value:', newTraining);
  
  trainingData[contentId].stats[statKey] = newTraining;
  
  // Update this stat's display
  const trainingSpan = document.getElementById(`${contentId}-${statKey}-training`);
  if (trainingSpan) trainingSpan.textContent = newTraining;
  
  // Update ALL buttons based on new limits
  updateAllTrainingButtons(contentId);
  
  // Update all stat displays with new training values
  updateAllStatDisplays(contentId);
  
  console.log('UI updated, recalculating OVR...');
  
  // Recalculate OVR
  calculateAndDisplayOVR(contentId);
};

/**
 * Update stat-specific team color value
 */
window.updateStatTeamColor = function(contentId, statKey, delta) {
  console.log('updateStatTeamColor called:', { contentId, statKey, delta });
  
  if (!trainingData[contentId]) {
    console.error('Training data not found for:', contentId);
    return;
  }
  
  const currentValue = trainingData[contentId].statTeamColors[statKey] || 0;
  let newValue = currentValue + delta;
  
  // Giới hạn: 0 đến +9
  newValue = Math.max(0, Math.min(9, newValue));
  
  console.log(`Stat Team Color for ${statKey}: ${currentValue} → ${newValue}`);
  
  trainingData[contentId].statTeamColors[statKey] = newValue;
  
  // Update display
  const tcSpan = document.getElementById(`${contentId}-${statKey}-tc-value`);
  if (tcSpan) tcSpan.textContent = newValue;
  
  // Update buttons
  const minusBtn = document.getElementById(`${contentId}-${statKey}-tc-minus`);
  const plusBtn = document.getElementById(`${contentId}-${statKey}-tc-plus`);
  if (minusBtn) minusBtn.disabled = newValue <= 0;
  if (plusBtn) plusBtn.disabled = newValue >= 9;
  
  // Update all stat displays
  updateAllStatDisplays(contentId);
  
  // Recalculate OVR
  calculateAndDisplayOVR(contentId);
};

/**
 * Calculate and display OVR
 * Formula: OVR = [Σ((base_value + training + level + team_color + stat_team_color) × coefficient) / Σ(coefficients)] + upgrade_ovr_bonus
 */
function calculateAndDisplayOVR(contentId) {
  if (!trainingData[contentId]) return;
  
  const { coefficients, stats: trainingStats, statTeamColors, level, teamColor, upgradeLevel } = trainingData[contentId];
  
  // Get buff values
  const levelBuff = level || 0;
  const teamColorBuff = teamColor || 0;
  const upgradeLvl = upgradeLevel || 1;
  const upgradeOVRBonus = UPGRADE_OVR_BONUS[upgradeLvl] || 0;
  
  let totalWeighted = 0;
  let totalCoefficient = 0;
  let baseWeighted = 0;
  
  for (const [key, config] of Object.entries(coefficients)) {
    // Use value (current stat with game buffs) for OVR calculation
    const value = parseInt(currentPlayer.stats[key]?.value) || 0;
    const trainingValue = trainingStats[key] || 0;
    const statTeamColor = (statTeamColors && statTeamColors[key]) || 0;
    const coefficient = config.coefficient;
    
    // Base OVR (with game buffs)
    baseWeighted += value * coefficient;
    
    // Total OVR = (base + training + level + team_color + stat_team_color) × coefficient
    const totalValue = value + trainingValue + levelBuff + teamColorBuff + statTeamColor;
    totalWeighted += totalValue * coefficient;
    
    totalCoefficient += coefficient;
  }
  
  // Calculate exact values (with decimals)
  const baseOVRExact = totalCoefficient > 0 ? baseWeighted / totalCoefficient : 0;
  const calculatedOVRExact = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;
  
  // Floor values for display
  const baseOVR = Math.floor(baseOVRExact);
  const calculatedOVR = Math.floor(calculatedOVRExact);
  const statBuffOVR = calculatedOVR - baseOVR;
  
  // Final OVR = Calculated OVR + Upgrade Bonus
  const finalOVRExact = calculatedOVRExact + upgradeOVRBonus;
  const finalOVR = Math.floor(finalOVRExact);
  const totalImprovement = finalOVR - baseOVR;
  
  // Update display
  const ovrDisplay = document.getElementById(`${contentId}-ovr`);
  const baseOvrDisplay = document.getElementById(`${contentId}-base-ovr`);
  const buffOvrDisplay = document.getElementById(`${contentId}-buff-ovr`);
  
  if (ovrDisplay) {
    // Display: 124 (124.99)
    const exactValue = finalOVRExact.toFixed(2);
    ovrDisplay.innerHTML = `${finalOVR}<span class="text-xl text-gray-500 ml-2">(${exactValue})</span>`;
    // Change color if improved
    if (finalOVR > baseOVR) {
      ovrDisplay.className = 'text-4xl font-bold text-green-600';
    } else {
      ovrDisplay.className = 'text-4xl font-bold text-amber-600';
    }
  }
  
  if (baseOvrDisplay) {
    const baseExactValue = baseOVRExact.toFixed(2);
    baseOvrDisplay.innerHTML = `${baseOVR}<span class="text-xs text-gray-400 ml-1">(${baseExactValue})</span>`;
  }
  
  if (buffOvrDisplay) {
    buffOvrDisplay.textContent = totalImprovement;
  }
  
  // Count stat team colors
  const statTeamColorCount = statTeamColors ? Object.values(statTeamColors).filter(v => v > 0).length : 0;
  
  console.log('💎 OVR Calculation Result:', {
    '1. Base OVR': `${baseOVR} (${baseOVRExact.toFixed(2)})`,
    '2. Global Buffs': { level: `+${levelBuff}`, teamColor: `+${teamColorBuff}` },
    '3. Stat Team Colors': `${statTeamColorCount} stats buffed`,
    '4. Calculated OVR': `${calculatedOVR} (${calculatedOVRExact.toFixed(2)})`,
    '5. Upgrade Level': `+${upgradeLvl}`,
    '6. Upgrade Bonus': `+${upgradeOVRBonus} OVR`,
    '7. Final OVR': `${finalOVR} (${finalOVRExact.toFixed(2)})`,
    '8. Total Improvement': `+${totalImprovement}`,
  });
}

/**
 * Setup tab switching
 * Uses event delegation to avoid duplicate listeners
 */
let tabsSetup = false;

function setupTabs() {
  // Only setup once to avoid duplicate listeners
  if (tabsSetup) return;
  
  const tabsContainer = document.getElementById('statsTabs');
  if (!tabsContainer) return;
  
  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.stats-tab');
    if (!tab) return;
    
    const tabName = tab.dataset.tab;
    const tabs = document.querySelectorAll('.stats-tab');
    const tabContents = document.querySelectorAll('.stats-tab-content');
    
    // Remove active class from all tabs
    tabs.forEach(t => {
      t.classList.remove('border-primary', 'text-primary');
      t.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Add active class to clicked tab
    tab.classList.remove('border-transparent', 'text-gray-500');
    tab.classList.add('border-primary', 'text-primary');
    
    // Hide all tab contents
    tabContents.forEach(content => {
      content.classList.add('hidden');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}Tab`);
    if (selectedContent) {
      selectedContent.classList.remove('hidden');
    }
  });
  
  tabsSetup = true;
}

/**
 * Display hidden stats (traits)
 */
function displayHiddenStats(player) {
  hiddenStatsDiv.innerHTML = '';
  
  if (!player.hiddenStats || !Array.isArray(player.hiddenStats) || player.hiddenStats.length === 0) {
    hiddenStatsSection.classList.add('hidden');
    return;
  }
  
  hiddenStatsSection.classList.remove('hidden');
  
  player.hiddenStats.forEach(trait => {
    const traitCard = document.createElement('div');
    traitCard.className = 'flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-all';
    
    traitCard.innerHTML = `
      <img 
        src="${trait.iconUrl || ''}" 
        alt="${trait.name}" 
        class="w-12 h-12 flex-shrink-0"
        onerror="this.style.display='none'"
      >
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-gray-800 mb-1">${trait.name || 'Unknown'}</h4>
        <p class="text-sm text-gray-600">${trait.description || ''}</p>
      </div>
    `;
    
    hiddenStatsDiv.appendChild(traitCard);
  });
}

/**
 * Format stat key to readable name
 */
function formatStatKey(key) {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Display club career
 */
function displayClubCareer(player) {
  clubCareerDiv.innerHTML = '';
  
  if (!player.clubCareer || !Array.isArray(player.clubCareer) || player.clubCareer.length === 0) {
    clubCareerSection.classList.add('hidden');
    return;
  }
  
  clubCareerSection.classList.remove('hidden');
  
  // Create timeline container
  const timeline = document.createElement('div');
  timeline.className = 'space-y-2';
  
  player.clubCareer.forEach((career, index) => {
    const clubItem = document.createElement('div');
    clubItem.className = 'flex items-center gap-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors';
    
    clubItem.innerHTML = `
      <div class="flex-shrink-0 w-28 text-xs font-semibold text-gray-500 text-right">
        ${career.period || 'N/A'}
      </div>
      <div class="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform"></div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-gray-800 truncate">
          ${career.club || 'Unknown Club'}
        </div>
      </div>
    `;
    
    timeline.appendChild(clubItem);
  });
  
  clubCareerDiv.appendChild(timeline);
}

/**
 * Show error message
 */
function showError(message) {
  errorDiv.classList.remove('hidden');
  errorDiv.innerHTML = `
    <h2 class="text-3xl font-bold text-red-600 mb-4">❌ Lỗi</h2>
    <p class="text-gray-700 text-lg mb-6">${message}</p>
    <a 
      href="/" 
      class="inline-block px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all no-underline"
    >
      ← Quay lại tìm kiếm
    </a>
  `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
