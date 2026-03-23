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

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase keys

# Start dev server
npx nx serve web

# Production build
npx nx build web

# Lint
npx nx lint web
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
