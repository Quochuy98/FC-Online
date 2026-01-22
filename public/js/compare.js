/**
 * Compare Players Page Logic
 */

// Available position groups
const POSITION_GROUPS = [
  'RW/LW',
  'LS/ST/RS',
  'LAM/CAM/RAM',
  'LCM/CM/RCM',
  'LDM/CDM/RDM',
  'LWB/RWB',
  'SW',
  'CB',
  'LB/RB',
  'GK'
];

// Upgrade OVR Bonus Map
const UPGRADE_OVR_BONUS = {
  1: 0, 2: 1, 3: 2, 4: 4, 5: 6, 6: 9, 7: 12, 
  8: 15, 9: 18, 10: 21, 11: 23, 12: 25, 13: 27
};

// State
let players = [];
let selectedPosition = null;
let positionCoefficients = null;
let playerBuffs = {}; // Store buffs for each player

// DOM Elements
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const compareContent = document.getElementById('compareContent');
const playersGrid = document.getElementById('playersGrid');
const positionSelector = document.getElementById('positionSelector');

/**
 * Initialize page
 */
async function init() {
  try {
    // Show loading
    loadingDiv.classList.remove('hidden');
    compareContent.classList.add('hidden');
    
    // Load players from localStorage
    const savedPlayers = JSON.parse(localStorage.getItem('comparePlayers') || '[]');
    
    if (savedPlayers.length < 2) {
      showError('Vui lòng chọn ít nhất 2 cầu thủ để so sánh!');
      return;
    }
    
    players = savedPlayers;
    
    // Load position coefficients
    const response = await fetch('/api/position-coefficients/all');
    const result = await response.json();
    positionCoefficients = result.data;
    
    // Populate position selector
    populatePositionSelector();
    
    // Select default position (first position of first player)
    if (players[0] && players[0].position) {
      const defaultPos = findPositionGroup(players[0].position);
      positionSelector.value = defaultPos || POSITION_GROUPS[0];
      selectedPosition = positionSelector.value;
    } else {
      selectedPosition = POSITION_GROUPS[0];
    }
    
    // Initialize buffs for each player
    players.forEach(player => {
      playerBuffs[player.playerId] = {
        level: 0,
        teamColor: 0,
        upgradeLevel: 1
      };
    });
    
    // Render players
    renderPlayers();
    
    // Hide loading, show content
    loadingDiv.classList.add('hidden');
    compareContent.classList.remove('hidden');
    
  } catch (error) {
    console.error('Init error:', error);
    showError('Lỗi khi tải dữ liệu. Vui lòng thử lại!');
  }
}

/**
 * Populate position selector
 */
function populatePositionSelector() {
  positionSelector.innerHTML = POSITION_GROUPS.map(group => 
    `<option value="${group}">${group}</option>`
  ).join('');
}

/**
 * Find position group for a single position
 */
function findPositionGroup(position) {
  // Direct match
  if (POSITION_GROUPS.includes(position)) {
    return position;
  }
  
  // Search in grouped positions
  for (const group of POSITION_GROUPS) {
    if (group.includes('/') && group.split('/').includes(position)) {
      return group;
    }
  }
  
  return null;
}

/**
 * Handle position change
 */
window.onPositionChange = function() {
  selectedPosition = positionSelector.value;
  renderPlayers();
};

/**
 * Render all players
 */
function renderPlayers() {
  playersGrid.innerHTML = '';
  
  // Adjust grid layout based on number of players
  const playerCount = players.length;
  
  if (playerCount === 2) {
    // 2 players: centered, wider cards
    playersGrid.className = 'max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6';
  } else if (playerCount === 3) {
    // 3 players: centered
    playersGrid.className = 'max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';
  } else {
    // 4 players: full width
    playersGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
  }
  
  players.forEach(player => {
    const playerCard = createPlayerCard(player, playerCount);
    playersGrid.appendChild(playerCard);
  });
}

/**
 * Create player comparison card
 */
function createPlayerCard(player, playerCount = 4) {
  const card = document.createElement('div');
  
  // Adjust padding and styling based on player count
  const isWideLayout = playerCount === 2;
  const cardPadding = isWideLayout ? 'p-4' : 'p-3';
  const textSizes = {
    name: isWideLayout ? 'text-xl' : 'text-lg',
    ovr: isWideLayout ? 'text-4xl' : 'text-3xl',
    stat: isWideLayout ? 'text-sm' : 'text-xs'
  };
  
  card.className = `bg-white rounded-xl shadow-lg ${cardPadding} border-2 border-gray-200`;
  card.id = `player-${player.playerId}`;
  
  const overall = player.overallDisplay || 0;
  const salary = player.overallRating || 0;
  
  // Get coefficients for selected position
  const coefficients = positionCoefficients[selectedPosition] || {};
  
  // Build stats array sorted by coefficient
  const statsArray = [];
  for (const [key, config] of Object.entries(coefficients)) {
    if (player.stats[key]) {
      statsArray.push({
        key,
        name: config.name,
        coefficient: config.coefficient,
        baseValue: parseInt(player.stats[key].value) || 0
      });
    }
  }
  statsArray.sort((a, b) => b.coefficient - a.coefficient);
  
  // Get current buffs
  const buffs = playerBuffs[player.playerId];
  
  // Calculate OVR
  const ovrData = calculateOVR(statsArray, coefficients, buffs);
  
  const avatarSize = isWideLayout ? 'w-24 h-24' : 'w-20 h-20';
  const badgeSize = isWideLayout ? 'text-sm' : 'text-xs';
  
  card.innerHTML = `
    <!-- Player Header (Horizontal Compact) -->
    <div class="flex items-center gap-3 mb-3 pb-3 border-b-2 border-gray-100">
      <!-- Avatar -->
      <img 
        src="${player.avatarUrl || '/images/default-player.png'}" 
        alt="${player.name}" 
        class="w-16 h-16 rounded-full object-cover border-2 border-primary flex-shrink-0"
        onerror="this.src='/images/default-player.png'"
      >
      
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-base text-gray-800 truncate mb-1">${player.name}</h3>
        <div class="flex items-center gap-2 mb-1">
          <span class="season-badge bg-${player.season}" title="${player.season}"></span>
          <span class="px-2 py-0.5 bg-primary text-white rounded text-xs font-semibold">${player.position}</span>
        </div>
        <div class="text-xs text-gray-600">
          <span>Base: ${ovrData.baseOVR}</span>
        </div>
      </div>
      
      <!-- OVR Display -->
      <div class="flex-shrink-0 text-center px-3 py-2 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300">
        <p class="text-xs font-semibold text-gray-600">💎 OVR</p>
        <div class="text-3xl font-bold text-amber-600" id="ovr-${player.playerId}">
          ${ovrData.finalOVR}
        </div>
        <div class="text-xs text-gray-600">
          <span class="text-green-600 font-semibold">+${ovrData.totalBuff}</span>
        </div>
      </div>
    </div>
    
    <!-- Buffs Controls (Compact) -->
    <div class="mb-2 grid grid-cols-3 gap-2">
      <!-- Upgrade Level -->
      <select 
        onchange="updateBuff('${player.playerId}', 'upgradeLevel', this.value)"
        class="px-2 py-1 text-xs font-bold text-yellow-700 bg-white border-2 border-yellow-300 rounded focus:outline-none"
      >
        ${[1,2,3,4,5,6,7,8,9,10,11,12,13].map(lvl => 
          `<option value="${lvl}" ${buffs.upgradeLevel === lvl ? 'selected' : ''}>⭐+${lvl}</option>`
        ).join('')}
      </select>
      
      <!-- Level -->
      <select 
        onchange="updateBuff('${player.playerId}', 'level', this.value)"
        class="px-2 py-1 text-xs font-bold text-purple-700 bg-white border-2 border-purple-200 rounded focus:outline-none"
      >
        ${[0,1,2,3,4].map(lvl => 
          `<option value="${lvl}" ${buffs.level === lvl ? 'selected' : ''}>🎚️+${lvl}</option>`
        ).join('')}
      </select>
      
      <!-- Team Color -->
      <select 
        onchange="updateBuff('${player.playerId}', 'teamColor', this.value)"
        class="px-2 py-1 text-xs font-bold text-indigo-700 bg-white border-2 border-indigo-200 rounded focus:outline-none"
      >
        ${[0,1,2,3,4,5,6,7,8,9].map(tc => 
          `<option value="${tc}" ${buffs.teamColor === tc ? 'selected' : ''}>🎨+${tc}</option>`
        ).join('')}
      </select>
    </div>
    
    <!-- Stats Table -->
    <div class="overflow-y-auto" style="max-height: calc(100vh - 450px); min-height: 400px;">
      <table class="w-full ${textSizes.stat}">
        <thead class="bg-gray-50 sticky top-0">
          <tr>
            <th class="py-2 px-2 text-left ${textSizes.stat} font-semibold text-gray-600">Chỉ số</th>
            <th class="py-2 px-2 text-center ${textSizes.stat} font-semibold text-gray-600">Giá trị</th>
            <th class="py-2 px-2 text-center ${textSizes.stat} font-semibold text-gray-600">×</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100" id="stats-${player.playerId}">
          ${renderStatsRows(statsArray, buffs)}
        </tbody>
      </table>
    </div>
  `;
  
  return card;
}

/**
 * Render stats rows
 */
function renderStatsRows(statsArray, buffs) {
  const levelBuff = buffs.level || 0;
  const teamColorBuff = buffs.teamColor || 0;
  const globalBuff = levelBuff + teamColorBuff;
  
  return statsArray.map(stat => {
    const totalValue = stat.baseValue + globalBuff;
    const colorClass = getStatColorClass(totalValue);
    
    return `
      <tr>
        <td class="py-2 px-2 text-gray-700">${stat.name}</td>
        <td class="py-2 px-2 text-center">
          <span class="${colorClass}">${totalValue}</span>
          ${globalBuff > 0 ? `<span class="text-xs text-gray-500">(+${globalBuff})</span>` : ''}
        </td>
        <td class="py-2 px-2 text-center text-gray-500 font-semibold">×${stat.coefficient}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Get stat color class based on value
 */
function getStatColorClass(value) {
  if (value < 120) return 'text-gray-800';
  if (value < 130) return 'text-purple-600 font-semibold';
  if (value < 140) return 'text-orange-600 font-bold';
  if (value < 160) return 'text-yellow-600 font-bold';
  return 'text-blue-600 font-bold';
}

/**
 * Calculate OVR
 */
function calculateOVR(statsArray, coefficients, buffs) {
  const levelBuff = buffs.level || 0;
  const teamColorBuff = buffs.teamColor || 0;
  const upgradeLvl = buffs.upgradeLevel || 1;
  const upgradeOVRBonus = UPGRADE_OVR_BONUS[upgradeLvl] || 0;
  
  let totalWeighted = 0;
  let totalCoefficient = 0;
  let baseWeighted = 0;
  
  for (const stat of statsArray) {
    const coefficient = stat.coefficient;
    const baseValue = stat.baseValue;
    
    // Base OVR
    baseWeighted += baseValue * coefficient;
    
    // With buffs
    const totalValue = baseValue + levelBuff + teamColorBuff;
    totalWeighted += totalValue * coefficient;
    
    totalCoefficient += coefficient;
  }
  
  const baseOVRExact = totalCoefficient > 0 ? baseWeighted / totalCoefficient : 0;
  const calculatedOVRExact = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;
  
  const baseOVR = Math.floor(baseOVRExact);
  const calculatedOVR = Math.floor(calculatedOVRExact);
  
  // Final OVR with upgrade bonus
  const finalOVRExact = calculatedOVRExact + upgradeOVRBonus;
  const finalOVR = Math.floor(finalOVRExact);
  
  return {
    baseOVR,
    calculatedOVR,
    finalOVR,
    totalBuff: finalOVR - baseOVR
  };
}

/**
 * Update buff value
 */
window.updateBuff = function(playerId, buffType, value) {
  playerBuffs[playerId][buffType] = parseInt(value);
  
  // Find player data
  const player = players.find(p => p.playerId === playerId);
  if (!player) return;
  
  // Get coefficients
  const coefficients = positionCoefficients[selectedPosition] || {};
  
  // Build stats array
  const statsArray = [];
  for (const [key, config] of Object.entries(coefficients)) {
    if (player.stats[key]) {
      statsArray.push({
        key,
        name: config.name,
        coefficient: config.coefficient,
        baseValue: parseInt(player.stats[key].value) || 0
      });
    }
  }
  statsArray.sort((a, b) => b.coefficient - a.coefficient);
  
  // Get buffs
  const buffs = playerBuffs[playerId];
  
  // Recalculate OVR
  const ovrData = calculateOVR(statsArray, coefficients, buffs);
  
  // Update OVR display
  const ovrEl = document.getElementById(`ovr-${playerId}`);
  if (ovrEl) {
    ovrEl.textContent = ovrData.finalOVR;
    // Update buff text (next sibling)
    const buffEl = ovrEl.nextElementSibling;
    if (buffEl) {
      buffEl.innerHTML = `<span class="text-green-600 font-semibold">+${ovrData.totalBuff}</span>`;
    }
  }
  
  // Update stats table
  const statsEl = document.getElementById(`stats-${playerId}`);
  if (statsEl) {
    statsEl.innerHTML = renderStatsRows(statsArray, buffs);
  }
};

/**
 * Clear and go back
 */
window.clearAndBack = function() {
  localStorage.removeItem('comparePlayers');
  window.location.href = '/';
};

/**
 * Show error message
 */
function showError(message) {
  loadingDiv.classList.add('hidden');
  compareContent.classList.add('hidden');
  errorDiv.classList.remove('hidden');
  errorDiv.textContent = message;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
