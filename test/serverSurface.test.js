const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app } = require('../server/api');

test('exposes only the home page and one import API', () => {
  const routes = app._router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }));

  assert.deepEqual(routes, [
    { path: '/', methods: ['get'] },
    { path: '/api/player/import', methods: ['post'] },
  ]);
});

test('serves position coefficients as a static asset instead of an API', () => {
  const coefficientPath = path.join(__dirname, '../public/config/positionCoefficients.json');
  const coefficients = JSON.parse(fs.readFileSync(coefficientPath, 'utf8'));
  assert.ok(coefficients['RW/LW']);
  assert.ok(coefficients['LS/ST/RS']);
});
