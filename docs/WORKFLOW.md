# WORKFLOW — Build Log

Running log of every workflow step, decision, and code change during the build.
Newest entries at the bottom. Phases follow PRD §7.

---

## P0 — Scaffold & deploy

- **Env check:** Node v22.17.0, npm 10.9.2, git 2.49.0, Vercel CLI logged in as `xavier-1622`. All prerequisites present.
- **Scaffold:** `create-next-app@latest` (Next.js 16.3.3, TypeScript, Tailwind v4, App Router, `src/` dir, npm). Scaffolded into a temp subdir and moved to repo root because the directory already contained PRD/notes files that `create-next-app` would refuse to touch.
- **Git:** `git init` (via create-next-app), branch `main`, remote `origin` → `github.com/xavjamito/doc-editor`. Confirmed `.env*` is gitignored before writing secrets.
- **Prisma:** npm resolved `prisma@7` by default. **Rejected Prisma 7** — it requires driver adapters (`@prisma/adapter-pg`) and a new `prisma.config.ts` setup; extra plumbing with no benefit inside a 4–6h timebox. Pinned `prisma@^6` + `@prisma/client@^6`. (Decision detail in ARCHITECTURE.md.)
- **Schema:** `User`, `Document` (content as nullable `Json`), `DocumentShare` with `@@unique([documentId, userId])` and a `ShareRole` enum (`viewer` | `editor`) — exactly PRD §6.
- **Neon:** `DATABASE_URL` uses the pooled endpoint (runtime); added `DIRECT_URL` (non-pooled, `-pooler` stripped from host) as Prisma `directUrl` because migrations need a direct connection through PgBouncer-style poolers.
- **Migration:** `prisma migrate dev --name init` applied against Neon. Seeded 3 users via `prisma/seed.ts` (`user-alice` / `user-bob` / `user-carol`, upsert so re-runs are safe).
- **Mock auth:** `src/lib/auth.ts` — identity from `doc-editor-user` cookie, defaulting to Alice; user is always resolved against the DB so server-side access checks stay real. `src/lib/prisma.ts` — standard dev-mode PrismaClient singleton.
- **Build script:** `prisma generate && next build` so Vercel always has a fresh client.
- **GitHub push:** first push failed (403) — active gh account was `xavier-tempo`, repo belongs to `xavjamito`. Switched remote to SSH (`git@github.com:xavjamito/doc-editor.git`), which authenticates as `xavjamito`, instead of flipping the global gh account. Remote had an initial LICENSE commit; rebased local history on top.
- **Vercel deploy:** linked `mindspirit/doc-editor`, added `DATABASE_URL` + `DIRECT_URL` to production/preview/development, deployed via CLI (after a required CLI upgrade). Production alias **https://doc-editor-xi.vercel.app** is publicly reachable (200); deployment-specific URLs are behind Vercel SSO, which is fine for reviewers.

## P1 — Document CRUD

- **Plan:** server components read from Prisma directly for pages; all mutations go through `/api` route handlers; access checks centralized in a pure `permissions.ts` resolver (built now so every route uses it from day one, extended in P3, unit-tested in P5). Decision detail in ARCHITECTURE.md (AD-5).
- Routes: `GET/POST /api/documents`, `GET/PATCH/DELETE /api/documents/[id]`, `POST /api/switch-user` (validates the user exists, sets httpOnly cookie).
- UI: header with user switcher (3 seeded users), dashboard split into "Owned by me" / "Shared with me", create + rename + delete, `/doc/[id]` page (editor placeholder until P2).
- Unknown/inaccessible documents return **404 (not 403)** so document IDs don't leak existence.
- **Verified** (local prod server + curl): create/list/rename/delete as Alice; Bob gets 404 on Alice's doc for read *and* delete; empty-title rename rejected 400; unknown user switch rejected 400. Dashboard renders both sections.
- **Fix during build:** Next.js route files only allow HTTP-method exports — moved `MAX_TITLE_LENGTH` out of `api/documents/route.ts` into `src/lib/validation.ts`.
- Committed `feat: document CRUD with owned/shared list separation`, pushed, deployed.

## P2 — Editor

- Installed `@tiptap/react` + `@tiptap/starter-kit` v3.30.5. Checked the typings: **v3 StarterKit already bundles underline**, so no `@tiptap/extension-underline` dependency (v2-era advice would add it and cause duplicate-extension warnings).
- `Editor.tsx` (client): toolbar (bold/italic/underline, H1–H3, paragraph, bullet/ordered list) with active-state highlighting; `onMouseDown preventDefault` on buttons so the editor keeps focus/selection when clicking the toolbar.
- **Autosave:** 800ms debounce on `onUpdate` → `PATCH /api/documents/[id]` with `editor.getJSON()`; indicator cycles Saving… → Saved, sticky error message on failure. Last-write-wins per PRD §2.
- `EditableTitle.tsx`: title doubles as an input (owner/editor only); Enter/blur saves, invalid titles revert.
- Read-only mode: viewers get `editable: false` + a "Read-only" banner instead of the toolbar (exercisable once sharing lands in P3).
- Editor typography for headings/lists lives in `globals.css` under `.tiptap-content` because Tailwind preflight resets them. Also removed the scaffold's auto dark-mode (would have produced unstyled dark surfaces).
- **Verified** via API round-trip: heading + bold + underline + bulletList JSON persists and reads back intact; editor shell and title input server-render (TipTap itself hydrates client-side by design with `immediatelyRender: false`). Interactive typing/toolbar checked manually in the browser.
- Committed `feat: rich-text editor with autosave`, pushed, deployed.

## P3 — Sharing & access control

- Routes: `GET/POST /api/documents/[id]/shares` (owner-only; POST **upserts** so granting again just changes the role), `DELETE /api/documents/[id]/shares/[userId]` (owner-only revoke). Guards: can't share with yourself, unknown users and bad roles → 400, non-owner managing shares → 403.
- UI: Share button + dialog on the doc page (owner only). Since there are exactly 3 seeded users, the dialog lists every other user with a No access / Viewer / Editor select + Revoke — simpler and more reviewable than an email-invite flow.
- Server enforcement needed **no new work** on document routes: they've gone through `canRead`/`canWrite` since P1.
- **Verified** full matrix with curl as Alice/Bob/Carol (15 checks): no access → 404; editor can read+write; viewer can read but write → 403; non-owner share management → 403; non-owner delete → 403; self-share → 400; bad role → 400; revoke drops access back to 404; viewer→editor upgrade enables writes.
- Committed `feat: role-based sharing with server-enforced access control`, pushed, deployed.

## P4 — File upload

- `POST /api/upload` (multipart): validates extension (`.txt`/`.md` only), size (≤1 MB), non-empty; title derived from filename. Conversion in `src/lib/import.ts` — `.md` via `marked` → HTML → `generateJSON` from **`@tiptap/html/server`** (the default `@tiptap/html` import throws in Node — caught this by testing before wiring it in); `.txt` split on blank lines into paragraphs. Schema-based conversion doubles as sanitization (ARCHITECTURE.md AD-7).
- `UploadButton` on the dashboard: hidden file input, inline error display, navigates to the new doc on success. Supported types + limit stated on the button/UI.
- **Verified** with curl: `.md` becomes heading/bold/bulletList nodes; `.txt` becomes paragraphs; `.pdf`, empty file, 1.06 MB file, and missing file field each rejected 400 with a clear message.
- Committed `feat: txt/md file upload into new document`, pushed, deployed.

## P5 — Tests & hardening

- Vitest: 14 tests across `permissions.test.ts` (owner/editor/viewer/stranger matrix for `resolveAccess`/`canRead`/`canWrite`/`isOwner`, incl. owner-with-share edge case) and `import.test.ts` (txt paragraph splitting, CRLF, whitespace-only, md heading/bold/list conversion, script-tag stripping). The resolver being a pure function meant zero mocking.
- Hardening: `PATCH /api/documents/[id]` now caps request bodies at 2 MB (413) so autosave payloads can't grow unbounded. Verified 2.2 MB → 413, normal → 200.
- Lint fix: `react-hooks/set-state-in-effect` in ShareDialog — replaced the `useEffect`-on-open with fetching in the open-button handler (less code, same behavior, better React style).
- `npm run lint`, `npm test` (14/14), `npm run build` all clean.
- Committed `test: permission resolver coverage; harden validation`, pushed, deployed.

## P6 — Docs

- **Production smoke test** against https://doc-editor-xi.vercel.app before writing docs: home 200; create as Alice; Bob 404 pre-share; grant viewer 201; Bob read 200 / write 403; `.md` upload converts; test docs cleaned up afterwards.
- Rewrote README (features, seeded users, local setup incl. Neon pooled/direct URL note, scripts, deliberate limits).
- AI_WORKFLOW.md: tools, where AI helped, five concrete changed/rejected AI outputs (kept as a running log during the build), verification approach.
- SUBMISSION.md: included items, review flow for sharing, working/incomplete/next per PRD §8. `VIDEO_URL.txt` to be added after recording.
- Committed `docs: setup, architecture, AI workflow, submission notes`, pushed, deployed.

## Post-P6 — Docs reorganization + component tests

- Moved PRD.md, WORKFLOW.md, ARCHITECTURE.md, AI_WORKFLOW.md, SUBMISSION.md into `docs/` (via `git mv` to preserve history); README stays at root per convention. Updated cross-links in README and SUBMISSION.
- Component unit tests: added `@testing-library/react` + `user-event` + `jest-dom` + `jsdom`, `vitest.config.ts` (react plugin, jsdom env, `@` alias) and `vitest.setup.ts` (jest-dom matchers, auto-cleanup).
- 24 new tests across 7 files: UserSwitcher (render + switch POST/refresh), NewDocumentButton (create/navigate, server-error display), UploadButton (FormData upload/navigate, rejection message, input reset), EditableTitle (read-only heading, Enter-to-save, unchanged/empty no-op, revert on 403), DocumentCard (link, shared metadata, viewer buttons hidden, editor rename-only, rename PATCH, delete confirm/decline), ShareDialog (owner excluded from candidates, existing roles shown, grant POST, revoke DELETE, error surface), Editor (read-only banner vs toolbar; TipTap mounts fine in jsdom).
- **Fix during build:** `userEvent.upload` honors the input's `accept` attribute and silently skipped the `.pdf` fixture — passed `applyAccept: false` since the test targets the server-side rejection path.
- Totals: **38 tests** (14 lib + 24 component), lint clean, build clean.

## Stretch — Document version history (PRD §11)

- Schema: `DocumentVersion` (title, content, `createdBy`, timestamp, cascade on doc delete) + `Document.lastEditedById` for correct snapshot attribution. Migration `document_versions` applied to Neon.
- Snapshot rule as a pure function (`shouldSnapshot`, 6 unit tests): never snapshot empty docs; always before first overwrite of real content; always when a **different user** overwrites someone else's state; otherwise collapse same-user saves within a 2-minute window. Rationale in ARCHITECTURE.md AD-8.
- API: `GET /api/documents/[id]/versions` (list, read access), `GET .../versions/[versionId]` (content preview, read access), `POST .../versions/[versionId]` (restore, write access; current state snapshotted first inside a transaction).
- UI: History button on the doc page → dialog with version list (timestamp, title, author), read-only TipTap preview (reused `Editor` with new `readOnlyLabel` prop), Restore button for writers only. Main editor remounts after restore via `key={doc.updatedAt}`.
- Tests: 4 dialog component tests + 6 snapshot-rule tests → suite now **48 tests**, lint + build clean.
- **Verified** end-to-end with curl (11 checks): first save creates no version; second save preserves prior state; same-user saves in-window collapse; a different editor triggers a snapshot; preview returns exact old content; viewer restore → 403 but can list history; restore replaces content and preserves the pre-restore state (3 versions). Note: a made-up identity cookie resolves to the default seeded user by design (mock auth, AD-3) — enforcement applies to the resolved user.
