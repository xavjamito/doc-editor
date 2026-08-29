# PRD — Lightweight Collaborative Document Editor

**Project:** Ajaia AI-Native Assessment — Full Stack Product Engineer
**Author:** Xavier Jamito
**Status:** Draft for build
**Timebox:** 4–6 hours

---

## 1. Overview

A lightweight, browser-based collaborative document editor inspired by Google Docs. Users can create, edit, and format rich-text documents, upload files to seed new documents, and share documents with other users under simple role-based access. Documents and sharing state persist across sessions.

The goal is **not** to recreate Google Docs. It is to ship the strongest coherent product slice within the timebox, demonstrating full-stack execution, sound product judgment, and clear prioritization — with deliberate, well-explained scope cuts.

---

## 2. Goals & Non-Goals

### Goals
- Deliver a **usable, coherent** document editing experience end-to-end.
- Demonstrate full-stack execution: frontend, backend, persistence, and access logic.
- Handle file upload and sharing in a **product-relevant**, working way.
- Ship a **testable, deployed** build with clear setup instructions.
- Show mature, practical use of AI tools without sacrificing engineering standards.

### Non-Goals (deliberate scope cuts)
| Cut | Why it's acceptable | What we do instead |
|---|---|---|
| Real-time CRDT collaboration | Highest-effort feature, not required; would consume the whole timebox | Debounced autosave + "Saved" indicator; last-write-wins |
| Production authentication | Not the skill under test; real auth adds friction for reviewers | Seeded user switcher (mocked auth via cookie) — makes sharing *easier* to review |
| `.docx` import parsing | Fragile, time-expensive edge cases | Support `.txt` and `.md` only; state the limit in UI + README |
| Enterprise access control | Explicitly out of scope per brief | Two roles (viewer / editor), enforced **server-side** |

> Rationale: The brief states strong candidates make deliberate scope cuts and explain them clearly. Each cut above buys depth in the areas being evaluated (editing quality, sharing correctness, deployment).

---

## 3. Users & Personas

Three seeded users (no signup flow). A user switcher in the header simulates identity.

- **Owner** — creates and owns documents; can share and revoke.
- **Editor** — a user granted edit access to a shared document.
- **Viewer** — a user granted read-only access to a shared document.

---

## 4. Functional Requirements

### 4.1 Document Creation & Editing
Users can:
- Create a new document
- Rename a document
- Edit document content in the browser
- Save and reopen documents

Rich-text formatting supported:
- Bold, Italic, Underline
- Headings / text-size variation
- Bulleted and numbered lists

Acceptance: the editing flow feels usable and coherent; formatting round-trips through persistence and reload.

### 4.2 File Upload
- Upload a `.txt` or `.md` file and turn it into a **new editable document**.
- Supported types are stated clearly in the UI and README.
- Invalid types and empty/oversized files are rejected with a clear error.

### 4.3 Sharing
A simple sharing model where one user shares a document with another:
- Every document has an **owner**.
- Owner can **grant another user access** (viewer or editor).
- Owner can **revoke** access.
- The document list visibly distinguishes **Owned by me** vs **Shared with me**.
- Access is enforced **on the server** for every read/write, not just hidden in the UI.

### 4.4 Persistence
Documents and sharing data persist so that:
- Documents remain available after refresh.
- Formatting/structure is preserved in a reasonable way (editor JSON stored as-is).
- Shared-access behavior can be demonstrated across users.

### 4.5 Product & Engineering Quality
- Clear setup and run instructions.
- A working deployment reviewers can access.
- Basic validation and error handling.
- At least one meaningful automated test (permission resolver).
- A short architecture note explaining priorities.

---

## 5. Tech Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Single codebase for UI + API routes; one-command deploy; strong typing matches the "engineering standards" bar. Candidate's core stack. |
| Editor | **TipTap (ProseMirror)** | Rich-text (bold/italic/underline/headings/lists) out of the box; stores structured JSON that persists cleanly, avoiding brittle HTML round-tripping. |
| ORM | **Prisma** | Type-safe schema and migrations; models (`User`, `Document`, `DocumentShare`) map directly to the access logic under evaluation. |
| Database | **Neon (serverless Postgres)** | Free tier, no credit card, serverless — pairs natively with Vercel; real relational integrity for sharing/permissions (vs. a file store). |
| Hosting | **Vercel** | Zero-config Next.js deploy; free; gives reviewers a live URL fast. Deploy happens early, not last. |

**Why this stack over alternatives:** it minimizes setup friction (all free, no billing walls per the "don't require reviewers to pay" constraint), keeps everything in one deployable unit, and lets time go into the *product* (editing + sharing) rather than infrastructure plumbing. Postgres over SQLite/local-file because the sharing model is inherently relational and reviewers will test cross-user access on a deployed instance.

---

## 6. Data Model

```
User
  id, name, email

Document
  id, title, content (JSON), ownerId -> User, createdAt, updatedAt

DocumentShare
  id, documentId -> Document, userId -> User, role ("viewer" | "editor"), createdAt
  unique(documentId, userId)
```

Access resolution (server-side): a user may **read** a document if they are the owner or have any share; they may **write** if they are the owner or have an `editor` share. All other access is denied.

---

## 7. Development Workflow (Phased, Commit-per-Phase)

Development proceeds in discrete phases. **Each phase ends in a commit** with a descriptive message, so the git history reads as a clear delivery narrative and demonstrates prioritization under time pressure.

| Phase | Deliverable | Commit message (example) |
|---|---|---|
| **P0 — Scaffold & deploy** | Next.js + TS project, Prisma schema, Neon connected, 3 seeded users, deployed empty to Vercel | `chore: scaffold Next.js + Prisma + Neon, deploy skeleton to Vercel` |
| **P1 — Document CRUD** | Create / list / rename; list split into Owned vs Shared | `feat: document CRUD with owned/shared list separation` |
| **P2 — Editor** | TipTap editor + formatting toolbar + debounced autosave + save indicator | `feat: rich-text editor with autosave` |
| **P3 — Sharing & access control** | Share modal (grant/revoke, role select) + server-side permission guard on all routes | `feat: role-based sharing with server-enforced access control` |
| **P4 — File upload** | `.txt` / `.md` upload → new document; validation + errors | `feat: txt/md file upload into new document` |
| **P5 — Tests & hardening** | Permission-resolver unit test; validation and error-handling pass | `test: permission resolver coverage; harden validation` |
| **P6 — Docs** | README, ARCHITECTURE, AI_WORKFLOW, SUBMISSION | `docs: setup, architecture, AI workflow, submission notes` |

> If the timebox is reached mid-phase, stop and submit. Partial features are documented in SUBMISSION.md under *What is working / incomplete / next*.

---

## 8. Deliverables

Submit **one Google Drive folder** containing:

- [ ] The **source code**
- [ ] A **`README.md`** with local setup and run instructions
- [ ] A short **architecture note** (Markdown or PDF)
- [ ] The **AI workflow note** (Markdown or PDF)
- [ ] A **`SUBMISSION.md`** listing exactly what is included
- [ ] A **live product URL** reviewers can test (deployed via Vercel)
- [ ] A **text file with the walkthrough video URL**
- [ ] **Screenshots or a short demo GIF** if setup requires extra steps

Submission should also include, for quick reviewer evaluation:
- One Google Drive folder link containing all materials
- A live deployment link to test the product
- Any **credentials / seeded users / test accounts** needed to review sharing flows
- Clear instructions to run the project locally

For any feature that is partial or incomplete, state:
- **What is working**
- **What is incomplete**
- **What you would build next** with another 2–4 hours

---

## 9. Walkthrough Video (Required)

Record a **3–5 minute** unlisted Loom/YouTube walkthrough covering:
- The main user flow
- What functionality works end to end
- What was intentionally deprioritized
- Key implementation decisions
- How AI supported the workflow

---

## 10. AI-Native Workflow Note (Required)

A short note explaining:
- Which AI tools were used
- Where AI materially sped up the work
- What AI-generated output was **changed or rejected** (kept in a running scratch file during the build)
- How correctness, UX quality, and implementation reliability were verified

> Evaluated on **practical** AI usage, not volume.

---

## 11. Optional Stretch (only if core is complete)

One small enhancement, e.g.: export to PDF/Markdown, document version history, commenting/suggestion mode, or real-time collaboration indicators. **Not pursued at the expense of core functionality.**

---

## 12. Success Criteria (maps to evaluation rubric)

| Rubric item | How this PRD addresses it |
|---|---|
| Open-ended prompt → coherent product slice | Scoped feature set + explicit non-goals (§2) |
| Full-stack execution | Next.js + Prisma + Neon across UI, API, persistence, access (§5–6) |
| Document editing quality | TipTap editor with autosave (§4.1) |
| File upload & sharing behavior | §4.2, §4.3 with server-side enforcement |
| Infra & deployment judgment | Deploy early to Vercel; live URL (§5, §7) |
| Code clarity & delivery discipline | Phased commits (§7) |
| Prioritization under pressure | Deliberate cuts (§2), timeboxed phases (§7) |
| Communication | This PRD + README + architecture + submission notes (§8) |
| Mature AI use | AI workflow note with rejected outputs (§10) |
