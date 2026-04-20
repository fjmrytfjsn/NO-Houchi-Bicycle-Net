# Owner Web (apps/owner-web)

Development scaffold for the owner-facing web app.

## Start dev

1. cd apps/owner-web
2. npm install
3. npm run dev

Dev server runs on http://localhost:3001 by default.

This scaffold includes simple API mocks under `pages/api/owner/markers/[code]` for development and testing.

## Structure

- `pages/markers/[code].tsx`: owner marker page orchestration.
- `components/owner/`: owner flow presentation components.
- `hooks/`: reusable browser-side hooks such as QR scanning and time updates.
- `lib/owner/`: owner flow types, API client helpers, time utilities, and shared development API store.
- `pages/api/owner/markers/[code]`: development API mocks for marker lookup, temporary unlock, final unlock, coupons, and E2E helpers.
