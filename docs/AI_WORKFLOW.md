# AI Workflow Note

How AI tooling was used to build this project, per the assessment brief.

## Tools used

- **Claude Code (Claude Opus)** as the primary build agent: scaffolding, implementation, API testing, deployment via Vercel CLI, and maintaining WORKFLOW.md/ARCHITECTURE.md as it worked.
- Development followed the PRD's phase plan (P0–P6) with one reviewed commit per phase.

## Where AI materially sped things up

- **Scaffold-to-deploy in minutes:** Next.js + Prisma + Neon + Vercel wired and deployed (P0) before feature work started, so every later phase shipped to a live URL.
- **Server-side enforcement testing:** the full cross-user permission matrix (15 curl checks: owner/editor/viewer/stranger × read/write/share/delete/revoke) was scripted and run against a local prod build in each phase, and re-run against production — far more thorough than clicking through by hand.
- **Boilerplate-heavy layers:** route handlers, validation branches, and the share dialog UI were AI-generated and then reviewed/trimmed.

## AI output that was changed or rejected (running log kept during the build)

1. **Prisma 7 (npm default) — rejected.** The freshly-installed Prisma 7 requires driver adapters and a new `prisma.config.ts`; pinned Prisma 6 instead for a boring, proven path inside the timebox (ARCHITECTURE.md AD-1).
2. **`@tiptap/html` default import — rejected before it shipped.** Testing the conversion in Node *before* wiring it into the upload route revealed it throws outside the browser; switched to the `@tiptap/html/server` entry point (WORKFLOW.md P4).
3. **v2-era TipTap advice — rejected.** The common instruction to install `@tiptap/extension-underline` is wrong for TipTap v3, where StarterKit already bundles underline; verified against the installed package's typings instead of trusting training-data memory.
4. **`useEffect`-based fetch in ShareDialog — replaced.** The first version loaded shares in an effect; ESLint's `react-hooks/set-state-in-effect` flagged it, and it was rewritten to fetch in the open-button handler (less code, better React style).
5. **Route-file constant export — fixed at build time.** An exported `MAX_TITLE_LENGTH` from a route handler violates Next.js's allowed-exports rule; moved to `src/lib/validation.ts`.

## How correctness and quality were verified

- **Automated:** 14 Vitest tests over the pure permission resolver and file-import converters (including a script-tag-stripping test); ESLint; production builds after every phase.
- **Behavioral:** curl-based API matrices against a local production build for every phase (CRUD, sharing enforcement, upload validation, payload caps), then a final end-to-end smoke test against the live Vercel deployment (share → switch user → verify 404/403/200 responses).
- **Manual:** editor typing, toolbar formatting, and autosave indicator checked in a real browser (TipTap hydrates client-side, so HTML-level checks can't cover interaction).
- **Traceability:** every step and decision was logged to WORKFLOW.md as it happened; architectural decisions with rationale live in ARCHITECTURE.md.
