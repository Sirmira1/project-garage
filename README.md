# 🔧 Garage Build Sheet

An industrial-grade build tracker for project cars — modifications, timeline,
cost analytics, service history, an interactive car diagram, and more.

Inspired by automotive build logs, PCPartPicker, and project-management boards.

![theme](https://img.shields.io/badge/theme-industrial%20dark-FF6A13) ![next](https://img.shields.io/badge/Next.js-15-black) ![prisma](https://img.shields.io/badge/Prisma-6-2D3748)

---

## Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | **Next.js 15** (App Router, RSC, Route Handlers)   |
| Language   | **TypeScript** (strict)                            |
| Styling    | **Tailwind CSS v4** + custom industrial theme      |
| UI         | **shadcn-style** primitives on Radix UI            |
| Data       | **Prisma ORM** + **PostgreSQL**                    |
| Auth       | **Auth.js (NextAuth v5)** — Credentials + JWT      |
| Server state | **TanStack Query (React Query)**                 |
| Local state | **Zustand** (command palette, toasts)             |
| Charts     | **Recharts**                                       |
| Motion     | **Framer Motion** + CSS keyframes                  |
| Validation | **Zod**                                            |

### Design tokens

| Token             | Hex       |
| ----------------- | --------- |
| Asphalt black     | `#1B1B1D` |
| Steel gray        | `#8A8D91` |
| Performance orange| `#FF6A13` |
| Paper white       | `#EDEBE6` |

Dark, industrial theme by default. Fonts: **Archivo Black** (display),
**Inter** (body), **JetBrains Mono** (numeric/labels).

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Provide a PostgreSQL database

**Option A — Docker (recommended):**

```bash
docker compose up -d      # starts Postgres on localhost:5432
```

**Option B — any Postgres** (local install or hosted such as Neon / Supabase /
Prisma Postgres). Put the connection string in `.env`:

```env
DATABASE_URL="postgresql://garage:garage@localhost:5432/garage?schema=public"
AUTH_SECRET="run: npx auth secret"
```

> A ready-to-edit `.env` and `.env.example` are already committed for local dev.

### 3. Create the schema and seed demo data

```bash
npm run db:push      # push the Prisma schema to the database
npm run db:seed      # seed a demo user + 2 fully-loaded vehicles
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in with the pre-filled demo account:

```
email:    demo@garage.dev
password: garage123
```

> In development, if you are not signed in the app falls back to the demo
> user so it is browsable out of the box.

---

## NPM scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server                 |
| `npm run build`   | Production build                     |
| `npm run start`   | Start the production server          |
| `npm run lint`    | ESLint                               |
| `npm run db:push` | Push schema to DB (no migration)     |
| `npm run db:migrate` | Create + apply a dev migration    |
| `npm run db:seed` | Seed demo data                       |
| `npm run db:studio` | Open Prisma Studio                 |
| `npm run db:reset`| Reset DB and re-run migrations/seed  |

---

## Features (MVP shipped)

- **Vehicle management** — unlimited vehicles, full spec sheet, search / filter / sort.
- **Build sheet** — categorized mods with status workflow (Wishlist → Planned →
  Ordered → Installed → Removed), inline status changes, add/delete.
- **Interactive car diagram** — clickable SVG zones (Front / Engine bay /
  Interior / Rear / Underbody) with per-zone mod counts and installed highlights.
- **Build timeline** — chronological event feed with cost + imagery.
- **Cost analytics** — total spent, planned, wishlist value, average & priciest
  mod; spending by category, cumulative spend, monthly spend, build distribution.
- **Photo gallery** — grid + lightbox viewer.
- **Service history** — records table + upcoming-maintenance reminders.
- **Shopping list** — kanban wishlist (Researching → Ready to Buy → Ordered → Installed).
- **Build goals** — progress bars toward targets (e.g. 320 hp, track-day ready).
- **Documents** — dyno sheets, receipts, invoices, alignment sheets, manuals.
- **"Forgotten" trackers** — HP progress, weight reduction, value calculator,
  wheel/tire fitment (built into the vehicle Overview).
- **Extras** — global command palette (⌘/Ctrl + K), CSV export, dark industrial
  theme, responsive (desktop / tablet / mobile), seed data.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for the full picture and what's next.

---

## Project structure

```
prisma/
  schema.prisma        # full data model (14+ models)
  seed.ts              # demo user + 2 vehicles
src/
  app/
    (app)/             # authenticated shell (sidebar + topbar + mobile nav)
      dashboard/       # command center
      garage/          # vehicle grid
      garage/[id]/     # vehicle detail (tabbed: overview…documents)
      analytics/       # garage-wide analytics
      settings/
    api/               # route handlers (vehicles, modifications, auth)
    login/
  components/
    ui/                # shadcn-style primitives (button, card, dialog…)
    app-shell/         # sidebar, topbar, mobile nav
    vehicles/          # garage + vehicle detail feature components
      tabs/            # one component per vehicle-detail tab
    charts.tsx         # Recharts wrappers
    command-palette.tsx
  lib/                 # prisma, auth, analytics, validation, utils, constants
  types/               # DTOs + auth augmentation
```

---

## Notes on security

- All API routes verify ownership (`vehicle.userId === session user`).
- Passwords are hashed with bcrypt; sessions use JWT.
- Input is validated with Zod at the API boundary.
- The dev-only demo fallback is disabled in production.
