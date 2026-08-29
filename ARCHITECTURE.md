# ARCHITECTURE — Decisions & Rationale

Architectural decisions made during the build, in order. See PRD.md §5–6 for the
stack rationale that predates the build; this file records decisions made *while* building.

---

## AD-1: Prisma 6 over Prisma 7

**Decision:** Pin `prisma@^6` / `@prisma/client@^6` instead of the npm-default Prisma 7.

**Context:** Prisma 7 removes the classic `prisma-client-js` generator, requires a
driver adapter (`@prisma/adapter-pg` + `pg`) for Postgres, and moves CLI config
(including `.env` loading and seeding) into `prisma.config.ts`.

**Rationale:** None of that buys anything for this product slice; it is pure setup
cost and a newer, less-documented failure surface. Prisma 6 works out of the box
with Neon + Vercel. In a 4–6h timebox, boring and proven wins.

**Consequence:** A future upgrade to 7 would touch the generator block, add an
adapter, and migrate seed config. Acceptable debt.

## AD-2: Pooled + direct Neon connections

**Decision:** `DATABASE_URL` points at Neon's pooled endpoint (used at runtime,
serverless-friendly); `DIRECT_URL` points at the direct endpoint and is wired to
Prisma's `directUrl` (used only by `migrate`).

**Rationale:** Serverless functions need pooling to avoid exhausting Postgres
connections; Prisma migrations need session-level features that PgBouncer-style
poolers don't provide.

## AD-3: Mocked auth via cookie, resolved server-side

**Decision:** Identity = `doc-editor-user` cookie (set by a header user switcher),
default `user-alice`. Every request still loads the user row from Postgres.

**Rationale:** Per PRD §2, real auth is a deliberate cut. Resolving the cookie
against the DB on the server keeps the permission model honest: API routes never
trust client-supplied user IDs in payloads — only the cookie — so the sharing /
access-control logic under evaluation runs exactly as it would with real sessions.
Swapping in real auth later only means replacing `getCurrentUser()`.

## AD-4: Document content stored as TipTap JSON (`Json?` column)

**Decision:** `Document.content` is a nullable Postgres `jsonb` column holding the
TipTap/ProseMirror document as-is; `null` = empty document.

**Rationale:** Round-tripping structured editor state beats HTML string storage
(no sanitization/parsing drift, formatting survives reload — PRD §4.4). Postgres
`jsonb` keeps it queryable if ever needed.
