/**
 * Parse overall rating to a numeric value used for sorting/display.
 *
 * Source pages sometimes expose overall as:
 * - number: 123
 * - string: "123"
 * - string with bonus: "123+2" / "123 + 2"
 * - other formats (fallback): extract first integer token
 *
 * @param {unknown} overall
 * @returns {number|null} Parsed overall value, or null if not parseable
 */
function parseOverallDisplay(overall) {
  if (overall === null || overall === undefined) return null;

  if (typeof overall === 'number' && Number.isFinite(overall)) {
    return overall;
  }

  const raw = String(overall).trim();
  if (!raw) return null;

  const match = raw.match(/-?\d+/);
  if (!match) return null;

  const value = Number.parseInt(match[0], 10);
  return Number.isFinite(value) ? value : null;
}

module.exports = {
  parseOverallDisplay,
};

