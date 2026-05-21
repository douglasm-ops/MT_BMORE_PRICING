/**
 * MaidThis Baltimore — Pricing API Server
 * Node/Express backend for quote generation, pricing config, and service area lookup
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const pricesRouter = require('./routes/prices');
const quoteRouter = require('./routes/quote');
const serviceAreaRouter = require('./routes/service-area');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*'
}));
app.use(express.json());

// Request logger (lightweight)
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/prices', pricesRouter);
app.use('/api/quote', quoteRouter);
app.use('/api/service-area', serviceAreaRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ MaidThis Pricing API running on port ${PORT}`);
});

module.exports = app;
