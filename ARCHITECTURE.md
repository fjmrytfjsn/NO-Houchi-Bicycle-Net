# Architecture

## Overview

NO-Houchi Bicycle Net is a monorepo for a prototype civic-tech platform targeting abandoned bicycle operations in Osaka Kita Ward. The current design centers on reporting, owner warning and unlock actions, recovery requests, and recovery result recording.

## Current Components

- `backend/`: TypeScript Fastify API server with Prisma models, migrations, routes, services, and Vitest tests.
- `apps/owner-web/`: Next.js owner web flow for marker pages, temporary unlock, final unlock, mocks, unit tests, and Playwright tests.
- `apps/admin-dashboard/`: Next.js admin dashboard scaffold with shared layout, report list/detail pages, unresolved-case views, and mock-driven recovery request/result forms.
- `docs/`: source documents for setup, developer workflow, API specs, owner API, data model, acceptance criteria, wireframes, and project status.
- `README.md`: high-level project scope, monorepo shape, setup notes, and prototype/future-scope distinction.

## Main Flows

- Supporter/reporting flow: abandoned bicycle information is recorded through the backend report registration API and persisted in backend data models.
- Owner flow: a marker code opens owner web pages, then temporary unlock and final unlock actions are handled through owner-facing routes and backend/API mock paths.
- Recovery operations: unresolved cases can move toward recovery request and recovery result tracking according to the design docs.
- Coupon/OCR features exist in backend documentation and code and should be checked against current implementation before changing behavior.

## Boundaries

- `backend/prisma/schema.prisma` is the source of truth for implemented database model names and relations.
- API documentation should be updated with API behavior changes; do not leave docs and route behavior intentionally divergent.
- CI is not used by project policy. Verification is local and should be documented in PR notes or task plans.
- Prototype scope should remain distinct from future-scope features.

## Maintenance

- Update this file when components, major flows, data boundaries, or prototype/future-scope decisions change.
- Update `AGENTS.md` when setup, commands, verification, or repository operating rules change.
- Create or update an ADR in `docs/adr/` when a long-lived architecture, data model, external service, security, or operations decision should guide future work.
- Prefer short, current descriptions over historical detail; move task-specific notes into `plan/`.

## Unknowns

- Current status of `apps/android-app/` in the implementation tree.
- Final production infrastructure and external integration choices.
- Which future-scope features will be promoted into prototype scope.
