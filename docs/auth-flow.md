# Authentication and Permissions

## Authentication (Better Auth)

- Config: `apps/web/lib/auth.ts`. Tables: `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications` (`libs/db/src/schema/auth.ts`).
- Email + password. New passwords need 8+ characters.
- On sign-up a `profiles` row is created with role `member`.
- Password reset: `/forgot-password` sends an email with a link to `/reset-password?token=...`. In development the email is printed in the terminal (`lib/email.ts`).
- Sessions last 30 days. A signed copy is cached in a cookie for 5 minutes so most requests skip the database.

## Getting the current user

```ts
import { requireUser, requireRole, getCurrentUser } from '@/lib/session';

const user = await requireUser();          // redirects to /login if signed out
// user: { id, email, displayName, role, departmentId }
```

These are cached per request, so a layout and a page share one lookup.

In client components: `import { authClient } from '@/lib/auth-client'` for `signIn`, `signUp`, `signOut`.

## Route protection

1. `proxy.ts`: redirects to `/login` when there is no session cookie. Fast, no database call, NOT a security check.
2. Layouts: `(member)` calls `requireUser()`, `(admin)` calls `requireRole(['dept_head','admin','super_admin'])`.
3. Pages and server actions: check the exact rule in `lib/permissions.ts`.

## Permission rules (`lib/permissions.ts`)

| Area | Read | Write |
|---|---|---|
| Songs, categories | any signed-in user | `canManageSongs`: admin, or dept_head of Songs (6) |
| Events | any signed-in user | create `canCreateEvent` (admin, or dept_head for own dept); edit/delete `canEditEvent` (creator or admin) |
| Attendance | own records; `canViewEventAttendance` | `canMarkAttendance`: admin, or dept_head of the event's dept |
| Donations | own; all with `canReviewDonations` (admin, Budget head 9) | create own; verify/reject with `canReviewDonations` |
| Receipts | `canViewReceipt`: donor or reviewer | upload with own donation |
| Profiles | own; all with `canViewAllProfiles` (admin) | own display name; role/department with `canManageUsers` (super_admin) |
| Members | any signed-in user | claim own unclaimed record; `canEditMembers` (admin) |
