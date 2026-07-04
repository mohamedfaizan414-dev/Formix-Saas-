# Formix Clinical

A dynamic, JSON-driven healthcare form builder — drag-and-drop builder, conditional
logic engine, versioning, audit logs, RBAC, and Cloudinary/NeonDB/Groq wiring.

This is a **fresh codebase**, built from scratch with its own design system (clinical
chart-paper aesthetic — not shadcn defaults), separate from any prior Formix project.

## Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, @dnd-kit, Framer Motion, Zod, TanStack-ready
- **Backend:** Next.js Route Handlers, Prisma ORM
- **Database:** PostgreSQL via **NeonDB**
- **File storage:** **Cloudinary** (uploads, images, signatures)
- **AI:** **Groq** (`llama-3.3-70b-versatile`) — used for exactly one feature: generating a form schema from a text prompt inside the builder. Nothing else in the app calls an LLM.
- **Auth:** JWT access + refresh tokens, httpOnly cookies, bcrypt password hashing

## Getting started

```bash
npm install
npx prisma generate      # requires normal internet access (this was built in a
                          # sandboxed environment that couldn't reach Prisma's
                          # binary CDN, so this step was not run here)
npx prisma db push        # creates tables in your NeonDB database
npm run prisma:seed       # seeds roles, a demo hospital, 5 demo users, 1 published form
npm run dev
```

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` / `DIRECT_URL` — your NeonDB connection strings
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `GROQ_API_KEY` — only needed for the "Generate with AI" button in the builder

### Seeded accounts (password: `Passw0rd!` for all)

| Role | Email |
|---|---|
| Super Admin | `super@formix.dev` |
| Hospital Admin | `admin@sunrise.dev` |
| Doctor | `doctor@sunrise.dev` |
| Nurse | `nurse@sunrise.dev` |
| Receptionist | `reception@sunrise.dev` |

## What's fully implemented

- **Drag-and-drop builder** (`/forms/[id]/builder`) — 40 field types across basic,
  selection, upload, display, layout, action, and healthcare categories, driven by
  a single field registry (`lib/form-engine/field-registry.ts`). Sidebar drag or
  click to add, top-level drag-to-reorder, nested layout containers (section/card/row),
  undo/redo, copy/paste, duplicate.
- **JSON schema engine** — forms are never stored as HTML. `lib/form-engine/types.ts`
  defines the schema; nothing renders without it.
- **Conditional logic engine** (`lib/form-engine/conditional-engine.ts`) — nested
  AND/OR rule groups, show/hide/enable/disable/require/setValue/jump actions,
  evaluated live as values change. Manage rules from the builder toolbar.
- **Dynamic renderer + validation** — `components/renderer` renders any schema and
  builds a Zod schema on the fly from only the currently-visible fields.
- **Versioning** — every save creates a new immutable `FormVersion`; submissions
  are pinned to the version they were filled against. History view at
  `/forms/[id]/versions`.
- **RBAC + multi-tenancy** — 5 roles (`lib/rbac/permissions.ts`), every Prisma query
  in the API layer filters by `hospitalId` unless the caller is a Super Admin.
- **Audit logging** — every form/submission/auth mutation writes an `AuditLog` row;
  viewable at `/admin/audit-logs`.
- **Healthcare fields** — vitals, allergies, medications, prescriptions, lab orders,
  ICD-10 diagnosis, patient/encounter info, nursing notes, consent, signature pads.
- **Cloudinary uploads** — `lib/cloudinary/upload.ts` + `/api/upload`.
- **AI form generation** — `/api/ai/generate-form`, Groq-backed, hydrated into the
  same schema the builder produces so it can't break the canvas.

## What's intentionally simplified (and why)

The source PDF describes a multi-month enterprise build. To keep everything above
*actually working* rather than a pile of stubs, these were left as clean extension
points instead of faked:

- **MFA/OTP, BullMQ background jobs, WebSockets, OpenTelemetry, full CI/CD** — these
  are infrastructure additions on top of a working app, not core product logic.
  The auth schema already has `mfaEnabled`/`mfaSecret` fields ready for it.
- **Nested drag physics** — top-level reordering uses full @dnd-kit drag-and-drop;
  reordering *inside* a nested container (row/section/card) currently happens by
  selecting the container and clicking a sidebar item to append, rather than full
  nested sortable trees (a notoriously fragile thing to get fully right quickly).
  Deleting/adding nested children works; dragging *between* nesting levels doesn't yet.
  This is the one thing worth taking Formix's existing 30+ field-type builder code and
  cross-pollinating with, if you want that specific interaction back.
- **E2E/unit test suite** — not included; the codebase is structured (pure functions
  in `lib/form-engine`) to be straightforward to test with Vitest/Playwright.

## Project structure

```
app/                    Routes (pages + API)
components/
  builder/              Drag-and-drop builder UI
  renderer/              JSON → live form renderer
  dashboard/             Shell, nav, admin widgets
  marketing/             Landing page pieces
  ui/                    Design-system primitives (custom, not shadcn)
lib/
  form-engine/           Types, field registry, conditional engine, Zod builder, Zustand store
  auth/                  JWT + session helpers
  rbac/                  Permission matrix
  audit/                 Audit log writer
  cloudinary/            Upload helper
  ai/                    Groq form generation
prisma/
  schema.prisma          Full data model
  seed.ts                Demo data
```
