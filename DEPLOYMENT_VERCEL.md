# Deployment: Vercel React frontend + hosted Node backend

Recommended: **Vercel for `frontend/`**, Railway/Render/Fly for the persistent **Express + Socket.IO API**, and hosted PostgreSQL + Redis. The current code runs BullMQ in the API process; for reliability at scale split it into an independently supervised worker.

## Backend environment variables

```text
NODE_ENV=production
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<generate 48 random bytes or longer>
AUTH_COOKIE_SAMESITE=none
DEMO_CHECKOUT_ENABLED=true
ENABLE_DEMO_ADMIN_TOOLS=false
TICKETMASTER_API_KEY=<optional>
TMDB_API_KEY=<optional>
```

Never put the values of `JWT_SECRET`, `TICKETMASTER_API_KEY`, `TMDB_API_KEY`, `DATABASE_URL` or `REDIS_URL` into Vercel `VITE_` variables. `VITE_` variables become public browser code.

Use HTTPS on both domains. `SameSite=None; Secure; HttpOnly` is required for the auth cookie if Vercel and API are on separate **cross-site** domains. Third-party cookie restrictions in some browsers may still prevent login on separate sites. The robust long-term arrangement is `app.yourdomain.com` and `api.yourdomain.com` with a same-site cookie or an API reverse proxy on your app's domain.

For Render: root directory `backend`, build `npm ci && npm run build`, start `npm start`. Run the database using a managed PostgreSQL connection string (do not expose port 5432 publicly). The backend calls schema DDL and seeds demo events at startup; move those tasks into explicit migrations/seed commands before a serious production deployment.

## Vercel frontend

Import your existing SeatRush GitHub repository. Set **Root Directory** to `frontend`, framework `Vite`, build `npm run build`, output `dist`. Set:

```text
VITE_API_URL=https://YOUR-BACKEND.example.com
VITE_SOCKET_URL=https://YOUR-BACKEND.example.com
```

After deploying, set `FRONTEND_URL` on the backend to the exact Vercel URL (or a comma-separated list of allowed preview origins, if needed). Verify GET `/api/health`, registration, session cookie, booking ownership, and Socket.IO on the deployed sites.

## Payment / security limitations

The checkout currently deliberately issues **demo bookings without payment**. Stripe webhook verification exists, but no real payment-intent checkout or ticket fulfillment integration is implemented. Do not claim real ticket sales, verified payments, guaranteed load capacity, or production readiness until these have been built and tested.

## Helpful docs

- Vercel Vite: https://vercel.com/docs/frameworks/frontend/vite
- Ticketmaster Discovery: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- TMDB: https://developer.themoviedb.org/docs/authentication-application
