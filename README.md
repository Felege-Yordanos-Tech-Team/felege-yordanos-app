# Felege Yordanos Sunday School App

Single consolidated Sunday School app for Felege Yordanos (Songbook, Attendance, Donations) with role-based access per department.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Nx |
| App | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Mobile | PWA |
| Hosting | Vercel |

## Getting Started

Requirements: Node 22+, pnpm 10 (`corepack enable`), Docker Desktop.

```bash
pnpm install                  # Install dependencies
cp .env.example .env.local    # Local settings (defaults work with Docker)
pnpm db:setup                 # Start Postgres, create tables, load sample data
pnpm dev                      # Start the app at http://localhost:3000
```

Sign in with a seeded test account (password `password123`):

| Role | Email |
|---|---|
| member | member@felege.test |
| dept_head (Songs) | songs.head@felege.test |
| dept_head (Budget) | budget.head@felege.test |
| dept_head (Programs & Events) | events.head@felege.test |
| admin | admin@felege.test |
| super_admin | superadmin@felege.test |

Password reset emails are not sent in development. The reset link is printed in the terminal running `pnpm dev`.

Useful database commands:

```bash
pnpm db:studio                # Browse the local database in the browser
pnpm db:generate              # After editing libs/db/src/schema, create a migration
pnpm db:migrate               # Apply migrations
docker compose down -v        # Wipe the local database (then run pnpm db:setup)
```

## Project Structure

```
felege-yordanos-app/
  apps/web/          # Next.js app (PWA)
    app/
      (public)/      # No auth required (songbook, login)
      (member)/      # Auth required (dashboard, attendance, donate)
      (admin)/       # Admin/dept_head required (manage events, donations, users)
  libs/
    ui/              # Shared UI components (BottomNav)
    db/              # Supabase client + types
```

## Role System

```
member        -> /(member)/ routes
dept_head     -> /(member)/ + /(admin)/ (scoped to department)
admin         -> /(member)/ + /(admin)/ (all departments)
super_admin   -> Unrestricted
```
