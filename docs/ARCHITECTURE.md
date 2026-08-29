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

## AD-5: Server components read, API routes mutate

**Decision:** Pages (dashboard, doc page) are server components querying Prisma
directly; every mutation (create/rename/delete/save/share/upload) goes through
`/api` route handlers; identity always comes from the auth cookie, never from
request payloads.

**Rationale:** Direct server-component reads avoid a pointless HTTP hop to our
own API; route handlers give mutations a single, curl-testable enforcement
surface. Both paths share the same pure permission resolver
(`src/lib/permissions.ts`), so read and write access rules cannot drift apart.
The resolver is pure (no DB calls) precisely so it can be unit-tested without
mocking Prisma (P5).

## AD-6: 404 for inaccessible documents

**Decision:** Requests for documents that don't exist *or* that the user cannot
read both return 404. 403 is reserved for "you can see this but can't do that"
(viewer trying to write, non-owner trying to share/delete).

**Rationale:** Returning 403 on existing-but-unshared documents would leak which
IDs exist. Distinguishing read-denied from missing has no product value here.

## AD-7: Markdown import via marked → HTML → `generateJSON`

**Decision:** `.md` uploads are parsed with `marked`, then converted to TipTap
JSON with `@tiptap/html/server` against the StarterKit schema. `.txt` uploads
are split on blank lines into plain paragraphs.

**Rationale:** Reuses TipTap's own schema as the sanitizer — only nodes/marks the
editor supports survive the conversion (script tags and arbitrary HTML embedded
in markdown are silently dropped), so imported content is exactly as expressive
as content typed in the editor. No hand-rolled markdown-to-ProseMirror mapping
to maintain. Verified `@tiptap/html/server` is the Node-safe import (the default
`@tiptap/html` entry point throws outside the browser).

## AD-8: Version history via write-time snapshots (stretch feature, PRD §11)

**Decision:** A `DocumentVersion` row (title + content + author + timestamp) is
captured *before* a content write overwrites existing content, when either (a)
the current state was authored by a different user than the writer, or (b) the
latest version is older than a 2-minute window. Restoring first snapshots the
current state, then applies the chosen version — so restore is itself undoable.
`Document.lastEditedById` tracks who authored the current state so snapshots
are attributed correctly.

**Rationale:** Versioning every debounced autosave (~800ms) would flood the
table with near-identical rows; explicit "save version" buttons get forgotten.
Write-time snapshots with a window + different-author bypass collapse a typing
session into one version but never let one user silently overwrite another's
work — which is exactly the risk left open by last-write-wins (PRD §2). The
decision rule is a pure function (`src/lib/versions.ts`), unit-tested like the
permission resolver. History is readable by anyone with read access; restore
requires write access.

**Consequence:** Versions are point-in-time copies, not diffs — storage grows
with edit activity. Fine at this scale; a real system would prune or delta.
