# SeatRush validation report (2026-11-18)

## Completed offline static checks

- Reviewed and rewired the core seat holding and booking services to use PostgreSQL instead of an in-memory mirror.
- Inspected `backend` and `frontend` TypeScript/TSX files using the TypeScript syntax parser: no syntax parse errors.
- Checked relative TypeScript imports for missing targets: none found.
- Preserved original npm package-lock files because no third-party packages were added.
- Configured local dependency services and Vite-to-API frontend routing.

## NOT run in this environment

- `npm ci` could not complete (package registry unreachable/time-limited in this environment).
- Full TypeScript type checking and production builds require installing the existing npm dependencies.
- Actual PostgreSQL integration tests cannot run here because Docker, PostgreSQL, and Redis executables are unavailable.
- Browser tests, Redis/BullMQ worker tests, Stripe test events, multi-server Socket.IO tests, and cloud deployment are not performed.

## Run these locally before publishing the project as tested

1. `docker compose up -d` from the project root.
2. Copy `backend/.env.example` to `backend/.env`.
3. `cd backend && npm ci && npm run build && npm test`.
4. `cd frontend && npm ci && npm run build`.
5. Start the backend and frontend and manually test seat holds, expiration, booking retries and refresh/reconnect behavior.
6. Confirm that production `NODE_ENV=production` disables the destructive admin routes.
7. Only then deploy the frontend and API following `DEPLOYMENT_VERCEL.md`.

Do not claim the repository passed integration tests based on this report. It has only undergone static validation in this environment.
