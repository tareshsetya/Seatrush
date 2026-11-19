# SeatRush — PostgreSQL-backed ticket booking DEMO

A React + TypeScript, Node/Express and PostgreSQL portfolio project exploring concurrent seat holds and idempotent demo bookings. The main demo UI and event pages are retained from the original SeatRush repository.

**Start here: [SETUP_WINDOWS.md](SETUP_WINDOWS.md)** (Docker Desktop, PostgreSQL, Redis, BullMQ, Socket.IO) and [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) (Vercel frontend + hosted backend).

## Current working design

- Backend **requires PostgreSQL** at startup and seeds 9 fictional events (96 seats each) without wiping existing bookings.
- Seat holds use `SELECT ... FOR UPDATE` on sorted seat IDs inside a transaction. Expiration deadlines are recorded in the database; all availability and booking checks enforce those deadlines with the database clock.
- Booking creation locks each requested seat, verifies hold ownership, computes the 8% **demo** fee server-side, and saves the booking plus seat assignments atomically.
- The idempotency key is serialized with `pg_advisory_xact_lock` and backed by a unique database column and request fingerprint. Identical retries return the committed booking; different details with a reused key are rejected.
- Redis and BullMQ optionally schedule delayed cleanup; a periodic PostgreSQL sweep maintains safety if jobs are delayed or Redis is down.
- Socket.IO emits `SEATS_UPDATED` to event rooms on holds, releases, bookings and expiration. Socket fan-out is single-instance only.
- Admin destructive/benchmark routes work in local development only (`ENABLE_DEMO_ADMIN_TOOLS=true`), not when `NODE_ENV=production`.
- The frontend labels checkout as a demo and marks ticket references as **not valid for admission**. Stripe webhook route verifies signatures if credentials are configured but does not issue tickets: real payment orchestration is unfinished.

## Quick start (PowerShell)

```powershell
# Project root
 docker compose up -d
# Terminal 1
cd backend
Copy-Item .env.example .env
npm ci
npm run dev
# Terminal 2 (from project root)
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Backend health endpoint: http://localhost:4000/api/health.

To test with PostgreSQL running: `cd backend; npm test`.

## Technical honesty / known gaps

This is **not a deploy-and-sell-tickets production platform**. Login and user ID are demo-only and spoofable; real Stripe payment confirmation, payment/seat conflict recovery, QR validation, email sending, strong authorization, durable queue outbox, distributed socket adapter, waiting-room enforcement and external load testing are not complete. Do not store real private customer data.

The system intentionally has no in-memory booking fallback. Correctness beats a demo that appears to run while silently losing seats after a restart. The old unused in-memory demo data generator remains only to build seed fixtures.
