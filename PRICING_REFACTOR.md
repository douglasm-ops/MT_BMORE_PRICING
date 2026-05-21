# Pricing Refactor Documentation

## Overview

This refactor centralizes all pricing logic into a maintainable, data-driven system. Instead of hardcoding prices throughout the HTML/JavaScript, all pricing is now managed in a single JSON configuration file.

## Architecture

```
project/
├── config/
│   └── prices.json          # Centralized pricing data
├── js/
│   ├── pricing-config.js    # Core pricing module
│   └── pricing-utils.js     # Helper functions (zip validation, formatting)
├── index.html               # Updated with pricing module
└── cleaners.html            # Updated with pricing module
```

## File Descriptions

### `config/prices.json`
Centralized pricing configuration containing:
- **Service Areas**: Baltimore, Neighboring Counties, Other Areas with zip code mappings
- **Service Tiers**: Standard, Deep Clean, Move-Out with hourly rates
- **Add-ons**: Optional services with pricing
- **Discounts**: Recurring, Referral, First-time customer discounts
- **Notes**: Tax info, payment terms

**Key Benefits:**
- Single source of truth for all pricing
- Easy to update: change JSON, no code changes needed
- Version control friendly: track pricing history via git
- Easy A/B testing: swap different price configs

### `js/pricing-config.js`
Main pricing module providing:
- `load()` - Fetch pricing JSON asynchronously
- `getServiceAreaByZip(zip)` - Look up service area by zip code
- `getServiceTier(tierId)` - Get tier details
- `calculateQuote(params)` - Calculate complete quote with breakdown
- `applyDiscount(subtotal, discountId)` - Apply discount codes
- `formatPrice(amount)` - Currency formatting

**Usage Example:**
```javascript
// Initialize
await pricingConfig.load();

// Calculate quote
const quote = pricingConfig.calculateQuote({
  zipCode: '21202',
  tierId: 'standard',
  hours: 3,
  addOns: ['windowCleaning', 'blindsCleaning']
});

console.log(pricingConfig.formatPrice(quote.subtotal));
// Output: $330.00
```

## Migration Guide

### Before (Hardcoded)
```javascript
// Scattered throughout HTML/JS
if (zipCode === '21202') {
  const price = 45 * hours; // Hidden logic
}
```

### After (Centralized)
```javascript
// Single place to calculate
const quote = pricingConfig.calculateQuote({
  zipCode: '21202',
  tierId: 'standard',
  hours: 3
});
```

## Updating Prices

### Simple Price Change
Edit `config/prices.json`:
```json
{
  "serviceTiers": {
    "standard": {
      "baseHourlyRate": 50  // Was 45
    }
  }
}
```

No code changes needed. All calculations automatically use the new price.

### Add New Service Area
```json
{
  "serviceAreas": {
    "newArea": {
      "name": "New Service Area",
      "zipCodePrefixes": ["30000", "30001"],
      "basePrice": 35,
      "markup": 1.20
    }
  }
}
```

### Add New Add-on
```json
{
  "addOns": {
    "postCleaning": {
      "name": "Post-Construction Cleanup",
      "price": 75,
      "unit": "project"
    }
  }
}
```

## Integration Checklist

- [ ] Add `<script src="js/pricing-config.js"></script>` to index.html
- [ ] Add `<script src="js/pricing-config.js"></script>` to cleaners.html
- [ ] Initialize pricing module: `await pricingConfig.load();`
- [ ] Replace hardcoded price lookups with `pricingConfig.calculateQuote()`
- [ ] Replace hardcoded discounts with `pricingConfig.applyDiscount()`
- [ ] Test zip code validation with test cases
- [ ] Test quote calculations with known values
- [ ] Deploy and monitor for accuracy

## Testing

### Example Test Cases
```javascript
// Test Baltimore area
const baltimore = pricingConfig.getServiceAreaByZip('21202');
assert.equal(baltimore.name, 'Baltimore City');

// Test neighboring area
const neighboring = pricingConfig.getServiceAreaByZip('20730');
assert.equal(neighboring.name, 'Neighboring Counties');

// Test quote calculation
const quote = pricingConfig.calculateQuote({
  zipCode: '21202',
  tierId: 'standard',
  hours: 2
});
assert.equal(quote.baseCost, 90); // 45 * 2
```

## Future Enhancements

- [ ] Add seasonal pricing adjustments
- [ ] Implement package deals (e.g., "3 months prepay = 15% off")
- [ ] Add time-of-day multipliers (rush hour premiums)
- [ ] Integrate with backend pricing API
- [ ] Add price history tracking
- [ ] Implement A/B testing framework

## Support

For questions about pricing calculations, check the JSDoc comments in `pricing-config.js`.