/**
 * GET /api/service-area/:zip  — Zip code lookup with service area info
 *
 * Returns:
 * {
 *   "zip": "21201",
 *   "inServiceArea": true,
 *   "area": { "name": "Baltimore City", "status": "primary", ... }
 * }
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const PRICES_PATH = path.join(__dirname, '../../config/prices.json');

// Simple in-process cache (invalidated on file change)
let cache = null;
let cacheTs = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

function loadPrices() {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_TTL_MS) return cache;
  const raw = fs.readFileSync(PRICES_PATH, 'utf8');
  cache = JSON.parse(raw);
  cacheTs = now;
  return cache;
}

// ── GET /api/service-area/:zip ───────────────────────────────────────────────
router.get('/:zip', (req, res) => {
  const zip = (req.params.zip || '').trim();

  if (!/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'Zip code must be a 5-digit number' });
  }

  let prices;
  try {
    prices = loadPrices();
  } catch {
    return res.status(500).json({ error: 'Failed to load pricing config' });
  }

  const areas = prices.serviceAreas;

  // Check Baltimore City
  if (areas.baltimore.zipCodes.includes(zip)) {
    return res.json({
      zip,
      inServiceArea: true,
      area: {
        name: areas.baltimore.name,
        status: areas.baltimore.status,
        basePrice: areas.baltimore.basePrice,
        markup: areas.baltimore.markup
      }
    });
  }

  // Check Neighboring
  const isNeighboring = areas.neighboring.zipCodePrefixes.some(prefix =>
    zip.startsWith(prefix)
  );
  if (isNeighboring) {
    return res.json({
      zip,
      inServiceArea: true,
      area: {
        name: areas.neighboring.name,
        status: areas.neighboring.status,
        basePrice: areas.neighboring.basePrice,
        markup: areas.neighboring.markup,
        additionalNotice: areas.neighboring.additionalNotice
      }
    });
  }

  // Other / out of area
  return res.json({
    zip,
    inServiceArea: false,
    area: {
      name: areas.other.name,
      status: areas.other.status,
      basePrice: areas.other.basePrice,
      markup: areas.other.markup,
      additionalNotice: areas.other.additionalNotice
    }
  });
});

module.exports = router;
