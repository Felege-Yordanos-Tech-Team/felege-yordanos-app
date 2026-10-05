# Felege Yordanos Sunday School App

Single consolidated Sunday School app for Felege Yordanos (Songbook, Attendance, Donations) with role-based access per department.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Nx |
| App | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend/DB | PostgreSQL 17 + Drizzle ORM |
| Auth | Better Auth |
| Mobile | PWA |
| Hosting | Own server with Docker + Kamal (in progress); production still on Vercel |

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

## Production Image (Docker)

The app ships as one Docker image, built from the repo root with `apps/web/Dockerfile`. CI packages the output of its `pnpm build` into the image on every pull request, tests it, and publishes it to GitHub Container Registry after each merge into `dev`.

To run the production image on your computer against your local database:

```bash
pnpm docker:app               # Build the image, apply migrations, start it at http://localhost:3100
```

Stop it with Ctrl+C. Use `pnpm dev` for day-to-day work: it is much faster.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first pull request.

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
    db/              # Drizzle schema, migrations, seed, db client
```

## Role System

```
member        -> /(member)/ routes
dept_head     -> /(member)/ + /(admin)/ (scoped to department)
admin         -> /(member)/ + /(admin)/ (all departments)
super_admin   -> Unrestricted
```
