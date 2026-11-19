# SeatRush — validation summary

## Checks performed for this revised ZIP

- Parsed all TypeScript and TSX source files using TypeScript's parser: no syntax errors at time of packaging.
- Checked relative TypeScript imports and environment file references.
- Confirmed legacy third-party branding is absent from project source.
- Ran isolated Node.js smoke tests for scrypt hash/verification and signed JWT validation/tampering.
- Inspected login/hold/bookings controllers: user identity is now derived from JWT cookie middleware, not browser-supplied `userId`.
- Confirmed external event URLs open providers instead of being passed into SeatRush booking routes.

## Not verified here

- `npm ci`, `npm run build`, `npm test` and actual Docker/PostgreSQL/Redis end-to-end tests were **not completed in this execution environment**, where npm registry downloads were unavailable and PostgreSQL wasn't running.
- The connected Ticketmaster and TMDB APIs could not be exercised without the user's API keys.
- Browser pixel-by-pixel screenshot review and accessibility audits were not completed.

## Required local checks before deploying

1. `docker compose up -d`, then run backend and frontend `npm ci` / `npm run build`.
2. Register with a new email; log out; verify login rejects wrong password and sessions expire/revoke.
3. Open same event in two browsers/accounts; verify one hold prevents the other booking.
4. Verify a user cannot request another account's booking history using the API.
5. Add provider API keys and verify results, attribution, empty states, rate limits, and links for selected cities.
6. Run the backend tests and k6 against a *nonproduction* test database; review failures before making reliability claims.

**This is not a certification of production readiness.**
