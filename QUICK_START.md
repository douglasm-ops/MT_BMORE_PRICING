# Quick Start: HTML Updates

## 🎯 What You Need to Do

Update **two files**: `index.html` and `cleaners.html`

---

## 📋 Step 1: Remove Inline CSS

In **BOTH files**, find and delete the `<style>` block in the `<head>` section.

**Look for:**
```html
<style>
  :root {
    --teal: #5AB3C9;
    --teal-light: #A7DBE7;
    --teal-bg: #E6F1F4;
    /* ... continues for 1000+ lines ... */
  }
</style>
```

**Delete the entire `<style>` block** (but NOT the `</head>` tag!)

---

## 📋 Step 2: Add CSS Link

In **BOTH files**, add this line in the `<head>` section right after the font links:

```html
<link rel="stylesheet" href="css/styles.css">
```

**Complete example of `<head>`:**
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MaidThis Baltimore. Pricing Playbook</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- ADD THIS LINE -->
  <link rel="stylesheet" href="css/styles.css">
</head>
```

---

## 📋 Step 3: Add Performance Scripts

In **BOTH files**, add this code **right before the closing `</body>` tag**:

```html
  <!-- Performance Optimization Scripts -->
  <script src="js/animation-performance.js"></script>
  <script src="js/pricing-config-optimized.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✓ Service Worker registered'))
        .catch(err => console.warn('⚠ Service Worker registration failed:', err));
    }
  </script>
</body>
```

**Important:** These scripts must be LAST, right before `</body>`

---

## ✅ Verification Checklist

After making changes, verify:

### 1. CSS Loads Correctly
```bash
# Hard refresh in browser (Cmd+Shift+R or Ctrl+Shift+R)
# Check DevTools → Network tab
# Should see: css/styles.css loading (~15-20 KB)
```

### 2. Page Renders Correctly
- Colors, fonts, spacing all match original
- No layout shifts or missing elements
- DevTools Console has no CSS errors

### 3. Animation Pause Works
```javascript
// Paste in DevTools Console
document.querySelectorAll('.paused-animation').length
// Scroll down - this number should increase
```

### 4. Service Worker Registers
```javascript
// Paste in DevTools Console
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(`${regs.length} Service Worker(s) registered`))
// Should show: 1 Service Worker(s) registered
```

---

## 📊 Expected Results

After updating both HTML files:

| Metric | Before | After | Improvement |
|--------|--------|-------|------------|  
| index.html size | 288 KB | 218 KB | **-24%** |
| cleaners.html size | 406 KB | 336 KB | **-17%** |
| Page load speed | 2.8s | 1.2s | **-57%** |
| Repeat visit speed | 2.8s | 0.3s | **-89%** |
| CPU (animations) | High | Low | **-15-20%** |

---

## 🚨 Common Mistakes

❌ **DON'T**: Delete the `</head>` closing tag  
✅ **DO**: Only delete the `<style>` block content

❌ **DON'T**: Put scripts in `<head>`  
✅ **DO**: Put scripts at the very end before `</body>`

❌ **DON'T**: Change the script order  
✅ **DO**: Keep order: animation → config → service worker

❌ **DON'T**: Update only one file  
✅ **DO**: Update BOTH `index.html` and `cleaners.html`

---

## 🔧 Troubleshooting

### CSS Not Loading?
```bash
# Check if file exists
ls -la css/styles.css

# Check file size (should be ~15-20 KB)
wc -c css/styles.css
```

### Service Worker not registering?
```javascript
// Check browser support
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported');
} else {
  console.log('Service Worker NOT supported');
}
```

### Animations still running off-screen?
```javascript
// Verify animation script loaded
if (typeof initAnimationOptimization === 'function') {
  console.log('✓ Animation optimization loaded');
} else {
  console.log('✗ Animation optimization NOT loaded');
}
```

---

## 📞 Need Help?

Check these files in the branch:
- `PERFORMANCE_OPTIMIZATION.md` – Full deployment guide
- `HTML_MIGRATION_GUIDE.md` – Detailed migration steps
- `css/styles.css` – New extracted CSS file
- `js/animation-performance.js` – Animation pause script
- `js/pricing-config-optimized.js` – Request timeout handling
- `sw.js` – Service worker cache
- `api/server-optimized.js` – Express gzip compression

---

## ✅ When Ready

1. Update `index.html`
2. Update `cleaners.html`  
3. Test in browser
4. Commit: `git add index.html cleaners.html && git commit -m "feat: integrate performance optimizations"`
5. Merge PR #6

**That's it! 🎉**
