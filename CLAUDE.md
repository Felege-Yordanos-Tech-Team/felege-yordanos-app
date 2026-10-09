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
| Files      | Cloudflare R2 in staging/production, local disk in development (`apps/web/lib/storage.ts`, `STORAGE_DRIVER`) |
| Mobile     | PWA (Progressive Web App via `@ducanh2912/next-pwa`)               |
| Hosting    | Own VPS with Kamal 2 behind Cloudflare. `dev` deploys to staging.felegeyordanos.org, `main` to app.felegeyordanos.org |
| GitHub     | github.com/Felege-Yordanos-Tech-Team/felege-yordanos-app (public)  |

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
  lib/storage.ts       # file storage: R2 or local disk (receipts, song audio)
  lib/media.ts         # media types, size limits, keys, URLs (safe anywhere)
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

Email verification (6-digit code, Better Auth Email OTP, page `/verify-email`): until `auth_users.email_verified` is true, `lib/session.ts` gives the user `role: 'member'` and `departmentId: null` (songbook + profile only; `assignedRole` is for UI text only). Use `requireVerifiedEmail()` / `requireLinkedMember()` / `hasMemberAccess()`.

## Key Architecture Decisions

- Single app with route groups: `/(public)/`, `/(member)/`, `/(admin)/`
- 9 departments, each with dept_head(s) scoped by `department_id`
- Programs & Events dept gets cross-department read on events/attendance
- Budget & Asset Management dept owns donation verification
- Payment MVP: manual bank transfer + receipt upload (no Chapa/Telebirr API — requires business license)
- Notice board (`/notices`, `/admin/notices`): admins post for everyone or any department, dept heads for their own; all linked members see all notices (department filter); expired notices are hidden from members, shown to staff. Type, optional summary and image; unread tracking in `notice_reads` (a notice is read once it is shown in the big card or phone carousel). New/edit in a dialog (`components/notices/notice-form-dialog.tsx`). Rules: `canPostNotice`, `canEditNotice`, `canViewNotices`; reads in `lib/notice-queries.ts`
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
pnpm docker:app           # Run the production Docker image locally (http://localhost:3100)
npx nx serve web          # Start dev server
npx nx build web          # Production build
npx nx lint web           # Lint
npx nx graph              # View project dependency graph
```

## Environment Variables

See `.env.example` (copy to `.env.local` at the repo root): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, optional `UPLOAD_DIR`, email: `EMAIL_TRANSPORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.

Google sign-in (optional locally): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth client `felege-web`, Google Cloud project `felege-yordanos-511106`; GitHub environment secrets of the same names in `staging` and `production`). Without both, `googleEnabled` in `lib/auth.ts` is false and the "Continue with Google" button is hidden. A Google sign-in joins an existing account with the same email only when that account's email is verified (otherwise `/login?error=account_not_linked`). Google emails count as verified, so no code step.

Email (`lib/email.ts`, templates in `lib/email-templates.ts`, Amharic in `lib/i18n/dict/email.ts`): `EMAIL_TRANSPORT=console` (default in development) prints emails in the terminal running the app; `smtp` sends them. Staging and production send through Brevo (SMTP relay, sender `no-reply@felegeyordanos.org`; GitHub environment secrets `BREVO_SMTP_LOGIN`, `BREVO_SMTP_KEY`). Emails are bilingual (Amharic first) with an HTML and a plain-text part. Test locally with Mailpit: see `.env.example`.
Seeded test logins (password `password123`): member@, songs.head@ (dept 6), budget.head@ (dept 9), events.head@ (dept 3), admin@, superadmin@ — all `@felege.test`.

## File Storage

- `lib/storage.ts`, driver from `STORAGE_DRIVER`: `local` (default; files under `UPLOAD_DIR`, media under `UPLOAD_DIR/media`) or `s3` (Cloudflare R2 with `aws4fetch`; needs `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_UPLOADS_BUCKET`, `R2_MEDIA_BUCKET`, checked at startup by `instrumentation.ts`)
- Two stores. `uploads`: private files (receipts at `receipts/<user id>/<file>`), streamed through `app/api/receipts` after `canViewReceipt`, never a bucket URL. `media`: song audio (`audio/<uuid>.<ext>`) and notice images (`notices/<uuid>.<ext>`); `app/api/media` checks `canViewMedia`, then redirects to a 1-hour signed R2 link (local: streams from disk with Range). Never put personal files in `media` (it may get a public CDN domain later)
- Buckets per environment: `felege-<env>-uploads`, `felege-<env>-media` (account `0326e8f0de2b1237ae40a2279667047e`, all private). CORS (PUT from the app origin) only on the media buckets. One R2 API token per environment; GitHub environment secrets `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Song audio (max 30 MB) goes from the browser straight to R2: `requestAudioUpload` returns a 5-minute signed PUT link (local: `/api/media-upload`), saving the song checks the file (HEAD). Replacing or deleting deletes the old file
- The PWA service worker never caches `/api/*` or R2 (`next.config.js`)
- Receipts uploaded before R2 are copied with `node scripts/copy-uploads-to-r2.mjs` in the app container (idempotent, prints counts only)

## Docker Image

- `apps/web/Dockerfile`, built from the repo root, base `node:22-slim`. Next.js `output: 'standalone'` with `outputFileTracingRoot` at the repo root
- Two targets, same result: `app` (default, self-contained: installs and builds inside Docker; used by `pnpm docker:app`) and `prebuilt` (CI: packages the output of `pnpm build`, no second install or build)
- Image layout comes from one script for both targets: `apps/web/scripts/assemble-image.sh <out-dir>`
- Runtime: `node apps/web/server.js` as user `node`, port 3000, uploads in `/data/uploads` (volume). Health check: `GET /up` (app + database)
- Migrations in the image: `node db/scripts/migrate.mjs` (bundled from `libs/db/scripts/migrate.mjs`, no drizzle-kit). Run before starting a new version
- New source folders or files at the top of `apps/web` must be added to `outputFileTracingExcludes` in `next.config.js`, or they end up in the image
- CI (job "Lint, typecheck, migrations, build") builds the image after `pnpm build`, runs migrations + a smoke test (health, login page, sign-in), and publishes `ghcr.io/felege-yordanos-tech-team/felege-yordanos-app:<sha>` plus `:dev` or `:main` after merges into `dev` or `main`

## Deployment (Kamal)

- Config: `config/deploy.yml` (shared) + `config/deploy.<destination>.yml` for `staging` and `production`. Secrets mapping: `.kamal/secrets.<destination>` (only references env vars; never real values). No server IP or secret in the repo
- Every push to `dev` runs CI job "Deploy to staging", every push to `main` runs "Deploy to production": `kamal deploy -d <destination> --skip-push --version <sha>` (first run: `kamal setup`). Secrets come from the GitHub environment of the same name (`staging` only for `dev`, `production` only for `main`)
- Containers per destination: `felege-web-<destination>` (app, waits for the database, runs migrations, then starts the server) and `felege-db-<destination>` (Postgres 17 accessory, no published port, volume `felege-<destination>-pgdata`). Uploads: volume `felege-<destination>-uploads`. Both destinations run on the same server
- Cloudflare proxies `staging.felegeyordanos.org` and `app.felegeyordanos.org` (SSL mode Full (strict)); kamal-proxy serves the Cloudflare origin certificate (`*.felegeyordanos.org`)
- Reference data that the code depends on (departments, member types) is added by migrations, not by the seed
- Members come from the Sunday School register: `libs/db/scripts/members-from-register.py` (real data in production only; `--fake N` for staging). The export and the generated SQL contain personal data and never go into the repo
- Server setup (users, firewall, Docker, database backups) lives in the private repo `felege-yordanos-infra`

## Design System, Language and Theme

- Target look: the Felege Yordanos Claude Design project (ask the tech team lead for access). Match it on phone (< md) and desktop (md+). Do not commit design exports, screenshots or prototype code to the repo
- Colors: Tailwind tokens only (`brand`, `gold`, `parchment`, `ink`, `cream`, `status-*`), defined as CSS variables in `app/global.css` for light and dark. Never hardcode hex colors in classNames
- Fonts: `font-ethiopic` (Amharic), `font-display` (Cormorant titles), `font-body` (Inter), `font-mono` (IDs, times, amounts). Fonts are bundled with @fontsource
- Building blocks: `components/ds` (Card, Eyebrow, Chip, PageHead, SectionHeader, StatusPill)
- Language: Amharic by default, English toggle (cookie `fy-lang`). `?lang=en` or `?lang=am` on any URL sets it too (`proxy.ts`; used for Google's reviewers: `/privacy?lang=en`). Write English in code and translate it: server `const t = await getT()` (`@/lib/i18n/server`), client `const t = useT()` (`@/lib/i18n/client`). Add Amharic to `lib/i18n/dict/<area>.ts`. Headings use `SectionHeader` / `PageHead` (current language big, other language as eyebrow). Dates and numbers via `Intl` with `intlLocale(locale)`
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
- Only maintainers merge `dev` into `main` (production), after testing on staging
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
