/**
 * POST /api/quote  — Server-side quote calculation with logging
 *
 * Body:
 * {
 *   "zipCode":    "21201",
 *   "tierId":     "standard" | "deep" | "moveOut" | "squareFootage",
 *   "hours":      3,                  // required for hourly tiers
 *   "squareFeet": 1500,               // required for squareFootage tier
 *   "addOns":     ["windowCleaning"], // optional
 *   "discountId": "recurring",        // optional
 *   "source":     "playbook"          // optional tag for tracking source
 * }
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { logQuote } = require('../db/logger');

const router = express.Router();
const PRICES_PATH = path.join(__dirname, '../../config/prices.json');

function loadPrices() {
  const raw = fs.readFileSync(PRICES_PATH, 'utf8');
  return JSON.parse(raw);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getServiceAreaByZip(prices, zipCode) {
  const areas = prices.serviceAreas;
  if (areas.baltimore.zipCodes.includes(zipCode)) return areas.baltimore;

  const isNeighboring = areas.neighboring.zipCodePrefixes.some(prefix =>
    zipCode.startsWith(prefix)
  );
  if (isNeighboring) return areas.neighboring;

  return areas.other;
}

function calculateHourlyQuote(prices, tier, area, hours, addOns) {
  const effectiveHours = Math.max(hours, tier.minimumHours || 1);
  const baseCost = tier.baseHourlyRate * effectiveHours;
  const areaAdjustment = (area.basePrice || 0) + (baseCost * (area.markup - 1));
  let subtotal = baseCost + areaAdjustment;

  const addOnsCost = addOns.reduce((sum, id) => {
    return sum + (prices.addOns[id]?.price || 0);
  }, 0);

  subtotal += addOnsCost;

  return {
    hours: effectiveHours,
    hourlyRate: tier.baseHourlyRate,
    baseCost,
    areaAdjustment,
    addOnsCost,
    subtotal
  };
}

function calculateSquareFootageQuote(prices, area, squareFeet, addOns) {
  const sfTier = prices.serviceTiers.squareFootage;
  const laborHours = Math.ceil(squareFeet / sfTier.productivity.rate);
  const baseCost = laborHours * sfTier.laborRate;
  const areaAdjustment = (area.basePrice || 0) + (baseCost * (area.markup - 1));

  const addOnsCost = addOns.reduce((sum, id) => {
    return sum + (prices.addOns[id]?.price || 0);
  }, 0);

  const subtotal = baseCost + areaAdjustment + addOnsCost;

  return {
    squareFeet,
    laborHours,
    laborRate: sfTier.laborRate,
    baseCost,
    areaAdjustment,
    addOnsCost,
    subtotal
  };
}

// ── POST /api/quote ──────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { zipCode, tierId, hours, squareFeet, addOns = [], discountId, source } = req.body;

  if (!zipCode || !tierId) {
    return res.status(400).json({ error: '"zipCode" and "tierId" are required' });
  }

  let prices;
  try {
    prices = loadPrices();
  } catch {
    return res.status(500).json({ error: 'Failed to load pricing config' });
  }

  // Service area lookup
  const area = getServiceAreaByZip(prices, zipCode);

  // Tier lookup
  const tier = prices.serviceTiers[tierId];
  if (!tier) {
    return res.status(400).json({ error: `Unknown tier: "${tierId}"` });
  }

  // Validate add-ons
  const invalidAddOns = addOns.filter(id => !prices.addOns[id]);
  if (invalidAddOns.length > 0) {
    return res.status(400).json({ error: `Unknown add-ons: ${invalidAddOns.join(', ')}` });
  }

  // Calculate
  let calc;
  if (tierId === 'squareFootage') {
    if (!squareFeet || squareFeet < 100) {
      return res.status(400).json({ error: '"squareFeet" is required and must be ≥ 100 for squareFootage tier' });
    }
    calc = calculateSquareFootageQuote(prices, area, squareFeet, addOns);
  } else {
    if (!hours || hours < 1) {
      return res.status(400).json({ error: '"hours" is required and must be ≥ 1 for hourly tiers' });
    }
    calc = calculateHourlyQuote(prices, tier, area, hours, addOns);
  }

  // Add-on details for response
  const addOnsBreakdown = addOns.map(id => ({
    id,
    name: prices.addOns[id].name,
    price: prices.addOns[id].price
  }));

  // Discount
  let discount = null;
  let total = calc.subtotal;
  if (discountId) {
    const d = prices.discounts[discountId];
    if (!d) {
      return res.status(400).json({ error: `Unknown discount: "${discountId}"` });
    }
    const discountAmount = calc.subtotal * (d.percentOff / 100);
    total = calc.subtotal - discountAmount;
    discount = {
      id: discountId,
      name: d.name,
      percentOff: d.percentOff,
      discountAmount: +discountAmount.toFixed(2)
    };
  }

  // Log the quote
  logQuote({
    zipCode,
    tierId,
    hours: calc.hours || null,
    addOns,
    discountId: discountId || null,
    subtotal: calc.subtotal,
    total,
    source: source || 'api'
  });

  // Build response
  const response = {
    serviceArea: {
      name: area.name,
      status: area.status
    },
    serviceTier: {
      id: tierId,
      name: tier.name
    },
    calculation: calc,
    addOns: addOnsBreakdown,
    discount,
    subtotal: +calc.subtotal.toFixed(2),
    total: +total.toFixed(2),
    currency: prices.currency
  };

  res.json(response);
});

module.exports = router;
