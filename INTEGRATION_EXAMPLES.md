# Integration Examples

This document shows how to integrate the `PricingConfig` module into your HTML pages.

## 1. Index.html Integration (Pricing Playbook Page)

### Step 1: Add Script Reference

Add this before the closing `</body>` tag in `index.html`:

```html
<!-- Pricing Configuration Module -->
<script src="./js/pricing-config.js"></script>
```

### Step 2: Initialize Pricing Module

Add this script section before the closing `</body>` tag:

```html
<script>
  // Initialize pricing on page load
  document.addEventListener('DOMContentLoaded', async function() {
    try {
      await pricingConfig.load();
      console.log('✓ Pricing system ready');
    } catch (error) {
      console.error('✗ Pricing system failed to load:', error);
    }
  });
</script>
```

### Step 3: Use in Zip Code Checker

Replace the existing zip code checker logic with this:

```html
<script>
  // Handle zip code submission
  document.getElementById('zipCheckBtn').addEventListener('click', async function() {
    const zipInput = document.getElementById('zipInput');
    const zipCode = zipInput.value.trim();

    if (!zipCode || zipCode.length !== 5) {
      showZipError('Please enter a valid 5-digit zip code');
      return;
    }

    try {
      // Get service area
      const area = pricingConfig.getServiceAreaByZip(zipCode);
      showZipResult(area, zipCode);
    } catch (error) {
      console.error('Error checking zip code:', error);
      showZipError('Error processing zip code');
    }
  });

  function showZipResult(area, zipCode) {
    const resultContainer = document.querySelector('.zip-result');
    
    // Determine styling based on area
    let cardClass = 'zip-result-card';
    let icon = '✓';
    let headline = '';
    let detail = '';

    if (area.status === 'primary') {
      cardClass += ' success';
      headline = `✓ ${area.name}`;
      detail = `Great news! We service ${zipCode}. Standard pricing applies.`;
    } else if (area.status === 'secondary') {
      cardClass += ' warn';
      headline = `⚠ ${area.name}`;
      detail = `We service ${zipCode} with a ${Math.round((area.markup - 1) * 100)}% area fee. ${area.additionalNotice}`;
    } else {
      cardClass += ' info';
      headline = `❓ ${area.name}`;
      detail = `${zipCode} is outside our standard service area. ${area.additionalNotice}`;
    }

    resultContainer.innerHTML = `
      <div class="${cardClass}">
        <div class="zip-result-top">
          <div class="zip-result-status-icon">${icon}</div>
          <div>
            <div class="zip-result-headline">${headline}</div>
            <div class="zip-result-detail">${detail}</div>
          </div>
        </div>
      </div>
    `;
    resultContainer.classList.add('visible');
  }

  function showZipError(message) {
    const resultContainer = document.querySelector('.zip-result');
    resultContainer.innerHTML = `
      <div class="zip-result-card error">
        <div class="zip-result-top">
          <div class="zip-result-status-icon">✗</div>
          <div>
            <div class="zip-result-headline">Error</div>
            <div class="zip-result-detail">${message}</div>
          </div>
        </div>
      </div>
    `;
    resultContainer.classList.add('visible');
  }
</script>
```

### Step 4: Add Quote Calculator (Optional)

Add this function to handle quote requests:

```html
<script>
  // Example: Generate quote from discovery questions
  function generateQuote(selectedAnswers) {
    const quote = pricingConfig.calculateQuote({
      zipCode: selectedAnswers.zipCode || '21202',
      tierId: selectedAnswers.serviceType || 'standard',
      hours: selectedAnswers.hours || 3,
      addOns: selectedAnswers.selectedAddOns || []
    });

    if (!quote) {
      console.error('Failed to generate quote');
      return null;
    }

    // Format for display
    return {
      serviceArea: quote.serviceArea,
      serviceTier: quote.serviceTier,
      laborCost: pricingConfig.formatPrice(quote.breakdown.labor),
      areaFee: pricingConfig.formatPrice(quote.breakdown.areaFee),
      addOnsCost: pricingConfig.formatPrice(quote.breakdown.addOns),
      total: pricingConfig.formatPrice(quote.subtotal),
      breakdown: quote.breakdown
    };
  }

  // Display quote in UI
  function displayQuote(quote) {
    const quoteHtml = `
      <div class="quote-display">
        <h3>${quote.serviceTier}</h3>
        <p>Service Area: ${quote.serviceArea}</p>
        
        <div class="quote-breakdown">
          <div class="line-item">
            <span>Labor (3 hrs @ $45/hr)</span>
            <span>${quote.laborCost}</span>
          </div>
          <div class="line-item">
            <span>Area Fee</span>
            <span>${quote.areaFee}</span>
          </div>
          ${quote.addOnsCost !== '$0.00' ? `
            <div class="line-item">
              <span>Add-ons</span>
              <span>${quote.addOnsCost}</span>
            </div>
          ` : ''}
          <div class="line-item total">
            <span><strong>Total</strong></span>
            <span><strong>${quote.total}</strong></span>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('quoteContainer').innerHTML = quoteHtml;
  }
</script>
```

## 2. Cleaners.html Integration (Cleaner Roster Page)

### Step 1: Add Script Reference

Add this before the closing `</body>` tag in `cleaners.html`:

```html
<!-- Pricing Configuration Module -->
<script src="./js/pricing-config.js"></script>
```

### Step 2: Initialize and Use for Pricing Display

```html
<script>
  // Initialize pricing system
  document.addEventListener('DOMContentLoaded', async function() {
    try {
      await pricingConfig.load();
      
      // Populate service tier filters if applicable
      displayServiceTierOptions();
      console.log('✓ Pricing system ready on cleaners page');
    } catch (error) {
      console.error('✗ Failed to load pricing:', error);
    }
  });

  // Display service tier options in filter
  function displayServiceTierOptions() {
    const tiers = pricingConfig.getAllServiceTiers();
    const filterContainer = document.querySelector('.filter-pills');
    
    // Assuming you want to add pricing info to existing filters
    tiers.forEach(tier => {
      const tierInfo = `${tier.name} ($${tier.baseHourlyRate}/hr)`;
      console.log('Available tier:', tierInfo);
    });
  }
</script>
```

## 3. Standalone Quote Generator Example

Create a `quote-generator.html` with this complete example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Generator</title>
  <style>
    body { font-family: 'Montserrat', sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 600; }
    input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #5AB3C9; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #2C3E50; }
    .quote-result { margin-top: 30px; padding: 20px; background: #f7fafb; border-radius: 8px; }
    .line-item { display: flex; justify-content: space-between; padding: 8px 0; }
    .line-item.total { border-top: 2px solid #333; margin-top: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Quote Calculator</h1>
  
  <form id="quoteForm">
    <div class="form-group">
      <label for="zipCode">Zip Code:</label>
      <input type="text" id="zipCode" placeholder="21202" maxlength="5" required>
    </div>

    <div class="form-group">
      <label for="serviceType">Service Type:</label>
      <select id="serviceType" required>
        <option value="">-- Select Service --</option>
        <option value="standard">Standard Cleaning ($45/hr)</option>
        <option value="deep">Deep Cleaning ($55/hr)</option>
        <option value="moveOut">Move-Out Cleaning ($60/hr)</option>
      </select>
    </div>

    <div class="form-group">
      <label for="hours">Hours:</label>
      <input type="number" id="hours" min="1" max="8" value="2" required>
    </div>

    <div class="form-group">
      <label>Add-ons:</label>
      <div style="margin-top: 10px;">
        <label><input type="checkbox" name="addons" value="windowCleaning"> Window Cleaning (+$35)</label>
        <label><input type="checkbox" name="addons" value="blindsCleaning"> Blinds Cleaning (+$25)</label>
        <label><input type="checkbox" name="addons" value="carpetShampoo"> Carpet Shampooing (+$15)</label>
        <label><input type="checkbox" name="addons" value="groutCleaning"> Grout Cleaning (+$50)</label>
        <label><input type="checkbox" name="addons" value="ovenCleaning"> Oven Cleaning (+$40)</label>
      </div>
    </div>

    <div class="form-group">
      <label for="discount">Discount Code:</label>
      <select id="discount">
        <option value="">-- No Discount --</option>
        <option value="recurring">Recurring Service (10% off)</option>
        <option value="referral">Referral (15% off)</option>
        <option value="firstTime">First Time Customer (10% off)</option>
      </select>
    </div>

    <button type="submit">Generate Quote</button>
  </form>

  <div id="quoteResult" class="quote-result" style="display: none;"></div>

  <script src="./js/pricing-config.js"></script>
  <script>
    // Initialize
    document.addEventListener('DOMContentLoaded', async function() {
      await pricingConfig.load();
    });

    // Handle form submission
    document.getElementById('quoteForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const zipCode = document.getElementById('zipCode').value;
      const serviceType = document.getElementById('serviceType').value;
      const hours = parseFloat(document.getElementById('hours').value);
      const discountCode = document.getElementById('discount').value;

      // Get selected add-ons
      const addOns = Array.from(document.querySelectorAll('input[name="addons"]:checked'))
        .map(cb => cb.value);

      // Calculate quote
      const quote = pricingConfig.calculateQuote({
        zipCode,
        tierId: serviceType,
        hours,
        addOns
      });

      if (!quote) {
        alert('Unable to calculate quote. Please check your inputs.');
        return;
      }

      // Apply discount if selected
      let finalQuote = quote;
      let discountInfo = null;

      if (discountCode) {
        discountInfo = pricingConfig.applyDiscount(quote.subtotal, discountCode);
      }

      // Display result
      displayQuote(quote, discountInfo);
    });

    function displayQuote(quote, discount) {
      const resultDiv = document.getElementById('quoteResult');

      let html = `
        <h2>Quote Summary</h2>
        <p><strong>Service:</strong> ${quote.serviceTier}</p>
        <p><strong>Area:</strong> ${quote.serviceArea}</p>
        <p><strong>Duration:</strong> ${quote.hours} hours</p>

        <div style="margin-top: 20px;">
          <h3>Breakdown:</h3>
      `;

      html += `
          <div class="line-item">
            <span>Labor (${quote.hours} hrs × $${quote.hourlyRate}/hr)</span>
            <span>${pricingConfig.formatPrice(quote.breakdown.labor)}</span>
          </div>
      `;

      if (quote.breakdown.areaFee > 0) {
        html += `
          <div class="line-item">
            <span>Area Fee</span>
            <span>${pricingConfig.formatPrice(quote.breakdown.areaFee)}</span>
          </div>
        `;
      }

      if (quote.addOns.length > 0) {
        html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">`;
        quote.addOns.forEach(addon => {
          html += `
            <div class="line-item">
              <span>${addon.name}</span>
              <span>${pricingConfig.formatPrice(addon.price)}</span>
            </div>
          `;
        });
        html += `</div>`;
      }

      // Subtotal
      html += `
          <div class="line-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <span>Subtotal</span>
            <span>${pricingConfig.formatPrice(quote.subtotal)}</span>
          </div>
      `;

      // Discount if applied
      if (discount) {
        html += `
          <div class="line-item" style="color: #7CCA5B;">
            <span>${discount.name} (-${discount.percentOff}%)</span>
            <span>-${pricingConfig.formatPrice(discount.discountAmount)}</span>
          </div>
          <div class="line-item total">
            <span>Total</span>
            <span>${pricingConfig.formatPrice(discount.total)}</span>
          </div>
        `;
      } else {
        html += `
          <div class="line-item total">
            <span>Total</span>
            <span>${pricingConfig.formatPrice(quote.subtotal)}</span>
          </div>
        `;
      }

      html += `
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #7A8A9E;">
          Prices exclude applicable sales tax. Payment due upon service completion.
        </p>
      `;

      resultDiv.innerHTML = html;
      resultDiv.style.display = 'block';
    }
  </script>
</body>
</html>
```

## 4. Testing the Integration

### Console Testing

Open browser DevTools (F12) and run:

```javascript
// Test 1: Load pricing
await pricingConfig.load();

// Test 2: Get service area
pricingConfig.getServiceAreaByZip('21202');
// Returns: {name: "Baltimore City", status: "primary", ...}

// Test 3: Calculate quote
const quote = pricingConfig.calculateQuote({
  zipCode: '21202',
  tierId: 'standard',
  hours: 3,
  addOns: ['windowCleaning', 'blindsCleaning']
});
console.log(quote);

// Test 4: Format price
pricingConfig.formatPrice(quote.subtotal);
// Returns: "$330.00"

// Test 5: Apply discount
const discounted = pricingConfig.applyDiscount(quote.subtotal, 'recurring');
console.log(discounted);
```

## 5. HTML Updates Checklist

- [ ] Add pricing-config.js script tag to index.html
- [ ] Add pricing-config.js script tag to cleaners.html
- [ ] Initialize pricingConfig.load() in DOMContentLoaded event
- [ ] Replace hardcoded zip code logic with getServiceAreaByZip()
- [ ] Replace hardcoded quote calculations with calculateQuote()
- [ ] Update pricing display to use formatPrice()
- [ ] Test all service areas (Baltimore, Neighboring, Other)
- [ ] Test all service tiers (Standard, Deep, Move-Out)
- [ ] Test add-ons combinations
- [ ] Test discount application
- [ ] Verify responsive behavior on mobile

## 6. Troubleshooting

### "Cannot find pricing-config.js"
- Verify the script path is correct: `./js/pricing-config.js`
- Ensure the file is in the correct directory
- Check browser console for CORS errors

### "prices.json not found"
- Ensure `config/prices.json` exists
- Verify the path in pricing-config.js load() method
- Check that the JSON file is valid JSON

### Quote calculations are wrong
- Verify zip code is in the correct format (5 digits)
- Check that service tier ID matches: 'standard', 'deep', or 'moveOut'
- Ensure add-on IDs match exactly: 'windowCleaning', 'blindsCleaning', etc.

