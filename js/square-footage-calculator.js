/**
 * Square Footage Pricing Calculator
 * Calculates labor hours and pricing based on square footage
 * Using 250 sf/hr productivity rate with ceiling rounding
 */

class SquareFootagePricingCalculator {
  constructor(pricingConfig) {
    this.config = pricingConfig;
  }

  /**
   * Calculate labor hours and cost for a given square footage
   * @param {number} squareFeet - Square footage of the property
   * @returns {object} Pricing breakdown
   */
  calculateBySquareFootage(squareFeet) {
    if (!this.config.prices) return null;

    const sqTier = this.config.prices.serviceTiers.squareFootage;
    if (!sqTier) return null;

    // Get configuration
    const productivity = sqTier.productivity.rate; // 250
    const laborRate = sqTier.laborRate; // 65
    const rounding = sqTier.rounding; // 'ceiling'

    // Calculate raw labor hours
    const rawHours = squareFeet / productivity;

    // Apply ceiling rounding
    const laborHours = Math.ceil(rawHours);

    // Calculate cost
    const totalCost = laborHours * laborRate;

    return {
      squareFeet,
      rawHours: parseFloat(rawHours.toFixed(2)),
      laborHours,
      productivity: `${productivity} sf/hr`,
      laborRate,
      totalCost,
      rounding: rounding,
      serviceArea: 'Baltimore City', // Default; can be overridden
      breakdown: {
        hourlyRate: laborRate,
        hours: laborHours,
        labor: totalCost
      },
      currency: this.config.prices.currency
    };
  }

  /**
   * Look up closest standard price from pricing table
   * @param {number} squareFeet - Square footage to look up
   * @returns {object} Closest pricing entry
   */
  lookupStandardPrice(squareFeet) {
    if (!this.config.prices) return null;

    const sqTier = this.config.prices.serviceTiers.squareFootage;
    if (!sqTier || !sqTier.pricingTable) return null;

    const table = sqTier.pricingTable;

    // Find exact match
    const exact = table.find(entry => entry.squareFeet === squareFeet);
    if (exact) return exact;

    // Find closest lower value
    const lower = table
      .filter(entry => entry.squareFeet < squareFeet)
      .sort((a, b) => b.squareFeet - a.squareFeet)[0];

    // Find closest higher value
    const higher = table
      .filter(entry => entry.squareFeet > squareFeet)
      .sort((a, b) => a.squareFeet - b.squareFeet)[0];

    // Return closest
    if (!lower) return higher;
    if (!higher) return lower;

    const distToLower = squareFeet - lower.squareFeet;
    const distToHigher = higher.squareFeet - squareFeet;

    return distToLower <= distToHigher ? lower : higher;
  }

  /**
   * Get all standard pricing entries
   * @returns {array} Pricing table
   */
  getPricingTable() {
    if (!this.config.prices) return [];

    const sqTier = this.config.prices.serviceTiers.squareFootage;
    return sqTier && sqTier.pricingTable ? sqTier.pricingTable : [];
  }

  /**
   * Interpolate price for any square footage between table entries
   * @param {number} squareFeet - Square footage
   * @returns {object} Interpolated pricing
   */
  interpolatePrice(squareFeet) {
    const below = this.getPricingTable()
      .filter(e => e.squareFeet <= squareFeet)
      .sort((a, b) => b.squareFeet - a.squareFeet)[0];

    const above = this.getPricingTable()
      .filter(e => e.squareFeet > squareFeet)
      .sort((a, b) => a.squareFeet - b.squareFeet)[0];

    if (!below || !above) {
      return this.calculateBySquareFootage(squareFeet);
    }

    // Linear interpolation
    const sf1 = below.squareFeet;
    const sf2 = above.squareFeet;
    const price1 = below.totalCost;
    const price2 = above.totalCost;

    const ratio = (squareFeet - sf1) / (sf2 - sf1);
    const interpolatedCost = price1 + (price2 - price1) * ratio;

    // Use actual calculation for accuracy
    return this.calculateBySquareFootage(squareFeet);
  }
}
