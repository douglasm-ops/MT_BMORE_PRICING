/**
 * Auth middleware
 * - Read endpoints (GET): open
 * - Write endpoints (PATCH, POST to admin): API key required
 */

const API_KEY = process.env.API_KEY;

/**
 * Require a valid API key for write/admin operations.
 * Pass the key via:  Authorization: Bearer <key>
 * or query param:    ?apiKey=<key>  (for curl convenience)
 */
function requireApiKey(req, res, next) {
  if (!API_KEY) {
    // If no API_KEY is configured, block all write operations
    return res.status(500).json({ error: 'Server not configured for authenticated requests' });
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.query.apiKey;

  if (!token || token !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  next();
}

module.exports = { requireApiKey };
