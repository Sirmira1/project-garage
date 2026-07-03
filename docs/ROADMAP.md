# Development Roadmap — Garage Build Sheet

## Phase 0 — MVP (shipped in this repo) ✅

- Next.js 15 + TS + Tailwind v4 + Prisma + Auth.js foundation
- Industrial dark theme, fonts, design-system primitives
- Complete Prisma schema (all requested models + "forgotten" trackers + social prep)
- Auth (Credentials + JWT) with dev demo fallback
- App shell: sidebar, topbar, mobile nav, command palette (⌘K)
- **Vehicles**: garage grid, search / filter / sort, create (REST + React Query)
- **Build sheet**: categorized mods, status workflow, add / status-change / delete
- **Interactive car diagram** (clickable SVG zones + counts)
- **Timeline**, **Analytics** (Recharts), **Gallery** (lightbox)
- **Service history** (+ reminders), **Shopping** kanban, **Goals**, **Documents**
- Overview trackers: **HP progress**, **weight reduction**, **value calculator**, **fitment**
- CSV export, seed data, dashboard, garage-wide analytics, settings

## Phase 1 — Complete CRUD & persistence

- Route handlers + dialogs for service, goals, documents, shopping, fitment, dyno
- Edit/update flows for vehicles and mods (not just create/delete)
- File uploads (cover images, photos, documents) via a storage adapter
  (local disk in dev, S3/R2 in prod) instead of URL strings
- Drag-and-drop reordering for the shopping kanban and photo gallery
- Optimistic updates across mutations

## Phase 2 — Depth features

- **Dyno & performance records** page with HP/torque graphed over time
- **Build versions** ("v1.0 / v2.0" release notes grouping mods)
- **Garage journal** (daily log) feeding the timeline
- **Budget mode** (annual budget vs. spend with progress)
- **Before/After** image comparison slider
- **PDF build report** generation (server-side render → PDF)
- Rich-text / markdown **notes** editor with checklists + attachments
- Global full-text search backend (Postgres `tsvector` or Meilisearch)
- Keyboard shortcut layer (g-then-key navigation)

## Phase 3 — Social ("Garage OS")

Schema is already prepared (`isPublic`, `publicSlug`, `Follow`, `Like`,
`Comment`).

- Public build pages at `/u/[user]/[slug]`
- Likes, comments, followers, build showcases
- OG image generation for shared builds
- Discover / trending feed

## Phase 4 — Platform & polish

- OAuth providers (Google/GitHub) alongside Credentials
- Multi-theme support (light + custom accent)
- Mobile PWA / offline cache
- Data import/export (full CSV + JSON backup/restore)
- Role-based sharing (read-only build links)
- Test suite (Vitest unit + Playwright e2e) and CI

## Suggested milestones

| Milestone | Scope                                   |
| --------- | --------------------------------------- |
| M1        | Phase 1 CRUD + uploads                  |
| M2        | Phase 2 dyno + versions + PDF report    |
| M3        | Phase 3 public pages + social           |
| M4        | Phase 4 platform hardening + tests      |
