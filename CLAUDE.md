# Felege Yordanos Sunday School App

## About

Single consolidated app for Felege Yordanos Sunday School (Songbook, Attendance, Donations) with role-based access for 9 departments.

## Owner

Leykun Gizaw, Tech Team Lead at Felege Yordanos Sunday School.

## Tech Stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Monorepo   | Nx (v22)                                                           |
| App        | Next.js (App Router) — single app at `apps/web/`                   |
| Language   | TypeScript (strict)                                                |
| Styling    | Tailwind CSS + shadcn/ui                                           |
| Backend/DB | PostgreSQL 17 + Drizzle (`libs/db`)                                |
| Auth       | Better Auth (`apps/web/lib/auth.ts`), sessions in Postgres         |
| Files      | Local disk via `apps/web/lib/storage.ts` (`UPLOAD_DIR`)            |
| Mobile     | PWA (Progressive Web App via `@ducanh2912/next-pwa`)               |
| Hosting    | Target: own VPS (Docker + Kamal). `main` still deploys the old Vercel + Supabase version |
| GitHub     | github.com/Felege-Yordanos-Tech-Team/felege-yordanos-app (private) |

## Project Structure

```
apps/web/              # Single Next.js app (PWA)
  app/
    (public)/          # No auth: songbook, login
    (member)/          # Any authenticated user
    (admin)/           # dept_head, admin, super_admin only
  proxy.ts             # Fast session-cookie check only (NOT the security boundary)
  lib/session.ts       # requireUser / requireRole / getCurrentUser (server)
  lib/permissions.ts   # ALL authorization rules
  lib/action-result.ts # ActionResult type for server actions
  lib/storage.ts       # file uploads on disk (receipts)
  lib/auth.ts          # Better Auth config; lib/auth-client.ts for the browser
libs/
  ui/                  # Shared UI components (BottomNav)
  db/                  # Drizzle schema, migrations, seed, server-only db client
```

## Role System (Four Tiers)

```
member        -> /(member)/ routes only
dept_head     -> /(member)/ + /(admin)/ — scoped to their department
admin         -> /(member)/ + /(admin)/ — sees all departments
super_admin   -> Unrestricted
```

Roles stored in `profiles` table (column: `role`). Department scoping via `department_id`.

## Key Architecture Decisions

- Single app with route groups: `/(public)/`, `/(member)/`, `/(admin)/`
- 9 departments, each with dept_head(s) scoped by `department_id`
- Programs & Events dept gets cross-department read on events/attendance
- Budget & Asset Management dept owns donation verification
- Payment MVP: manual bank transfer + receipt upload (no Chapa/Telebirr API — requires business license)
- Dept heads delegate by requesting admin/super_admin to grant `dept_head` role

## Library Imports

- DB (new, server only): `import { db, songs } from '@felege-yordanos/db/server'`
- Current user (server only): `import { requireUser, requireRole, getCurrentUser } from '@/lib/session'`
- Auth in client components: `import { authClient } from '@/lib/auth-client'`
- DB schema/types (safe anywhere): `import type { Role } from '@felege-yordanos/db/schema'`
- UI components: `import { BottomNav } from '@felege-yordanos/ui'`
- Permissions: `import { canManageSongs, ... } from '@/lib/permissions'`
- Server action results: `import { ok, fail, NOT_ALLOWED, type ActionResult } from '@/lib/action-result'`

## Package Manager

pnpm (v10). Workspace packages use `workspace:*` protocol for inter-lib deps.

## Commands

```bash
pnpm install              # Install all dependencies
pnpm db:setup             # Start local Postgres (Docker), migrate, seed
pnpm db:generate          # Create a migration after changing libs/db/src/schema
pnpm db:studio            # Browse the local database
pnpm check                # Lint + typecheck + build (same as CI); run before every push
npx nx serve web          # Start dev server
npx nx build web          # Production build
npx nx lint web           # Lint
npx nx graph              # View project dependency graph
```

## Environment Variables

See `.env.example` (copy to `.env.local` at the repo root): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, optional `EMAIL_TRANSPORT`, optional `UPLOAD_DIR`.

Dev emails (password reset links) are printed in the terminal running the app.
Seeded test logins (password `password123`): member@, songs.head@ (dept 6), budget.head@ (dept 9), events.head@ (dept 3), admin@, superadmin@ — all `@felege.test`.

## Design System, Language and Theme

- Target look: the Felege Yordanos Claude Design project (ask the tech team lead for access). Match it on phone (< md) and desktop (md+). Do not commit design exports, screenshots or prototype code to the repo
- Colors: Tailwind tokens only (`brand`, `gold`, `parchment`, `ink`, `cream`, `status-*`), defined as CSS variables in `app/global.css` for light and dark. Never hardcode hex colors in classNames
- Fonts: `font-ethiopic` (Amharic), `font-display` (Cormorant titles), `font-body` (Inter), `font-mono` (IDs, times, amounts). Fonts are bundled with @fontsource
- Building blocks: `components/ds` (Card, Eyebrow, Chip, PageHead, SectionHeader, StatusPill)
- Language: Amharic by default, English toggle (cookie `fy-lang`). Write English in code and translate it: server `const t = await getT()` (`@/lib/i18n/server`), client `const t = useT()` (`@/lib/i18n/client`). Add Amharic to `lib/i18n/dict/<area>.ts`. Headings use `SectionHeader` / `PageHead` (current language big, other language as eyebrow). Dates and numbers via `Intl` with `intlLocale(locale)`
- Theme: light/dark via next-themes (`class` on `<html>`); tokens switch automatically

## How Features Are Built

- Pages are async server components: `requireUser()`, permission check from `lib/permissions.ts`, then read with Drizzle
- Mutations are server actions in an `actions.ts` next to the page: `requireUser()` -> zod validation -> permission check on rows re-loaded from the DB -> write -> `revalidatePath` -> return `ok()` / `fail()`
- Never trust ids, roles or user ids sent from the client
- Client components keep UI only; they call server actions and show `res.error` in a toast
- Reference implementation: songbook (`app/(member)/songbook`, `app/(admin)/admin/songs`)

## Rules

- Database schema lives in `libs/db/src/schema/` (Drizzle). Change it there, then run `pnpm db:generate` to create a migration. Never edit applied migration files
- Supabase has been removed. Do NOT add Supabase or any other hosted backend SDK
- Every page and server action must enforce the matching rule in `lib/permissions.ts`. Add new rules there, not inline
- Team workflow is in CONTRIBUTING.md: branch from `dev`, PR into `dev`, CI (.github/workflows/ci.yml) must pass
- Do not merge `dev` into `main` until the new server is live (main still deploys the old Vercel + Supabase version)
- Never import `@felege-yordanos/db/server` from a `'use client'` file
- Do NOT install React Native or Expo — this is a PWA
- Do NOT create multiple apps — there is one app: `apps/web/`
- Do NOT use `pages/` router — App Router only
- Do NOT use Turborepo — this is Nx

## Terms

| Term        | Meaning                                 |
| ----------- | --------------------------------------- |
| SS          | Sunday School                           |
| PWA         | Progressive Web App                     |
| dept_head   | Role for department leaders + delegates |
| admin       | Role for tech team members (~8 people)  |
| super_admin | Full control (Leykun)                   |

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
