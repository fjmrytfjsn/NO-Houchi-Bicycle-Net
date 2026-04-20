# Plan Files

Use `plan/YYYY-MM-DD__task-slug.md` for broad, risky, or multi-session work.

Good uses:

- changing API contracts, data models, or Prisma migrations
- changing owner unlock, coupon, OCR, or recovery flows
- adding or restructuring app directories
- updating multiple docs to match implementation
- introducing local verification scripts or workflow changes

Include:

- goal and non-goals
- files and docs inspected
- planned changes
- verification commands
- data/API assumptions
- risks and follow-ups
- whether `AGENTS.md`, `ARCHITECTURE.md`, or `docs/adr/` need updates

Do not create a plan file for small typo fixes or narrow documentation edits.
When a plan produces durable project knowledge, update `AGENTS.md` or `ARCHITECTURE.md` before closing the task.
When a plan produces an accepted long-lived decision, record it in `docs/adr/`.
