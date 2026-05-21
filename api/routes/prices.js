/**
 * GET  /api/prices         — Returns the full pricing config (server-side, not exposed in browser)
 * PATCH /api/prices        — Update a specific pricing field (API key required)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();
const PRICES_PATH = path.join(__dirname, '../../config/prices.json');

function loadPrices() {
  const raw = fs.readFileSync(PRICES_PATH, 'utf8');
  return JSON.parse(raw);
}

function savePrices(data) {
  data.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(PRICES_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ── GET /api/prices ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const prices = loadPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load pricing config' });
  }
});

// ── PATCH /api/prices ───────────────────────────────────────────────────────
// Body: { "path": "serviceTiers.standard.baseHourlyRate", "value": 60 }
router.patch('/', requireApiKey, (req, res) => {
  const { path: fieldPath, value } = req.body;

  if (!fieldPath || value === undefined) {
    return res.status(400).json({ error: 'Both "path" and "value" are required' });
  }

  try {
    const prices = loadPrices();
    const keys = fieldPath.split('.');
    let obj = prices;

    // Walk to the second-to-last key
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] === undefined) {
        return res.status(400).json({ error: `Invalid path: "${fieldPath}"` });
      }
      obj = obj[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (obj[lastKey] === undefined) {
      return res.status(400).json({ error: `Invalid path: "${fieldPath}"` });
    }

    const oldValue = obj[lastKey];
    obj[lastKey] = value;
    savePrices(prices);

    console.log(`[PRICES] Updated ${fieldPath}: ${oldValue} → ${value}`);

    res.json({
      success: true,
      path: fieldPath,
      oldValue,
      newValue: value,
      lastUpdated: prices.lastUpdated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pricing config' });
  }
});

module.exports = router;
