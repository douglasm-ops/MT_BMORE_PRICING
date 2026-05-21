/**
 * Quote Logger — SQLite via better-sqlite3
 * Logs every quote request for analytics and review.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'quotes.db');

// Ensure directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS quote_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          DATETIME DEFAULT (datetime('now')),
    zip_code    TEXT,
    tier_id     TEXT,
    hours       REAL,
    add_ons     TEXT,
    discount_id TEXT,
    subtotal    REAL,
    total       REAL,
    source      TEXT
  );
`);

const insertStmt = db.prepare(`
  INSERT INTO quote_log (zip_code, tier_id, hours, add_ons, discount_id, subtotal, total, source)
  VALUES (@zipCode, @tierId, @hours, @addOns, @discountId, @subtotal, @total, @source)
`);

/**
 * Log a quote request.
 * @param {object} data
 */
function logQuote(data) {
  try {
    insertStmt.run({
      zipCode:    data.zipCode    || null,
      tierId:     data.tierId     || null,
      hours:      data.hours      || null,
      addOns:     JSON.stringify(data.addOns || []),
      discountId: data.discountId || null,
      subtotal:   data.subtotal   || null,
      total:      data.total      || null,
      source:     data.source     || 'api'
    });
  } catch (err) {
    // Logging is non-critical — never let it crash the request
    console.error('[LOGGER] Failed to log quote:', err.message);
  }
}

/**
 * Retrieve recent quote logs.
 * @param {number} limit - Max rows to return (default 100)
 */
function getRecentQuotes(limit = 100) {
  return db.prepare(`
    SELECT * FROM quote_log ORDER BY ts DESC LIMIT ?
  `).all(limit);
}

module.exports = { logQuote, getRecentQuotes };
