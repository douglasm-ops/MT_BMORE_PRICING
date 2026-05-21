/**
 * Basic smoke tests for the MaidThis Pricing API
 * Run: node api/tests/api.test.js
 * (requires the server to be running on PORT 3000)
 */

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const API_KEY = process.env.API_KEY || 'test-key';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}\n    → ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json() };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}

async function patch(path, body, key = API_KEY) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}

// ── Tests ───────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n🧪 MaidThis Pricing API — smoke tests\n');

  // Health
  await test('GET /api/health → 200', async () => {
    const { status, body } = await get('/api/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.status === 'ok', 'Expected status: ok');
  });

  // Prices
  await test('GET /api/prices → 200 with version', async () => {
    const { status, body } = await get('/api/prices');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.version, 'Missing version field');
    assert(body.serviceTiers, 'Missing serviceTiers');
  });

  await test('PATCH /api/prices without key → 401', async () => {
    const { status } = await patch('/api/prices', { path: 'serviceTiers.standard.baseHourlyRate', value: 55 }, 'wrong-key');
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // Service area
  await test('GET /api/service-area/21201 → Baltimore primary', async () => {
    const { status, body } = await get('/api/service-area/21201');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.inServiceArea === true, 'Expected inServiceArea: true');
    assert(body.area.status === 'primary', `Expected primary, got ${body.area.status}`);
  });

  await test('GET /api/service-area/99999 → out of area', async () => {
    const { status, body } = await get('/api/service-area/99999');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.inServiceArea === false, 'Expected inServiceArea: false');
  });

  await test('GET /api/service-area/bad → 400', async () => {
    const { status } = await get('/api/service-area/bad');
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // Quote
  await test('POST /api/quote — standard hourly', async () => {
    const { status, body } = await post('/api/quote', {
      zipCode: '21201',
      tierId: 'standard',
      hours: 3,
      source: 'test'
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(typeof body.total === 'number', 'Missing total');
    assert(body.total > 0, 'Total should be > 0');
  });

  await test('POST /api/quote — with add-ons and discount', async () => {
    const { status, body } = await post('/api/quote', {
      zipCode: '21201',
      tierId: 'deep',
      hours: 4,
      addOns: ['windowCleaning'],
      discountId: 'recurring',
      source: 'test'
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.discount !== null, 'Expected discount object');
    assert(body.total < body.subtotal, 'Total should be less than subtotal with discount');
  });

  await test('POST /api/quote — squareFootage tier', async () => {
    const { status, body } = await post('/api/quote', {
      zipCode: '21210',
      tierId: 'squareFootage',
      squareFeet: 2000,
      source: 'test'
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.total > 0, 'Total should be > 0');
  });

  await test('POST /api/quote — missing fields → 400', async () => {
    const { status } = await post('/api/quote', { tierId: 'standard' });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/quote — invalid tierId → 400', async () => {
    const { status } = await post('/api/quote', { zipCode: '21201', tierId: 'nope', hours: 2 });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // Summary
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
