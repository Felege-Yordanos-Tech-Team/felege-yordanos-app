# Felege Yordanos Sunday School App

## About

Single consolidated app for Felege Yordanos Sunday School (Songbook, Attendance, Donations) with role-based access for 9 departments.

## Owner

Leykun Gizaw, Tech Team Lead at Felege Yordanos Sunday School. Email: leykungizaw@gmail.com

## Tech Stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Monorepo   | Nx (v22)                                                           |
| App        | Next.js (App Router) — single app at `apps/web/`                   |
| Language   | TypeScript (strict)                                                |
| Styling    | Tailwind CSS + shadcn/ui                                           |
| Backend/DB | Supabase (PostgreSQL) — project ID: `uoaigpdabiswykfjyznv`         |
| Auth       | Supabase Auth via `@supabase/ssr`                                  |
| Mobile     | PWA (Progressive Web App via `@ducanh2912/next-pwa`)               |
| Hosting    | Vercel (free tier)                                                 |
| GitHub     | github.com/Felege-Yordanos-Tech-Team/felege-yordanos-app (private) |

## Project Structure

```
apps/web/              # Single Next.js app (PWA)
  app/
    (public)/          # No auth: songbook, login
    (member)/          # Any authenticated user
    (admin)/           # dept_head, admin, super_admin only
  proxy.ts             # Role-based route protection (Next.js 16 "proxy" convention)
  lib/utils.ts         # cn() utility for Tailwind class merging
libs/
  ui/                  # Shared UI components (BottomNav)
  db/                  # Supabase client (browser + server) + DB types
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
- DB schema/types (safe anywhere): `import type { Role } from '@felege-yordanos/db/schema'`
- UI components: `import { BottomNav } from '@felege-yordanos/ui'`
- Legacy Supabase client (being removed): `import { createClient, createServerComponentClient } from '@felege-yordanos/db'`
- DB types: `import type { Database, UserRole } from '@felege-yordanos/db'`

## Package Manager

pnpm (v10). Workspace packages use `workspace:*` protocol for inter-lib deps.

## Commands

```bash
pnpm install              # Install all dependencies
pnpm db:setup             # Start local Postgres (Docker), migrate, seed
pnpm db:generate          # Create a migration after changing libs/db/src/schema
pnpm db:studio            # Browse the local database
npx nx serve web          # Start dev server
npx nx build web          # Production build
npx nx lint web           # Lint
npx nx graph              # View project dependency graph
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://uoaigpdabiswykfjyznv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Migration Status

Moving off Vercel and Supabase to a self-hosted server (Postgres + Drizzle, Better Auth, Kamal).

- Done: local Postgres + Drizzle schema mirroring the Supabase tables (`libs/db`)
- Next: replace Supabase Auth, then port features one by one to server actions
- Authorization rules that lived in RLS must be enforced in server code when a feature is ported

## Rules

- Database schema lives in `libs/db/src/schema/` (Drizzle). Change it there, then run `pnpm db:generate` to create a migration. Never edit applied migration files
- Supabase is being removed (see Migration Status). Do NOT add new Supabase usage
- Never import `@felege-yordanos/db/server` from a `'use client'` file
- Do NOT install React Native or Expo — this is a PWA
- Do NOT create multiple apps — there is one app: `apps/web/`
- Do NOT use `pages/` router — App Router only
- Do NOT use Turborepo — this is Nx

## Terms

| Term        | Meaning                                 |
| ----------- | --------------------------------------- |
| SS          | Sunday School                           |
| RLS         | Row Level Security (Supabase)           |
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
