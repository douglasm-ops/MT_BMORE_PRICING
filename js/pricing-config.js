/**
 * Pricing Configuration Module
 * Centralized pricing data loader and price calculator
 */

class PricingConfig {
  constructor() {
    this.prices = null;
    this.loaded = false;
  }

  /**
   * Load pricing configuration from JSON file
   */
  async load() {
    try {
      const response = await fetch('./config/prices.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.prices = await response.json();
      this.loaded = true;
      console.log('✓ Pricing config loaded successfully');
      return this.prices;
    } catch (error) {
      console.error('✗ Failed to load pricing config:', error);
      throw error;
    }
  }

  /**
   * Get service area info by zip code
   * @param {string} zipCode - Zip code to check
   * @returns {object} Service area info or null
   */
  getServiceAreaByZip(zipCode) {
    if (!this.prices) return null;

    const areas = this.prices.serviceAreas;

    // Check Baltimore
    if (areas.baltimore.zipCodes.includes(zipCode)) {
      return areas.baltimore;
    }

    // Check Neighboring
    const isNeighboring = areas.neighboring.zipCodePrefixes.some(prefix =>
      zipCode.startsWith(prefix)
    );
    if (isNeighboring) {
      return areas.neighboring;
    }

    // Default to Other
    return areas.other;
  }

  /**
   * Get service tier pricing
   * @param {string} tierId - Service tier ID (standard, deep, moveOut)
   * @returns {object} Tier pricing info
   */
  getServiceTier(tierId) {
    if (!this.prices) return null;
    return this.prices.serviceTiers[tierId] || null;
  }

  /**
   * Calculate quote for a service
   * @param {object} params - Calculation parameters
   * @param {string} params.zipCode - Customer zip code
   * @param {string} params.tierId - Service tier ID
   * @param {number} params.hours - Number of hours
   * @param {array} params.addOns - Array of add-on IDs
   * @returns {object} Quote breakdown
   */
  calculateQuote(params) {
    if (!this.prices) return null;

    const { zipCode, tierId, hours, addOns = [] } = params;

    // Get service area
    const area = this.getServiceAreaByZip(zipCode);
    if (!area) return null;

    // Get tier
    const tier = this.getServiceTier(tierId);
    if (!tier) return null;

    // Base calculation
    const effectiveHours = Math.max(hours, tier.minimumHours);
    const baseCost = tier.baseHourlyRate * effectiveHours;
    const areaMarkup = (area.basePrice || 0) + (baseCost * (area.markup - 1));
    let subtotal = baseCost + areaMarkup;

    // Add add-ons
    let addOnsCost = 0;
    const addOnsBreakdown = [];
    addOns.forEach(addonId => {
      const addon = this.prices.addOns[addonId];
      if (addon) {
        addOnsCost += addon.price;
        addOnsBreakdown.push({
          name: addon.name,
          price: addon.price
        });
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
      currency: this.prices.currency,
      breakdown: {
        labor: baseCost,
        areaFee: areaMarkup,
        addOns: addOnsCost
      }
    };
  }

  /**
   * Apply discount to quote
   * @param {number} subtotal - Quote subtotal
   * @param {string} discountId - Discount ID
   * @returns {object} Discount info
   */
  applyDiscount(subtotal, discountId) {
    if (!this.prices) return null;

    const discount = this.prices.discounts[discountId];
    if (!discount) return null;

    const discountAmount = subtotal * (discount.percentOff / 100);
    const total = subtotal - discountAmount;

    return {
      name: discount.name,
      description: discount.description,
      percentOff: discount.percentOff,
      discountAmount,
      subtotal,
      total
    };
  }

  /**
   * Get all service tiers
   * @returns {array} Array of service tiers
   */
  getAllServiceTiers() {
    if (!this.prices) return [];
    return Object.values(this.prices.serviceTiers);
  }

  /**
   * Get all add-ons
   * @returns {object} Add-ons object
   */
  getAllAddOns() {
    if (!this.prices) return {};
    return this.prices.addOns;
  }

  /**
   * Get all discounts
   * @returns {object} Discounts object
   */
  getAllDiscounts() {
    if (!this.prices) return {};
    return this.prices.discounts;
  }

  /**
   * Format price for display
   * @param {number} price - Price to format
   * @returns {string} Formatted price string
   */
  formatPrice(price) {
    if (!this.prices) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.prices.currency
    }).format(price);
  }
}

// Create global instance
const pricingConfig = new PricingConfig();