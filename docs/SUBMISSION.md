# SUBMISSION

## What is included

| Item | Where |
|---|---|
| Source code | This repository — https://github.com/xavjamito/doc-editor |
| Live product URL | https://doc-editor-xi.vercel.app |
| Setup & run instructions | [README.md](../README.md) |
| Architecture note | [ARCHITECTURE.md](ARCHITECTURE.md) (decisions AD-1…AD-7) + [PRD.md](PRD.md) §5–6 (stack rationale) |
| AI workflow note | [AI_WORKFLOW.md](AI_WORKFLOW.md) |
| Build log | [WORKFLOW.md](WORKFLOW.md) (chronological, per phase) |
| Walkthrough video URL | `VIDEO_URL.txt` (added at submission time) |

## Test accounts / credentials

No passwords — auth is deliberately mocked (PRD §2). Use the **"Acting as"** switcher in the app header:

- **Alice Owner** — create and share documents
- **Bob Editor** — receives editor access in demos
- **Carol Viewer** — receives viewer access in demos

Suggested review flow: as Alice, create a doc, format some text, upload a `.md` file, share the doc with Bob (editor) and Carol (viewer); then switch to Bob (can edit) and Carol (read-only banner, writes rejected server-side).

## What is working

Everything in the PRD's functional scope, end to end, on the live deployment:

- Document create / rename / delete; list split into *Owned by me* / *Shared with me*
- Rich-text editing (bold, italic, underline, H1–H3, bullet/numbered lists) with debounced autosave + Saving/Saved indicator; formatting persists across reload
- `.txt` / `.md` upload → new document, with clear rejections (wrong type, empty, >1 MB)
- Sharing with viewer/editor roles: grant, role change, revoke — enforced **server-side** on every read/write (verified by a 15-case cross-user matrix, plus unit tests)
- Persistence in Neon Postgres; 3 seeded users; deployed on Vercel
- 14 Vitest tests (permission resolver, import converters); lint and build clean

## What is incomplete

- No real-time collaboration — concurrent edits are last-write-wins (deliberate cut, PRD §2)
- No real authentication — cookie-based user switcher (deliberate cut, PRD §2)
- `.docx` upload not supported (deliberate cut, PRD §2)
- Walkthrough video to be recorded and linked in `VIDEO_URL.txt`

## What I would build next (2–4 hours)

1. **Presence + conflict safety:** a lightweight "someone else is editing" indicator and version-check on save (reject stale writes with a reload prompt) — the biggest real-world gap of last-write-wins.
2. **Export:** download a document as Markdown (TipTap JSON → md is nearly free given the import pipeline).
3. **Share UX:** share directly from the dashboard list and show avatars of people with access on each card.
