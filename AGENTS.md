# Project Agent Instructions

## Project

- NO-Houchi Bicycle Net is a civic-tech prototype monorepo for abandoned bicycle reporting, owner unlock flow, recovery operations, and related documentation.
- Keep prototype scope separate from future ideas such as advanced analytics, blacklist handling, detailed incentive design, and external integrations.
- Prefer repository docs for durable project facts; do not put repo-specific details in global memory.
- Put durable architecture, data model, external service, security, or operations decisions in `docs/adr/`.

## Structure

- `backend/`: Fastify + Prisma API server and backend tests.
- `apps/owner-web/`: Next.js owner-facing web app, API mocks, Jest tests, and Playwright tests.
- `docs/`: design, setup, API, data model, acceptance, workflow, and status documents.
- `apps/android-app/` and `apps/admin-dashboard/` are described in project docs, but may not exist or may be incomplete in the current tree.

## Commands

- Backend setup and dev: `cd backend && npm install && docker-compose up -d && npm run prisma:generate && npm run prisma:migrate && npm run dev`
- Backend tests: `cd backend && npm test`
- Owner web dev: `cd apps/owner-web && npm install && npm run dev`
- Owner web checks: `cd apps/owner-web && npm test && npm run type-check && npm run lint`
- Owner web E2E: `cd apps/owner-web && npm run e2e`

## Workflow

- Read `README.md` and `docs/developer-workflow.md` before changing setup, verification, or repo structure.
- For API or data changes, inspect `docs/api-spec.md`, `docs/owner-api.md`, `docs/data-model.md`, `docs/openapi*.yaml`, and `backend/prisma/schema.prisma`.
- This repo intentionally has no CI; use local verification and report commands that were not run.
- For GitHub Project or Issue management, read `docs/project-management.md` and keep Issue state and Project Status synchronized.
- For broad or multi-session work, create `plan/YYYY-MM-DD__task-slug.md`.
- Before finishing broad changes, check whether `AGENTS.md`, `ARCHITECTURE.md`, `docs/adr/`, or `plan/README.md` should be updated.
- Move durable project facts discovered during work into project docs instead of relying on chat history.

## Verification

- Documentation-only changes can use static review and `git diff`.
- Backend behavior changes should usually run `cd backend && npm test`.
- Owner web behavior changes should usually run `cd apps/owner-web && npm test && npm run type-check`.
- Run Playwright E2E only when owner flow behavior or browser integration changes.
