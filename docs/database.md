# Database

PostgreSQL 17 with Drizzle ORM. Everything lives in `libs/db`:

| Path | What |
|---|---|
| `src/schema/app.ts` | application tables (mirrors the original production schema) |
| `src/schema/auth.ts` | Better Auth tables |
| `src/server.ts` | server-only `db` client: `import { db } from '@felege-yordanos/db/server'` |
| `migrations/` | generated SQL migrations (never edit applied ones) |
| `scripts/seed.ts` | sample data and test logins |

## Tables

| Table | Purpose |
|---|---|
| departments | the 9 departments (ids set explicitly) |
| profiles | one per login: role, department, display name |
| members, member_types, member_jobs, member_academic_education, member_spiritual_education | parish member register |
| categories, songs | songbook |
| events, attendance | events (incl. recurring series) and check-ins |
| donations | donations; receipt file key in `receipt_url` |
| auth_users, auth_sessions, auth_accounts, auth_verifications | Better Auth |

`members.auth_user_id` links a login to a member record (set by the `/claim` flow).

## Workflow

```bash
pnpm db:setup        # start Postgres (Docker), migrate, seed
# edit libs/db/src/schema/*.ts
pnpm db:generate     # creates libs/db/migrations/NNNN_name.sql; commit it
pnpm db:migrate      # apply
pnpm db:studio       # browse data
docker compose down -v && pnpm db:setup   # wipe and start over
```

## Files

Receipts are stored on disk under `UPLOAD_DIR` (default `apps/web/.data/uploads`, git-ignored) and served by `app/api/receipts/[...key]` after a permission check. On the server this folder is a Docker volume that must be included in backups.
