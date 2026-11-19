# SeatRush — Windows 10/11 setup (VS Code / PowerShell)

## 1. Install the prerequisites

- Node.js LTS (Node 20 or 22 is supported): https://nodejs.org/en/download
- Git: https://git-scm.com/downloads/win
- Docker Desktop (WSL2 engine): https://docs.docker.com/desktop/setup/install/windows-install/

Open PowerShell **as Administrator** and run `wsl --install` if Windows does not already have WSL 2. Reboot if Windows asks. Install and open Docker Desktop, enable its WSL2 backend, then wait for the engine to be ready.

No separate Windows PostgreSQL or Redis installers are needed: Docker Compose downloads and runs both services. **Socket.IO and BullMQ are Node packages; npm installs them**—they are not Windows servers.

## 2. Unzip and open the project folder

Unzip `SeatRush_Improved_Full_Project.zip`. Open the `Seatrush-main` directory (which contains `docker-compose.yml`) in VS Code. Use Terminal → New Terminal (PowerShell).

## 3. Start PostgreSQL and Redis

```powershell
docker --version
docker compose version
docker compose up -d
docker compose ps
```

Expected: containers for `postgres` and `redis`, both healthy. Default local ports: PostgreSQL 5432, Redis 6379. The Compose file binds only to localhost, so the database is not publicly exposed.

Sanity checks:

```powershell
docker compose exec postgres pg_isready -U seatrush -d seatrush_db
docker compose exec redis redis-cli ping
```

Redis must respond `PONG`. PostgreSQL should say it is accepting connections. If port 5432 or 6379 is already in use, stop the existing service or update both `docker-compose.yml` and `backend/.env` consistently.

## 4. Install and start the backend

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run dev
```

You should see `PostgreSQL connected` and `SeatRush API on http://localhost:4000`. First start creates the schema and inserts nine **fictional demo events** with 96 seats each. Subsequent restarts preserve existing bookings.

Test by opening http://localhost:4000/api/health in a browser. If startup says `DATABASE_URL is required`, confirm that `backend/.env` exists and you ran `npm run dev` in the `backend` directory.

## 5. Start the frontend (a second terminal)

```powershell
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` and `/socket.io` to port 4000 during local development.

## 6. Understand which services are installed

| Component | Where it runs | What it does |
|---|---|---|
| PostgreSQL 16 | Docker container | Authoritative seat holds, expiry deadlines, confirmed bookings, idempotency |
| Redis 7 | Docker container | BullMQ's queue storage; optional for booking correctness |
| BullMQ | Backend npm dependency | Delayed seat-expiry cleanup and simulated ticket notification jobs |
| Socket.IO | Backend + frontend npm dependencies | Live seat change notifications to connected clients |
| Express + Node.js | Backend process | REST API and WebSocket server |
| React + Vite | Frontend process | UI |

`npm ci` reads the included package lockfiles and installs the BullMQ and Socket.IO libraries automatically. You do not run `npm install bullmq` separately.

## 7. Run tests (third terminal; requires Docker database)

```powershell
cd backend
npm test
npm run build
cd ../frontend
npm run build
```

The integration test runs actual PostgreSQL transactions against demo seats, checking 25-user contention, multi-seat rollback, expiry recovery, and concurrent idempotency. It needs `DEMO_CHECKOUT_ENABLED=true` in `backend/.env`.

Tests reset their selected demo seats; **do not point integration tests at production data**.

## 8. Stop or reset

```powershell
# From the project root:
docker compose stop
# Start containers again:
docker compose up -d
```

`docker compose down` removes containers, but preserves named volumes. `docker compose down -v` removes volumes and **deletes all PostgreSQL data**. Only use `-v` when you intentionally want a completely fresh local database.

## 9. Troubleshooting

- **Docker engine not running**: open Docker Desktop, verify WSL 2 integration, retry `docker compose up -d`.
- **Port 5432 already used by Windows PostgreSQL**: stop the Windows service or change the published port (e.g. `127.0.0.1:5433:5432`) and update `DATABASE_URL` port.
- **Redis offline**: booking still works because PostgreSQL is authoritative, but BullMQ jobs will be inactive. Confirm `docker compose exec redis redis-cli ping` returns `PONG` and restart the backend.
- **Backend exits at startup**: inspect PostgreSQL container status and `backend/.env`. It deliberately does not fall back to an unreliable in-memory booking store.
- **Frontend cannot reach API**: confirm backend port 4000 and frontend port 5173, use the Vite dev server, not the static HTML file.
- **Socket connection unavailable**: check `http://localhost:4000/api/health` and browser developer tools. Room updates use Socket.IO at backend port 4000.
- **Buttons on admin dashboard fail after deployment**: all potentially destructive demo admin tools are intentionally disabled when `NODE_ENV=production`.

## IMPORTANT: Current safety limitations

This is a **portfolio demo**, not a checkout system that can take money. Login is a browser-local mock and `userId` is client-controlled. There is NO real payment, user authentication, QR validation, real email delivery, distributed rate limiting, or distributed Socket.IO adapter. The in-process waiting room is not production admission control. **Do not use real customer data or sell real tickets.**

---

## November 2026 revision: authentication and live discovery

This ZIP replaces the previous localStorage mock login with PostgreSQL-backed account registration and JWT cookie sessions. Your existing `backend/.env` is **not** included in the ZIP; preserve it when upgrading, then add these new variables:

```text
JWT_SECRET=<32+ random characters generated locally>
TICKETMASTER_API_KEY=<optional, your developer API key>
TMDB_API_KEY=<optional, your developer API key>
```

Generate a strong JWT secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

After updating `.env`, **restart** your running backend (`Ctrl+C`, then `npm run dev`) so the new variables are loaded. Backend startup adds the `users` table to your existing PostgreSQL database without deleting existing SeatRush events or bookings. You can register a fresh account in the redesigned UI. External listings will remain empty until their API keys are set.

**On an existing repo:** extract this ZIP directly into `T:\a projects\SeatRush`, replacing project files. There is no `SeatRush-main` wrapper directory in the delivered ZIP. Do not overwrite your existing `.env` or Docker database volume. Before copying files, `git status` and commit or back up your local work. Then run `npm ci` in both `backend` and `frontend` and verify the builds.
