# MaidThis Baltimore — Backend API

A lightweight Node/Express API that sits behind the pricing playbook pages. It serves the pricing config server-side, calculates quotes with full logging, and lets you update rates without a code deploy.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | None | Health check |
| `GET` | `/api/prices` | None | Full pricing config (JSON) |
| `PATCH` | `/api/prices` | API key | Update a pricing field live |
| `POST` | `/api/quote` | None | Calculate a quote + log it |
| `GET` | `/api/service-area/:zip` | None | Zip code service area lookup |

## Local Development

```bash
cd api
npm install
cp .env.example .env    # fill in API_KEY
npm run dev             # starts with nodemon on port 3000
```

## Test

```bash
# With server running in another terminal:
npm test
```

## Deploying to Railway (recommended)

1. Create a new Railway project
2. Connect this GitHub repo
3. Set root directory to `api/`
4. Add environment variables from `.env.example`
5. Railway auto-detects Node and runs `npm start`

**Free tier covers ~$5/mo usage** — more than enough for this workload.

## PATCH /api/prices — Live Rate Updates

Update any pricing field without a code deploy:

```bash
# Change standard hourly rate from $55 → $60
curl -X PATCH https://your-api.railway.app/api/prices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"path": "serviceTiers.standard.baseHourlyRate", "value": 60}'

# Enable a new add-on price
curl -X PATCH https://your-api.railway.app/api/prices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"path": "addOns.ovenCleaning.price", "value": 45}'
```

## POST /api/quote — Server-Side Quote with Logging

Every quote is logged to SQLite (`api/db/quotes.db`) with zip, tier, hours, add-ons, and totals.

```bash
curl -X POST https://your-api.railway.app/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "21201",
    "tierId": "standard",
    "hours": 3,
    "addOns": ["windowCleaning"],
    "discountId": "recurring",
    "source": "playbook"
  }'
```

## Connecting the Frontend

In `index.html`, set the API base URL before loading `pricing-config.js`:

```html
<script>
  window.PRICING_API_BASE = 'https://your-api.railway.app';
</script>
<script src="./js/pricing-config.js"></script>
```

The client falls back to `./config/prices.json` automatically if the API is unreachable.
