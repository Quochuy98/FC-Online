/**
 * Club Search Page - Client-side logic for searching players by club
 */

// DOM Elements
const clubNameInput = document.getElementById('clubName');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const emptyState = document.getElementById('emptyState');
const playersGrid = document.getElementById('playersGrid');
const resultCount = document.getElementById('resultCount');
const clubTitle = document.getElementById('clubTitle');

/**
 * Initialize the page
 */
function init() {
  // Event listeners
  searchBtn.addEventListener('click', performSearch);
  clubNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

/**
 * Perform club search
 */
async function performSearch() {
  const club = clubNameInput.value.trim();
  
  if (!club) {
    showError('Vui lòng nhập tên câu lạc bộ');
    return;
  }
  
  showLoading();
  
  try {
    const response = await fetch(`/api/players/by-club?club=${encodeURIComponent(club)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra khi tìm kiếm');
    }
    
    displayResults(data.players, club);
  } catch (err) {
    console.error('Search error:', err);
    showError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
  }
}

/**
 * Display search results
 */
function displayResults(players, club) {
  hideLoading();
  
  if (!players || players.length === 0) {
    showEmpty(`Không tìm thấy cầu thủ nào từng chơi cho "${club}"`);
    return;
  }
  
  // Update results count and club title
  resultCount.textContent = `(${players.length})`;
  clubTitle.textContent = `Cầu thủ từng chơi cho: ${club}`;
  clubTitle.classList.remove('hidden');
  
  // Show grid and populate
  playersGrid.innerHTML = '';
  playersGrid.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  players.forEach(player => {
    const playerCard = createPlayerCard(player, club);
    playersGrid.appendChild(playerCard);
  });
}

/**
 * Create a player card (list item)
 */
function createPlayerCard(player, searchedClub) {
  const li = document.createElement('div');
  li.className = 'bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-primary rounded-xl p-4 transition-all cursor-pointer flex items-center gap-4';
  
  // Find the club career entry that matches the searched club
  const clubCareer = player.clubCareer?.find(career => 
    career.club.toLowerCase().includes(searchedClub.toLowerCase())
  );
  
  li.innerHTML = `
    <img 
      src="${player.avatarUrl || '/images/default-player.png'}" 
      alt="${player.name}" 
      class="w-20 h-20 rounded-full object-cover border-2 border-primary flex-shrink-0"
      onerror="this.src='/images/default-player.png'"
    >
    
    <div class="flex-1 min-w-0">
      <h3 class="text-xl font-bold text-gray-800 mb-2 truncate">${player.name}</h3>
      
      <div class="flex items-center gap-3 mb-2 flex-wrap">
        <span class="season-badge bg-${player.season}" title="${player.season}"></span>
        <span class="px-3 py-1 bg-primary text-white rounded-lg text-sm font-semibold">${player.position}</span>
        <span class="text-gray-600 text-sm">⭐ ${player.starRating}</span>
      </div>
      
      ${clubCareer ? `
        <div class="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg inline-block">
          <span class="font-semibold">⚽ ${clubCareer.club}</span> 
          <span class="text-gray-400 mx-2">•</span>
          <span>${clubCareer.period}</span>
        </div>
      ` : ''}
    </div>
    
    <div class="text-right flex-shrink-0">
      <div class="mb-3">
        <div class="text-3xl font-bold text-amber-600">${player.overallDisplay || player.overallRating}</div>
        <div class="text-xs text-gray-500">Overall</div>
      </div>
      <div class="text-sm">
        <div class="px-3 py-1 bg-green-50 text-green-700 rounded-lg font-semibold">
          💰 ${getSalary(player.overallRating)}
        </div>
      </div>
    </div>
  `;
  
  // Click to view player details
  li.addEventListener('click', () => {
    window.location.href = `/player?id=${player.playerId}`;
  });
  
  return li;
}

/**
 * Calculate salary based on overall rating
 */
function getSalary(overallRating) {
  const ovr = parseInt(overallRating);
  if (ovr >= 31) return '220BP';
  if (ovr >= 30) return '210BP';
  if (ovr >= 29) return '200BP';
  if (ovr >= 28) return '190BP';
  if (ovr >= 27) return '175BP';
  if (ovr >= 26) return '155BP';
  if (ovr >= 25) return '135BP';
  if (ovr >= 24) return '120BP';
  if (ovr >= 23) return '105BP';
  if (ovr >= 22) return '95BP';
  if (ovr >= 21) return '85BP';
  if (ovr >= 20) return '75BP';
  if (ovr >= 19) return '65BP';
  if (ovr >= 18) return '55BP';
  if (ovr >= 17) return '50BP';
  if (ovr >= 16) return '45BP';
  if (ovr >= 15) return '40BP';
  if (ovr >= 14) return '35BP';
  if (ovr >= 13) return '30BP';
  if (ovr >= 12) return '25BP';
  if (ovr >= 11) return '20BP';
  return '15BP';
}

/**
 * Show loading state
 */
function showLoading() {
  loading.classList.remove('hidden');
  error.classList.add('hidden');
  emptyState.classList.add('hidden');
  playersGrid.classList.add('hidden');
  clubTitle.classList.add('hidden');
  resultCount.textContent = '(0)';
}

/**
 * Hide loading state
 */
function hideLoading() {
  loading.classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
  hideLoading();
  error.textContent = message;
  error.classList.remove('hidden');
  emptyState.classList.add('hidden');
  playersGrid.classList.add('hidden');
  clubTitle.classList.add('hidden');
  resultCount.textContent = '(0)';
}

/**
 * Show empty state
 */
function showEmpty(message) {
  hideLoading();
  emptyState.innerHTML = `
    <svg class="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <p class="text-xl font-semibold mb-2">${message}</p>
    <p class="text-gray-400">Thử tìm kiếm với tên câu lạc bộ khác</p>
  `;
  emptyState.classList.remove('hidden');
  playersGrid.classList.add('hidden');
  clubTitle.classList.add('hidden');
  resultCount.textContent = '(0)';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
