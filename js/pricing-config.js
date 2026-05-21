/**
 * Pricing Configuration Module
 * Loads pricing data from the backend API when available; falls back to static JSON.
 *
 * API endpoints used:
 *   GET /api/prices              — full pricing config
 *   POST /api/quote              — server-side quote with logging
 *   GET /api/service-area/:zip   — zip code lookup
 */

class PricingConfig {
  constructor() {
    this.prices = null;
    this.loaded = false;
    // Override this to point at your deployed API, e.g. https://api.maidthisbmore.com
    this.apiBase = window.PRICING_API_BASE || null;
  }

  /**
   * Load pricing configuration.
   * Tries the backend API first; falls back to ./config/prices.json if unavailable.
   */
  async load() {
    // 1. Try backend API
    if (this.apiBase) {
      try {
        const response = await fetch(`${this.apiBase}/api/prices`);
        if (response.ok) {
          this.prices = await response.json();
          this.loaded = true;
          console.log('✓ Pricing config loaded from API');
          return this.prices;
        }
      } catch (err) {
        console.warn('⚠ API unavailable, falling back to static config:', err.message);
      }
    }

    // 2. Fallback: static JSON
    try {
      const response = await fetch('./config/prices.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.prices = await response.json();
      this.loaded = true;
      console.log('✓ Pricing config loaded from static file');
      return this.prices;
    } catch (error) {
      console.error('✗ Failed to load pricing config:', error);
      throw error;
    }
  }

  /**
   * Calculate a quote via the backend API (with logging).
   * Falls back to local calculation if the API is unavailable.
   *
   * @param {object} params
   * @param {string} params.zipCode
   * @param {string} params.tierId
   * @param {number} [params.hours]
   * @param {number} [params.squareFeet]
   * @param {string[]} [params.addOns]
   * @param {string} [params.discountId]
   * @param {string} [params.source]
   * @returns {object} Quote result
   */
  async calculateQuoteRemote(params) {
    if (this.apiBase) {
      try {
        const response = await fetch(`${this.apiBase}/api/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('⚠ API quote failed, falling back to local calc:', err.message);
      }
    }
    // Local fallback
    return this.calculateQuote(params);
  }

  /**
   * Look up a zip code via the backend API.
   * Falls back to local lookup if the API is unavailable.
   *
   * @param {string} zipCode
   * @returns {object} Service area info
   */
  async lookupZip(zipCode) {
    if (this.apiBase) {
      try {
        const response = await fetch(`${this.apiBase}/api/service-area/${zipCode}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('⚠ API zip lookup failed, falling back to local:', err.message);
      }
    }
    // Local fallback
    const area = this.getServiceAreaByZip(zipCode);
    return {
      zip: zipCode,
      inServiceArea: area?.status !== 'tertiary',
      area
    };
  }

  // ── Local calculation methods (unchanged from v1) ─────────────────────────

  getServiceAreaByZip(zipCode) {
    if (!this.prices) return null;
    const areas = this.prices.serviceAreas;

    if (areas.baltimore.zipCodes.includes(zipCode)) return areas.baltimore;

    const isNeighboring = areas.neighboring.zipCodePrefixes.some(prefix =>
      zipCode.startsWith(prefix)
    );
    if (isNeighboring) return areas.neighboring;

    return areas.other;
  }

  getServiceTier(tierId) {
    if (!this.prices) return null;
    return this.prices.serviceTiers[tierId] || null;
  }

  calculateQuote(params) {
    if (!this.prices) return null;
    const { zipCode, tierId, hours, addOns = [] } = params;

    const area = this.getServiceAreaByZip(zipCode);
    if (!area) return null;

    const tier = this.getServiceTier(tierId);
    if (!tier) return null;

    const effectiveHours = Math.max(hours, tier.minimumHours);
    const baseCost = tier.baseHourlyRate * effectiveHours;
    const areaMarkup = (area.basePrice || 0) + (baseCost * (area.markup - 1));
    let subtotal = baseCost + areaMarkup;

    let addOnsCost = 0;
    const addOnsBreakdown = [];
    addOns.forEach(addonId => {
      const addon = this.prices.addOns[addonId];
      if (addon) {
        addOnsCost += addon.price;
        addOnsBreakdown.push({ name: addon.name, price: addon.price });
      }
    });
    subtotal += addOnsCost;

    return {
      serviceArea: area.name,
      serviceTier: tier.name,
      hours: effectiveHours,
      hourlyRate: tier.baseHourlyRate,
      baseCost,
      areaAdjustment: areaMarkup,
      addOns: addOnsBreakdown,
      addOnsCost,
      subtotal,
      total: subtotal,
      currency: this.prices.currency,
      breakdown: { labor: baseCost, areaFee: areaMarkup, addOns: addOnsCost }
    };
  }

  applyDiscount(subtotal, discountId) {
    if (!this.prices) return null;
    const discount = this.prices.discounts[discountId];
    if (!discount) return null;
    const discountAmount = subtotal * (discount.percentOff / 100);
    return {
      name: discount.name,
      description: discount.description,
      percentOff: discount.percentOff,
      discountAmount,
      subtotal,
      total: subtotal - discountAmount
    };
  }

  getAllServiceTiers()  { return this.prices ? Object.values(this.prices.serviceTiers) : []; }
  getAllAddOns()        { return this.prices ? this.prices.addOns : {}; }
  getAllDiscounts()     { return this.prices ? this.prices.discounts : {}; }

  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.prices?.currency || 'USD'
    }).format(price);
  }
}

// Create global instance
const pricingConfig = new PricingConfig();
