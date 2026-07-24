const axios = require('axios');
const crypto = require('crypto');

const ALLOWED_HOSTS = new Set([
  'fifaaddict.com',
  'vn.fifaaddict.com',
  'en.fifaaddict.com',
]);

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const STAT_KEYS = {
  sprintspeed: 'speed', acceleration: 'acceleration', finishing: 'finishing',
  shotpower: 'shotPower', longshots: 'longShots', positioning: 'positioning',
  volleys: 'volleys', penalties: 'penalties', shortpassing: 'shortPassing',
  vision: 'vision', crossing: 'crossing', longpassing: 'longPassing',
  freekickaccuracy: 'freeKickAccuracy', curve: 'curve', dribbling: 'dribbling',
  ballcontrol: 'ballControl', agility: 'agility', balance: 'balance',
  reactions: 'reactions', marking: 'marking', standingtackle: 'standingTackle',
  interceptions: 'interceptions', headingaccuracy: 'heading', slidingtackle: 'slidingTackle',
  strength: 'strength', stamina: 'stamina', aggression: 'aggression', jumping: 'jumping',
  composure: 'composure', gkdiving: 'gkDiving', gkhandling: 'gkHandling',
  gkkicking: 'gkKicking', gkreflexes: 'gkReflexes', gkpositioning: 'gkPositioning',
};

function parsePlayerUrl(input) {
  let url;
  try {
    url = new URL(String(input || '').trim());
  } catch (_) {
    throw new Error('Link cầu thủ không hợp lệ');
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error('Chỉ hỗ trợ link HTTPS từ fifaaddict.com');
  }

  const match = url.pathname.match(/^\/fo4db\/(pid[a-zA-Z]+)\/?$/);
  if (!match) {
    throw new Error('Link phải có dạng https://vn.fifaaddict.com/fo4db/pid...');
  }

  return {
    playerId: match[1],
    pageUrl: `https://${url.hostname}/fo4db/${match[1]}`,
    apiBase: `https://${url.hostname}`,
  };
}

function commonHeaders(referer) {
  return {
    'User-Agent': USER_AGENT,
    Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.7',
    'X-Requested-With': 'XMLHttpRequest',
    Referer: referer,
  };
}

async function fetchRawPlayer(source) {
  // Fetch the public HTML first: validates that the player page exists and keeps
  // this integration tied to a user-provided public player page.
  const pageResponse = await axios.get(source.pageUrl, {
    headers: commonHeaders(source.pageUrl), timeout: 15000, maxContentLength: 2_000_000,
  });
  if (!pageResponse.data || !String(pageResponse.data).includes('window.__NUXT__')) {
    throw new Error('FIFA Addict không trả về trang cầu thủ hợp lệ');
  }

  const nonce = crypto.randomUUID().replace(/-/g, '');
  const handshake = await axios.get(`${source.apiBase}/api2?rq=araiwa&t=${nonce}`, {
    headers: { ...commonHeaders(source.pageUrl), 'Cache-Control': 'no-store' },
    timeout: 10000,
  });
  const token = typeof handshake.data === 'string' ? handshake.data : String(handshake.data || '');
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Không thể xác thực với FIFA Addict');

  const setCookies = handshake.headers['set-cookie'] || [];
  const cookie = setCookies.map((value) => value.split(';')[0]).join('; ');
  const response = await axios.get(
    `${source.apiBase}/api2?fo4pid=${encodeURIComponent(source.playerId)}&locale=vn`,
    {
      headers: { ...commonHeaders(source.pageUrl), 'X-ARAIWA': token, Cookie: cookie },
      timeout: 15000,
      maxContentLength: 2_000_000,
    }
  );
  if (!response.data || !response.data.db || !response.data.attr) {
    throw new Error('Không tìm thấy dữ liệu chi tiết của cầu thủ');
  }
  response.data.__seasonBadge = await extractSeasonBadge(
    String(pageResponse.data),
    response.data.db.year,
    source.pageUrl
  );
  return response.data;
}

async function extractSeasonBadge(pageHtml, seasonYear, referer) {
  if (!seasonYear) return null;
  const stylesheetUrls = [...pageHtml.matchAll(/href=["']([^"']+\.css)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href.includes('fifaaddict.com/ffaddv2/'))
    .slice(0, 6);

  for (const stylesheetUrl of [...new Set(stylesheetUrls)]) {
    try {
      const stylesheet = await axios.get(stylesheetUrl, {
        headers: commonHeaders(referer), timeout: 10000, maxContentLength: 2_000_000,
      });
      const css = String(stylesheet.data || '');
      const baseRule = css.match(/\.badgedss\{([^}]+)\}/);
      const yearRule = css.match(new RegExp(`\\.badgedss\\.y${Number(seasonYear)}\\{([^}]+)\\}`));
      if (!baseRule || !yearRule) continue;

      const imageMatch = baseRule[1].match(/background-image:url\(([^)]+)\)/);
      const positionMatch = yearRule[1].match(/background-position:([^;]+)/);
      const sizeMatch = yearRule[1].match(/background-size:([^;]+)/);
      if (!imageMatch || !positionMatch || !sizeMatch) continue;

      return {
        spriteUrl: new URL(imageMatch[1].replace(/["']/g, ''), stylesheetUrl).href,
        backgroundPosition: positionMatch[1].trim(),
        backgroundSize: sizeMatch[1].trim(),
        width: 30,
        height: 24,
      };
    } catch (_) {
      // Continue with another stylesheet; the UI has a text fallback.
    }
  }
  return null;
}

function normalizePlayer(raw, source) {
  const db = raw.db;
  const stats = {};
  for (const [sourceKey, stat] of Object.entries(raw.attr || {})) {
    const key = STAT_KEYS[sourceKey];
    if (!key || !stat) continue;
    const value = Number(stat.value) + 3; // Tự động cộng +3 để giống với mặc định trên web FIFA Addict
    stats[key] = { name: stat.name, value, baseValue: value, originalValue: value };
  }

  const positions = Object.values(db.postlist || {})
    .filter((item) => item.name !== 'ovr')
    .map((item) => ({ position: String(item.text || item.name).toUpperCase(), rating: String(Number(item.value) + 3) }));

  const hiddenStats = Object.values(raw.traits || {}).map((trait) => ({
    name: String(trait.name || '').trim(),
    description: String(trait.desc || '').trim(),
    iconUrl: trait.id ? `https://s1.fifaaddict.com/fo4/traits/trait_icon_${trait.id}.png` : null,
  }));

  const clubCareer = Object.values(db.clubcareer || {}).map((entry) => ({
    period: entry.year || null,
    club: entry.teamname || null,
  }));

  return {
    playerId: source.playerId,
    source: 'FIFA Addict',
    sourceUrl: source.pageUrl,
    name: db.name,
    season: String(db.season_name || '').toUpperCase(),
    seasonName: db.season_full,
    seasonYear: db.year,
    seasonBadge: raw.__seasonBadge || null,
    position: db.pos1,
    positions,
    overallRating: Number(db.pos1val || db.current_ovr) + 3,
    overallDisplay: Number(db.pos1val || db.current_ovr) + 3,
    avatarUrl: `https://s1.fifaaddict.com/fo4/players/${db.uid}.png`,
    mainImageUrl: `https://s1.fifaaddict.com/fo4/players/${db.uid}.png`,
    height: db.height,
    weight: db.weight,
    birthdate: db.birthdate,
    age: db.age,
    shirtNumber: db.number,
    nation: db.nation_name,
    club: db.team_name,
    league: db.league_name,
    preferredFoot: db.foot_pref,
    weakFoot: Number(db.foot_weak),
    skillMoves: Number(db.skill_level),
    salary: db.salary,
    bodyType: db.bodytype_name,
    workRateAttack: db.workrate_att,
    workRateDefense: db.workrate_def,
    reputation: db.reputation,
    stats,
    hiddenStats,
    clubCareer,
    scrapedAt: new Date().toISOString(),
  };
}

async function getPlayerFromUrl(input) {
  const source = parsePlayerUrl(input);
  const cached = cache.get(source.pageUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.player;
  const player = normalizePlayer(await fetchRawPlayer(source), source);
  cache.set(source.pageUrl, { timestamp: Date.now(), player });
  return player;
}

module.exports = { parsePlayerUrl, normalizePlayer, getPlayerFromUrl };
