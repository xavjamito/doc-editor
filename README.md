# Doc Editor — Lightweight Collaborative Document Editor

A browser-based rich-text document editor with file upload and role-based sharing, built for the Ajaia AI-Native Assessment.

**Live deployment:** https://doc-editor-xi.vercel.app

## Features

- **Rich-text editing** (TipTap): bold, italic, underline, headings (H1–H3), bulleted and numbered lists
- **Autosave** with a debounced Saving…/Saved indicator (last-write-wins)
- **File upload**: turn a `.txt` or `.md` file (max 1 MB) into a new editable document
- **Sharing**: owners grant/revoke viewer or editor access; access is enforced server-side on every read and write
- **Document list** split into *Owned by me* and *Shared with me*
- **Persistence**: documents and shares live in Postgres (Neon); formatting survives reload as TipTap JSON

## Test users

There is no signup — authentication is deliberately mocked (see docs/ARCHITECTURE.md / PRD §2). Use the **"Acting as"** switcher in the header to change identity:

| User | Email | Typical role in demos |
|---|---|---|
| Alice Owner | alice@example.com | Creates and shares documents |
| Bob Editor | bob@example.com | Granted editor access |
| Carol Viewer | carol@example.com | Granted viewer access |

To demo sharing: as Alice, open a document → **Share** → grant Bob *editor* and Carol *viewer* → switch users in the header and observe what each can see and do.

## Local setup

Requirements: Node 20+, npm, a Postgres database (a free [Neon](https://neon.tech) project works out of the box).

```bash
git clone https://github.com/xavjamito/doc-editor.git
cd doc-editor
npm install
```

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://...pooled connection string..."
DIRECT_URL="postgresql://...direct (non-pooled) connection string..."
```

For Neon, `DATABASE_URL` is the pooled endpoint (host contains `-pooler`) and `DIRECT_URL` is the same string with `-pooler` removed. For plain local Postgres, both can be identical.

Then:

```bash
npm run db:migrate   # create tables
npm run db:seed      # seed the 3 users
npm run dev          # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm test` | Vitest suite (permission resolver + file import) |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:seed` | Prisma migration / user seeding |

## Project notes

All project documentation lives in [docs/](docs/):

- **[docs/PRD.md](docs/PRD.md)** — product requirements and deliberate scope cuts
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — architectural decisions with rationale (AD-1…AD-7)
- **[docs/WORKFLOW.md](docs/WORKFLOW.md)** — chronological build log (steps, decisions, verifications)
- **[docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)** — how AI tools were used, including rejected AI output
- **[docs/SUBMISSION.md](docs/SUBMISSION.md)** — submission checklist and review flow

## Known limits (deliberate)

- No real auth (mocked user switcher — the skill under test is access logic, not auth plumbing)
- No real-time collaboration; concurrent edits are last-write-wins
- Uploads limited to `.txt`/`.md` (no `.docx`)
