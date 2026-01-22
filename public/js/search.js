/**
 * Search Page Logic
 */

// State
let currentPage = 1;
let currentFilters = {};
let constants = null;
let selectedSeasons = []; // Array of selected seasons for multiple filter

// DOM Elements
const playerNameInput = document.getElementById('playerName');
const positionFilter = document.getElementById('positionFilter');
const minOverallInput = document.getElementById('minOverall');
const maxOverallInput = document.getElementById('maxOverall');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const playersGrid = document.getElementById('playersGrid');
const paginationDiv = document.getElementById('pagination');
const resultCount = document.getElementById('resultCount');
const paginationInfo = document.getElementById('paginationInfo');
const quickSeasonsDiv = document.getElementById('quickSeasons');

/**
 * Initialize page
 */
async function init() {
  try {
    // Load constants
    constants = await PlayerAPI.getConstants();
    
    // Populate filters
    populateFilters();
    
    // Populate quick seasons
    populateQuickSeasons();
    
    // Load URL params
    loadUrlParams();
    
    // Perform initial search
    await performSearch();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    showError('Không thể tải dữ liệu. Vui lòng thử lại!');
  }
}

/**
 * Populate filter dropdowns
 */
function populateFilters() {
  // Positions
  constants.positions.forEach(pos => {
    const option = document.createElement('option');
    option.value = pos;
    option.textContent = pos;
    positionFilter.appendChild(option);
  });
  
}

/**
 * Populate quick season badges
 */
function populateQuickSeasons() {
  // Show all seasons from constants
  constants.seasons.forEach(season => {
    const wrapper = document.createElement('div');
    wrapper.className = 'p-2 rounded-lg border-2 border-transparent hover:border-primary hover:bg-blue-50 transition-all cursor-pointer';
    wrapper.dataset.season = season;
    
    const badge = document.createElement('span');
    badge.className = `season-badge bg-${season}`;
    badge.title = season;
    
    wrapper.appendChild(badge);
    wrapper.addEventListener('click', () => handleQuickSeasonClick(season, wrapper));
    
    quickSeasonsDiv.appendChild(wrapper);
  });
  
  // Update seasons counter
  updateSeasonsCounter();
  
  // Update container height if needed
  if (typeof updateSeasonsHeight === 'function') {
    updateSeasonsHeight();
  }
}

/**
 * Handle quick season click (multiple selection)
 */
function handleQuickSeasonClick(season, element) {
  // Check if already selected
  const isSelected = selectedSeasons.includes(season);
  
  if (isSelected) {
    // Remove from selection
    selectedSeasons = selectedSeasons.filter(s => s !== season);
    element.classList.remove('border-primary', 'bg-blue-50');
  } else {
    // Add to selection
    selectedSeasons.push(season);
    element.classList.add('border-primary', 'bg-blue-50');
  }
  
  // Update counter
  updateSeasonsCounter();
  
  // Perform search
  currentPage = 1;
  performSearch();
}

/**
 * Update seasons counter display
 */
function updateSeasonsCounter() {
  const seasonsCount = document.getElementById('seasonsCount');
  if (seasonsCount && constants) {
    const total = constants.seasons.length;
    const selected = selectedSeasons.length;
    seasonsCount.textContent = `${selected}/${total} mùa`;
    
    // Change color if some selected
    if (selected > 0) {
      seasonsCount.className = 'text-sm font-bold text-primary';
    } else {
      seasonsCount.className = 'text-sm font-semibold text-primary';
    }
  }
}

/**
 * Load URL parameters into filters
 */
function loadUrlParams() {
  const params = Utils.getUrlParams();
  
  if (params.name) playerNameInput.value = params.name;
  if (params.position) positionFilter.value = params.position;
  
  // Handle multiple seasons (comma-separated)
  if (params.seasons) {
    selectedSeasons = params.seasons.split(',').filter(s => s.trim());
    // Highlight all selected season badges
    selectedSeasons.forEach(season => {
      const badge = quickSeasonsDiv.querySelector(`[data-season="${season}"]`);
      if (badge) {
        badge.classList.add('border-primary', 'bg-blue-50');
      }
    });
    updateSeasonsCounter();
  }
  
  if (params.minOverall) minOverallInput.value = params.minOverall;
  if (params.maxOverall) maxOverallInput.value = params.maxOverall;
  if (params.page) currentPage = parseInt(params.page);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Search button
  searchBtn.addEventListener('click', () => {
    currentPage = 1;
    performSearch();
  });
  
  // Clear button
  clearBtn.addEventListener('click', clearFilters);
  
  // Enter key in search input
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      performSearch();
    }
  });
  
  // Auto-search on filter change (debounced)
  const debouncedSearch = Utils.debounce(() => {
    currentPage = 1;
    performSearch();
  }, 500);
  
  // Position filter change
  positionFilter.addEventListener('change', debouncedSearch);
  
  // Overall inputs
  [minOverallInput, maxOverallInput].forEach(el => {
    el.addEventListener('input', debouncedSearch);
  });
}

/**
 * Perform search
 */
async function performSearch() {
  try {
    // Show loading
    loadingDiv.classList.remove('hidden');
    loadingDiv.classList.add('flex');
    errorDiv.classList.add('hidden');
    playersGrid.innerHTML = '';
    
    // Build filters
    currentFilters = {
      name: playerNameInput.value.trim(),
      position: positionFilter.value,
      minOverall: minOverallInput.value,
      maxOverall: maxOverallInput.value,
      sortBy: 'overall',      // Always sort by overall
      sortOrder: 'desc',      // Always high to low
      page: currentPage,
      limit: 20,
    };
    
    // Add multiple seasons as comma-separated string
    if (selectedSeasons.length > 0) {
      currentFilters.seasons = selectedSeasons.join(',');
    }
    
    // Remove empty values (except sort params)
    Object.keys(currentFilters).forEach(key => {
      if (!currentFilters[key] && key !== 'sortBy' && key !== 'sortOrder') {
        delete currentFilters[key];
      }
    });
    
    // Update URL with filters (including sort params)
    Utils.updateUrl(currentFilters);
    
    // Fetch data
    const result = await PlayerAPI.searchPlayers(currentFilters);
    
    // Hide loading
    loadingDiv.classList.add('hidden');
    loadingDiv.classList.remove('flex');
    
    // Display results
    displayResults(result);
  } catch (error) {
    loadingDiv.classList.add('hidden');
    loadingDiv.classList.remove('flex');
    showError('Lỗi khi tìm kiếm. Vui lòng thử lại!');
  }
}

/**
 * Display search results
 */
function displayResults(result) {
  const { data, pagination } = result;
  
  // Update result count
  resultCount.textContent = `(${Utils.formatNumber(pagination.total)})`;
  
  // Update pagination info
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  paginationInfo.textContent = pagination.total > 0
    ? `Hiển thị ${start}-${end} / ${Utils.formatNumber(pagination.total)}`
    : 'Không có kết quả';
  
  // Clear grid
  playersGrid.innerHTML = '';
  
  // Display players
  if (data.length === 0) {
    playersGrid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <p class="text-xl text-gray-500 mb-2">Không tìm thấy cầu thủ nào</p>
        <p class="text-gray-400 italic">Thử thay đổi bộ lọc</p>
      </div>
    `;
    paginationDiv.innerHTML = '';
    return;
  }
  
  data.forEach(player => {
    const card = createPlayerCard(player);
    playersGrid.appendChild(card);
  });
  
  // Display pagination
  displayPagination(pagination);
}

/**
 * Create player card
 */
function createPlayerCard(player) {
  const card = document.createElement('div');
  card.className = 'bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-primary hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer';
  card.onclick = () => window.location.href = `/player.html?id=${player.playerId}`;
  
  const speed = player.stats?.speed?.value || 0;
  const finishing = player.stats?.finishing?.value || 0;
  const passing = player.stats?.shortPassing?.value || 0;
  
  // Use overallDisplay if available, otherwise extract from positions
  let overall = player.overallDisplay || 0;
  if (!overall && Array.isArray(player.positions) && player.position) {
    const posObj = player.positions.find(p => p.position === player.position);
    if (posObj && typeof posObj.rating === 'string') {
      overall = posObj.rating.split('|')[0];
    }
  }
  
  card.innerHTML = `
    <div class="flex items-center gap-4 mb-4">
      <img 
        src="${player.avatarUrl || '/images/default-player.png'}" 
        alt="${player.name}" 
        class="w-20 h-20 rounded-full object-cover border-3 border-gray-100"
        onerror="this.src='/images/default-player.png'"
      >
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-800 mb-2 truncate">${player.name}</h3>
        <div class="flex flex-wrap gap-2 items-center">
          <span class="season-badge bg-${player.season}" title="${player.season}"></span>
          <span class="px-3 py-1 bg-primary text-white rounded-md text-sm font-semibold">${player.position}</span>
          <span class="px-3 py-1 bg-amber-500 text-white rounded-md text-sm font-semibold">${overall}</span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
      <div class="text-center">
        <div class="text-xs text-gray-500 mb-1">Tốc độ</div>
        <div class="text-lg font-bold text-gray-800">${speed}</div>
      </div>
      <div class="text-center">
        <div class="text-xs text-gray-500 mb-1">Dứt điểm</div>
        <div class="text-lg font-bold text-gray-800">${finishing}</div>
      </div>
      <div class="text-center">
        <div class="text-xs text-gray-500 mb-1">Chuyền</div>
        <div class="text-lg font-bold text-gray-800">${passing}</div>
      </div>
    </div>
  `;
  
  return card;
}

/**
 * Display pagination
 */
function displayPagination(pagination) {
  paginationDiv.innerHTML = '';
  
  const { page, pages } = pagination;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Trước';
  prevBtn.disabled = page === 1;
  prevBtn.className = `px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
    page === 1 
      ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
      : 'border-gray-200 text-gray-700 hover:border-primary hover:bg-blue-50'
  }`;
  prevBtn.onclick = () => {
    if (page > 1) {
      currentPage = page - 1;
      performSearch();
    }
  };
  paginationDiv.appendChild(prevBtn);
  
  // Page numbers (show max 7 pages)
  const maxPages = 7;
  let startPage = Math.max(1, page - Math.floor(maxPages / 2));
  let endPage = Math.min(pages, startPage + maxPages - 1);
  
  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }
  
  // First page
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'px-2 py-2 text-gray-400';
      paginationDiv.appendChild(dots);
    }
  }
  
  // Page buttons
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i);
  }
  
  // Last page
  if (endPage < pages) {
    if (endPage < pages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'px-2 py-2 text-gray-400';
      paginationDiv.appendChild(dots);
    }
    addPageButton(pages);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Sau →';
  nextBtn.disabled = page === pages;
  nextBtn.className = `px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
    page === pages 
      ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
      : 'border-gray-200 text-gray-700 hover:border-primary hover:bg-blue-50'
  }`;
  nextBtn.onclick = () => {
    if (page < pages) {
      currentPage = page + 1;
      performSearch();
    }
  };
  paginationDiv.appendChild(nextBtn);
  
  function addPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.textContent = pageNum;
    btn.className = pageNum === page 
      ? 'px-4 py-2 bg-primary text-white border-2 border-primary rounded-lg font-semibold'
      : 'px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:border-primary hover:bg-blue-50 transition-all';
    btn.onclick = () => {
      currentPage = pageNum;
      performSearch();
    };
    paginationDiv.appendChild(btn);
  }
}

/**
 * Clear filters
 */
function clearFilters() {
  playerNameInput.value = '';
  positionFilter.value = '';
  minOverallInput.value = '';
  maxOverallInput.value = '';
  
  // Clear selected seasons
  selectedSeasons = [];
  
  // Clear quick season badges active state
  quickSeasonsDiv.querySelectorAll('[data-season]').forEach(el => {
    el.classList.remove('border-primary', 'bg-blue-50');
  });
  
  // Update counter
  updateSeasonsCounter();
  
  currentPage = 1;
  performSearch();
}

/**
 * Show error message
 */
function showError(message) {
  errorDiv.classList.remove('hidden');
  errorDiv.textContent = message;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
