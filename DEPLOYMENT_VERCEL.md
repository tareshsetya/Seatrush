# SeatRush deployment guide: Vercel frontend + hosted Express backend

## Recommended first deployment

Deploy the **React frontend on Vercel** and **the Node/Express API on Render** (or Railway/Fly.io). Use a managed PostgreSQL instance; add managed Redis if you want BullMQ background jobs. This is one API instance, not a distributed high-availability system.

As of October 20, 2026, **Vercel Functions support WebSocket connections**, including Socket.IO. You can eventually move your backend onto Vercel, but the provided backend expects a persistent `http.Server`, a 15-second sweeper, and in-process BullMQ workers. It cannot simply be pointed at Vercel Functions without refactoring lifecycle/background jobs and cross-instance socket broadcasts. The simpler deployed arrangement is Vercel UI + always-running Node API.

Vercel announcement: https://vercel.com/changelog/websocket-support-is-now-generally-available
Vite guide: https://vercel.com/docs/frameworks/frontend/vite

## Step 1 — Host PostgreSQL and Redis

Obtain a PostgreSQL connection string from any supported managed PostgreSQL host. Store it as `DATABASE_URL` on the API host; **never** as a `VITE_` variable. Optionally obtain managed Redis TCP URL as `REDIS_URL`. The application **will not start** if PostgreSQL is unavailable. Redis is optional for correctness; when Redis is absent, a PostgreSQL expiry sweep still handles old holds.

This demo runs DDL migrations on startup and seeds fictional events. For a serious deployment, use managed migrations and controlled seed commands instead of automatic production seeding.

## Step 2 — Deploy backend on Render

1. Push the full project to your GitHub repository.
2. In Render, create a **Web Service** connected to that repository.
3. Set **Root Directory**: `backend`.
4. Set **Build Command**: `npm ci && npm run build`.
5. Set **Start Command**: `npm start`.
6. Set environment variables:

```text
NODE_ENV=production
DATABASE_URL=<managed PostgreSQL URL>
REDIS_URL=<optional managed Redis URL>
FRONTEND_URL=https://your-seatrush.vercel.app
HOLD_DURATION_SECONDS=600
DEMO_CHECKOUT_ENABLED=true
ENABLE_DEMO_ADMIN_TOOLS=false
```

`DEMO_CHECKOUT_ENABLED=true` allows **pretend bookings only**. No actual money moves. For a private backend without public demonstration checkout, set it to `false`.

7. Verify `https://YOUR-BACKEND.onrender.com/api/health` returns PostgreSQL `CONNECTED`.
8. For a public demo, avoid uploading personal information. There is no real login/authorization yet.

Render docs: https://render.com/docs/deploy-node-express-app

## Step 3 — Deploy frontend on Vercel

1. New Project → Import your GitHub repository.
2. Set **Root Directory** to `frontend` (important for this monorepo).
3. Framework Preset: Vite. Build command: `npm run build`; Output directory: `dist`.
4. Set the following **Vercel project environment variables**, using your API URL (no `/api`, no trailing slash):

```text
VITE_API_URL=https://YOUR-BACKEND.onrender.com
VITE_SOCKET_URL=https://YOUR-BACKEND.onrender.com
```

5. Deploy. The included `frontend/vercel.json` supports client-side routes if added later.
6. Update backend `FRONTEND_URL` to the real Vercel frontend origin. Redeploy the backend.
7. Confirm browser Network tab: REST requests use `https://YOUR-BACKEND.onrender.com/api/...` and Socket.IO connects to the backend origin.

## Before claiming production readiness

- Implement proper accounts, password hashing, authenticated sessions, and ownership checks (browser-local `userId` is NOT authentication).
- Complete Stripe test PaymentIntents + signed, durable, idempotent webhook fulfillment. Handle late successful payments, expired holds, recovery and refunds. Do not trust client-side “paid” signals.
- Use a robust booking/payment state machine and transactional outbox for cross-service events.
- Implement ticket signature/real QR validation, and a verified email delivery provider.
- Add distributed Socket.IO adapter for >1 backend instance, consistent rate limiting and queue admission, database migrations, secrets, monitoring, and tested recovery scenarios.
- Load-test externally using k6 and test multi-instance failures; an in-process benchmark isn't a production guarantee.

This project ships with an intentionally **single-instance** backend setup. Redis may be used for BullMQ, but it is NOT the authoritative owner of a seat.
