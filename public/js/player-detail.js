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
    
    // Extract ratings (format: "122|121" or single number)
    let mainRating = '';
    let altRating = '';
    if (pos.rating && typeof pos.rating === 'string') {
      const ratings = pos.rating.split('|');
      mainRating = ratings[0] || '';
      altRating = ratings[1] || '';
    }
    
    positionBadge.className = `inline-flex items-center gap-2 px-3 py-2 ${bgColor} text-white rounded-lg text-sm font-semibold ${borderClass} transition-all hover:scale-105`;
    
    positionBadge.innerHTML = `
      <span class="font-bold">${pos.position}</span>
      <span class="text-amber-300 font-bold">${mainRating}</span>
      ${altRating ? `<span class="text-gray-300 text-xs">(${altRating})</span>` : ''}
    `;
    
    playerPositionsDiv.appendChild(positionBadge);
  });
}

/**
 * Render stats tabs based on player positions
 */
async function renderStatsTabs(player) {
  if (!player.positions || !Array.isArray(player.positions) || player.positions.length === 0) {
    statsTabsNav.innerHTML = '<p class="text-gray-400 py-4">Không có thông tin vị trí</p>';
    statsTabsContent.innerHTML = '';
    return;
  }
  
  // Create "Chỉ số chung" tab
  const allTab = createTabButton('all', 'Chỉ số chung', true);
  statsTabsNav.innerHTML = '';
  statsTabsNav.appendChild(allTab);
  
  // Create tabs for each position
  player.positions.forEach((pos, index) => {
    const tab = createTabButton(
      `pos-${index}`, 
      `${pos.position} (${pos.rating})`, 
      false
    );
    statsTabsNav.appendChild(tab);
  });
  
  // Create tab contents
  statsTabsContent.innerHTML = '';
  
  // "Chỉ số chung" content
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
  
  // Position-specific contents
  for (let i = 0; i < player.positions.length; i++) {
    const pos = player.positions[i];
    const content = document.createElement('div');
    content.id = `pos-${i}Tab`;
    content.className = 'stats-tab-content hidden';
    content.innerHTML = `
      <div class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-2 text-gray-500">Đang tải chỉ số cho ${pos.position}...</p>
      </div>
    `;
    statsTabsContent.appendChild(content);
    
    // Fetch and display position stats
    fetchAndDisplayPositionStats(pos.position, player.stats, `pos-${i}Tab`);
  }
  
  // Setup tab switching
  setupTabs();
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
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-2 px-4 text-left text-xs font-semibold text-gray-600">Chỉ số</th>
              <th class="py-2 px-4 text-right text-xs font-semibold text-gray-600">Giá trị</th>
              <th class="py-2 px-4 text-right text-xs font-semibold text-gray-600">Hệ số</th>
              <th class="py-2 px-4 text-left text-xs font-semibold text-gray-600">Chỉ số</th>
              <th class="py-2 px-4 text-right text-xs font-semibold text-gray-600">Giá trị</th>
              <th class="py-2 px-4 text-right text-xs font-semibold text-gray-600">Hệ số</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100" id="${contentId}-table"></tbody>
        </table>
      </div>
    `;
    
    const tbody = document.getElementById(`${contentId}-table`);
    renderStatsTableWithCoefficient(statsWithCoef, tbody);
    
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
        const value = stat.value || 0;
        const displayName = stat.name || formatStatKey(statData.key);
        
        const nameCell = document.createElement('td');
        nameCell.className = 'py-3 px-4 text-sm font-medium text-gray-700';
        nameCell.textContent = displayName;
        
        const valueCell = document.createElement('td');
        valueCell.className = 'py-3 px-4 text-sm';
        let colorClass = 'text-gray-800';
        if (value >= 80) colorClass = 'text-green-600 font-bold';
        else if (value >= 60) colorClass = 'text-orange-600 font-semibold';
        
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
 * Render stats table with coefficient (6 columns = 2 stats per row with coefficients)
 */
function renderStatsTableWithCoefficient(statsArray, tbody) {
  for (let i = 0; i < statsArray.length; i += 2) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    for (let j = 0; j < 2; j++) {
      const statData = statsArray[i + j];
      if (statData) {
        const { stat, coefficient } = statData;
        const value = stat.value || 0;
        const displayName = stat.name || formatStatKey(statData.key);
        
        const nameCell = document.createElement('td');
        nameCell.className = 'py-2 px-4 text-sm font-medium text-gray-700';
        nameCell.textContent = displayName;
        
        const valueCell = document.createElement('td');
        valueCell.className = 'py-2 px-4 text-sm text-right';
        let colorClass = 'text-gray-800';
        if (value >= 80) colorClass = 'text-green-600 font-bold';
        else if (value >= 60) colorClass = 'text-orange-600 font-semibold';
        valueCell.innerHTML = `<span class="${colorClass}">${value}</span>`;
        
        const coefCell = document.createElement('td');
        coefCell.className = 'py-2 px-4 text-xs text-gray-500 text-right';
        coefCell.textContent = `×${coefficient}`;
        
        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(coefCell);
      } else {
        const emptyCell1 = document.createElement('td');
        emptyCell1.className = 'py-2 px-4';
        const emptyCell2 = document.createElement('td');
        emptyCell2.className = 'py-2 px-4';
        const emptyCell3 = document.createElement('td');
        emptyCell3.className = 'py-2 px-4';
        row.appendChild(emptyCell1);
        row.appendChild(emptyCell2);
        row.appendChild(emptyCell3);
      }
    }
    
    tbody.appendChild(row);
  }
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
