# SeatRush — Event discovery + real-time demo bookings

SeatRush is a React/TypeScript and Node/Express project with two **deliberately separate** flows:

1. **Discover real listings** using Ticketmaster Discovery API and TMDB. Live provider data requires your own API keys. External listings open the provider's site; **SeatRush cannot book their inventory.** TMDB supplies film details, **not live theatre showtimes or seats**.
2. **Try demo bookings** on the seeded SeatRush event inventory. PostgreSQL transactions hold and confirm demo seats; Redis/BullMQ handle background cleanup; Socket.IO updates the seat map.

The demo checkout **does not process payment**. Tickets are demo receipts and are not valid for entry to real events.

## Start locally (Windows / PowerShell)

Requirements: Node.js 20+, Docker Desktop with WSL 2, and npm.

```powershell
# From the SeatRush project root:
docker compose up -d
cd backend
Copy-Item .env.example .env     # only if you don't already have backend/.env
npm ci
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The backend listens at http://localhost:4000.

If you have an **existing** `backend/.env`, keep it and add:

```text
JWT_SECRET=<at least 32 cryptographically random characters>
TICKETMASTER_API_KEY=<your own API key; optional>
TMDB_API_KEY=<your own API key; optional>
```

You can generate a JWT secret in PowerShell using Node:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`backend/.env` is Git-ignored. Never commit private keys or passwords. The example `JWT_SECRET` is for **local development only**; replace it before deployment.

## What changed in this revision

- New editorial, light, responsive SeatRush UI (Tailwind + Lucide icons, custom styling) with city picker on first visit, city search, supported cities and browser location permission.
- Real accounts in PostgreSQL: registration/sign-in, scrypt password hashing, signed eight-hour HS256 JWT cookies, server-side authentication/role checks, logout invalidation, basic rate limiting and origin checks.
- Seat hold and booking routes no longer accept trusted user identity from JSON. History can only be read by its owner or an administrator.
- Ticketmaster event discovery and TMDB film listings via the Express API, with five-minute Redis caching. Providers are optional and require API keys.
- A redesigned seat plan, demo checkout, ticket receipt and account booking history.
- Demo admin metrics now require an `ADMIN` role.

## API credentials

Register for a Ticketmaster key: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

Register for a TMDB key: https://developer.themoviedb.org/docs/authentication-application

Add credentials to `backend/.env` and restart the backend. The browser receives *normalized event summaries*, never your API keys.

No provider data is invented when a key is missing. Coverage varies by city; Ticketmaster listings in India may be sparse. TMDB movie listings are country-wide even when you choose a city.

## Important limitations / before production

This is an improved **development demo**, not a production-certified ticket seller. Before using real customer data or collecting money, add email verification and password reset, stronger distributed account-abuse detection, a payment-intent/webhook/refund workflow, reliable email delivery, signed scannable QR verification, database migrations/backups, monitoring, real concurrency/crash tests, privacy/legal review, and a worker deployment strategy.

The Node application includes BullMQ workers **in the backend process**; a worker-only deployment/refactor is advisable at scale. With multiple API instances, configure the Socket.IO Redis adapter or another cross-instance event fanout mechanism. The built-in rate limiter is not sufficient for hostile internet traffic.

### Running tests

```powershell
cd backend
npm test
npm run build
cd ../frontend
npm run build
```

The concurrency tests need PostgreSQL running. The crypto tests validate password hashing and JWT signatures without a database. Verify them locally before deployment. See `VALIDATION_REPORT.md` for what was and wasn't checked while preparing this ZIP.
