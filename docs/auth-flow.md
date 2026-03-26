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

## Member Profile Claim Flow

After login, users can link their auth account to their existing Sunday School member record:

```mermaid
sequenceDiagram
    participant U as User
    participant D as /dashboard
    participant C as /claim (client)
    participant SB as Supabase
    participant M as members table
    participant P as profiles table
    participant R as Router

    U->>D: Visit dashboard
    D->>SB: getLinkedMember(authUserId)
    SB-->>D: null (not linked)
    D-->>U: Show "Link Now" prompt card

    U->>C: Click "Link Now"
    U->>C: Enter member ID (e.g. ssu/01/03/05/0002)
    C->>SB: SELECT from members WHERE member_id = input

    alt Not found
        SB-->>C: null
        C-->>U: "Member ID not found"
    else Already claimed
        SB-->>C: member with auth_user_id set
        C-->>U: "Already linked to another account"
    else Available
        SB-->>C: unclaimed member record
        C->>M: UPDATE auth_user_id = current user
        C->>P: UPDATE display_name = member's full name
        C-->>U: Toast "Profile linked!"
        C->>R: Redirect to /dashboard
    end
```

## Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UM as UserMenu (client)
    participant SB as Supabase Auth
    participant R as Router

    U->>UM: Click user icon → "Sign out"
    UM->>SB: signOut()
    SB-->>UM: Session cleared, cookies removed
    UM->>R: router.push('/login')
    UM->>R: router.refresh()
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
        MEMBER_R -->|can access| MEM["/(member)/<br/>dashboard, claim, profile,<br/>songbook, attendance, donate"]
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

Uses `get_my_role()` SECURITY DEFINER helper to avoid infinite recursion:

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| Read own profile | SELECT | Any user | `auth.uid() = id` |
| Read all profiles | SELECT | admin, super_admin | `get_my_role() in (...)` |
| Update own profile | UPDATE | Any user | `auth.uid() = id` |
| Update any profile | UPDATE | super_admin | `get_my_role() = 'super_admin'` |

> **Note:** Role protection on profile updates is handled at the application layer (the form only sends `display_name`, never `role`). Department-level scoping for `dept_head` will be handled via Supabase RLS policies on future tables.
