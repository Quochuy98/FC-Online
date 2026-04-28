/**
 * Normalize automua URLs to HTTPS.
 *
 * Some scraped links may point to automua hosts over plain HTTP even though
 * the target server only accepts HTTPS. This helper upgrades known automua
 * hosts to HTTPS while preserving path and query string.
 *
 * @param {string} rawUrl
 * @returns {string|null}
 */
function normalizeAutomuaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  try {
    const url = new URL(rawUrl);

    if (
      url.hostname === 'automua.com' ||
      url.hostname.endsWith('.automua.com')
    ) {
      url.protocol = 'https:';
    }

    return url.toString();
  } catch (error) {
    return rawUrl;
  }
}

module.exports = {
  normalizeAutomuaUrl,
};

