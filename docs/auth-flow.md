# Authentication & Authorization Flow

## Proxy (Middleware) Request Flow

The `proxy.ts` file (Next.js 16 convention, replaces `middleware.ts`) runs on every request except static assets. It handles auth checks before the page renders.

```mermaid
flowchart TD
    REQ["Incoming Request"] --> MATCHER{Matches proxy<br/>matcher pattern?}

    MATCHER -->|"No (static assets,<br/>images, favicon)"| PASS_THROUGH["Pass through<br/>(no auth check)"]
    MATCHER -->|Yes| SUPABASE["Create Supabase<br/>server client<br/>(reads cookies)"]

    SUPABASE --> GET_USER["supabase.auth.getUser()"]
    GET_USER --> CHECK_LOGIN{Is /login route?}

    CHECK_LOGIN -->|Yes| CHECK_LOGGED_IN{User logged in?}
    CHECK_LOGGED_IN -->|Yes| REDIRECT_DASH["↩️ Redirect to /dashboard"]
    CHECK_LOGGED_IN -->|No| ALLOW["✅ Allow request<br/>(show login page)"]

    CHECK_LOGIN -->|No| CHECK_AUTH{User authenticated?}

    CHECK_AUTH -->|No| REDIRECT_LOGIN["↩️ Redirect to /login"]
    CHECK_AUTH -->|Yes| CHECK_ADMIN{Route starts<br/>with /admin?}

    CHECK_ADMIN -->|No| ALLOW_AUTH["✅ Allow request"]
    CHECK_ADMIN -->|Yes| FETCH_ROLE["Fetch profile.role<br/>from Supabase DB"]

    FETCH_ROLE --> CHECK_ROLE{role = 'member'<br/>or no profile?}
    CHECK_ROLE -->|Yes| REDIRECT_DASHBOARD["↩️ Redirect to /dashboard"]
    CHECK_ROLE -->|No| ALLOW_ADMIN["✅ Allow request"]

    style ALLOW fill:#16a34a,color:#fff
    style ALLOW_AUTH fill:#16a34a,color:#fff
    style ALLOW_ADMIN fill:#16a34a,color:#fff
    style REDIRECT_LOGIN fill:#f59e0b,color:#fff
    style REDIRECT_DASH fill:#3b82f6,color:#fff
    style REDIRECT_DASHBOARD fill:#dc2626,color:#fff
    style PASS_THROUGH fill:#94a3b8,color:#fff
```

## Proxy Matcher

The proxy skips these patterns (no auth overhead):
- `_next/static/*` — Next.js static assets
- `_next/image/*` — Next.js image optimization
- `favicon.ico` — Browser icon
- `manifest.json`, `manifest.webmanifest` — PWA manifest
- `*.svg`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp` — Image files

## Login / Sign-Up Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as /login (client)
    participant SB as Supabase Auth
    participant DB as profiles table
    participant R as Router

    U->>LP: Enter email + password

    alt Sign Up (new account)
        U->>LP: Click "Sign Up"
        LP->>SB: signUp({ email, password })
        SB->>DB: INSERT auth.users triggers<br/>handle_new_user()
        DB->>DB: Auto-create profile<br/>(role = 'member')
        SB-->>LP: Session + cookies set
    else Sign In (existing account)
        U->>LP: Click "Sign In"
        LP->>SB: signInWithPassword({ email, password })
        SB-->>LP: Session + cookies set
    end

    alt Auth Success
        LP->>R: router.push('/dashboard')
        LP->>R: router.refresh()
        R-->>U: Show member dashboard
    else Auth Failure
        SB-->>LP: Error object
        LP-->>U: Display error in destructive color
    end
```

## Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LB as LogoutButton (client)
    participant SB as Supabase Auth
    participant R as Router

    U->>LB: Click "Sign out"
    LB->>SB: signOut()
    SB-->>LB: Session cleared, cookies removed
    LB->>R: router.push('/login')
    LB->>R: router.refresh()
    R-->>U: Show login page
```

## Cookie Management

The proxy manages Supabase auth cookies on every request:

```mermaid
flowchart LR
    subgraph READ["getAll()"]
        R1["Read all cookies<br/>from request"]
    end

    subgraph WRITE["setAll()"]
        W1["Set cookies on<br/>request object"]
        W2["Create new response<br/>with updated request"]
        W3["Set cookies on<br/>response object"]
        W1 --> W2 --> W3
    end

    READ --> SUPABASE["Supabase SSR Client"]
    WRITE --> SUPABASE

    style SUPABASE fill:#3ecf8e,color:#fff
```

This ensures auth tokens are refreshed transparently on every request, keeping the session alive without user interaction.

## Access Control Summary

```mermaid
graph TD
    subgraph ROLES["Role → Access Matrix"]
        direction LR
        ANON["Anonymous"] -->|can access| PUB["/(public)/<br/>login only"]
        ANON -->|redirected to /login| BLOCKED["All other routes"]
        MEMBER_R["member"] -->|can access| PUB
        MEMBER_R -->|can access| MEM["/(member)/<br/>dashboard, songbook,<br/>attendance, donate"]
        MEMBER_R -->|redirected to /dashboard| ADM_BLOCKED["/(admin)/ routes"]
        DH["dept_head"] -->|can access| MEM
        DH -->|can access| ADM["/(admin)/<br/>scoped to department"]
        ADMIN_R["admin"] -->|can access| MEM
        ADMIN_R -->|can access| ADM
        SA["super_admin"] -->|can access| MEM
        SA -->|can access| ADM
    end

    style ANON fill:#94a3b8,color:#fff
    style MEMBER_R fill:#94a3b8,color:#fff
    style DH fill:#f59e0b,color:#fff
    style ADMIN_R fill:#3b82f6,color:#fff
    style SA fill:#ef4444,color:#fff
    style PUB fill:#f0fdf4,stroke:#16a34a
    style MEM fill:#eff6ff,stroke:#2563eb
    style ADM fill:#fef2f2,stroke:#dc2626
    style BLOCKED fill:#fef2f2,stroke:#dc2626
    style ADM_BLOCKED fill:#fef2f2,stroke:#dc2626
```

## Database: Profile Auto-Creation

When a user signs up, a PostgreSQL trigger automatically creates their profile:

```mermaid
sequenceDiagram
    participant AUTH as auth.users
    participant TRG as handle_new_user()
    participant PRO as public.profiles

    AUTH->>TRG: AFTER INSERT trigger
    TRG->>PRO: INSERT (id, display_name, role='member')
    Note over TRG,PRO: display_name = user's email<br/>(or raw_user_meta_data.display_name)
```

## RLS Policies on profiles

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| Read own profile | SELECT | Any user | `auth.uid() = id` |
| Read all profiles | SELECT | admin, super_admin | Role check via subquery |
| Update own profile (except role) | UPDATE | Any user | `auth.uid() = id` AND role unchanged |
| Update any profile | UPDATE | super_admin | Role check via subquery |

> **Note:** Department-level scoping for `dept_head` is planned but not yet enforced at the proxy level. Currently, the proxy only checks that the role is not `member` for `/admin/*` routes. Finer-grained department scoping will be handled via Supabase RLS policies on the database.
