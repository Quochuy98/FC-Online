const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePlayerUrl, normalizePlayer } = require('../src/services/fifaAddictPlayerService');

test('accepts a FIFA Addict player URL and extracts its id', () => {
  assert.deepEqual(parsePlayerUrl('https://vn.fifaaddict.com/fo4db/pidaavmwaaqy'), {
    playerId: 'pidaavmwaaqy',
    pageUrl: 'https://vn.fifaaddict.com/fo4db/pidaavmwaaqy',
    apiBase: 'https://vn.fifaaddict.com',
  });
});

test('rejects unsupported hosts, protocols and paths', () => {
  assert.throws(() => parsePlayerUrl('http://vn.fifaaddict.com/fo4db/pidaavmwaaqy'));
  assert.throws(() => parsePlayerUrl('https://example.com/fo4db/pidaavmwaaqy'));
  assert.throws(() => parsePlayerUrl('https://vn.fifaaddict.com/fo4db'));
});

test('normalizes third-party data for the existing training UI', () => {
  const source = parsePlayerUrl('https://vn.fifaaddict.com/fo4db/pidaavmwaaqy');
  const player = normalizePlayer({
    db: {
      uid: 'aavmwaaqy', year: 865, name: 'Ronaldo', season_name: 'iprm', season_full: 'Infinite Prime',
      pos1: 'ST', pos1val: 133, height: 183, weight: 78, nation_name: 'Brazil',
      team_name: 'Infinite Prime', postlist: {
        1: { name: 'ovr', text: 'OVR', value: 133 },
        2: { name: 'st', text: 'ST', value: 133 },
      },
      clubcareer: { 1: { year: '2009 - 2011', teamname: 'Corinthians' } },
    },
    attr: {
      sprintspeed: { name: 'Tốc độ', value: 140 },
      shotpower: { name: 'Lực sút', value: 131 },
      headingaccuracy: { name: 'Đánh đầu', value: 123 },
    },
    traits: { flair: { id: '14', name: 'Tinh tế', desc: 'Kỹ năng điệu nghệ' } },
    __seasonBadge: { spriteUrl: 'https://example.test/seasons.png', backgroundPosition: '11% 100%' },
  }, source);

  assert.equal(player.name, 'Ronaldo');
  assert.equal(player.seasonYear, 865);
  assert.equal(player.seasonBadge.spriteUrl, 'https://example.test/seasons.png');
  assert.equal(player.stats.speed.value, 140);
  assert.equal(player.stats.shotPower.value, 131);
  assert.equal(player.stats.heading.value, 123);
  assert.deepEqual(player.positions, [{ position: 'ST', rating: '133' }]);
  assert.deepEqual(player.clubCareer, [{ period: '2009 - 2011', club: 'Corinthians' }]);
  assert.equal(player.hiddenStats[0].name, 'Tinh tế');
});
