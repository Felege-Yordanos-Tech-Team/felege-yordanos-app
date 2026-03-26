# Authentication & Authorization Flow

## Proxy (Middleware) Request Flow

The `proxy.ts` file (Next.js 16 convention, replaces `middleware.ts`) runs on every request except static assets. It handles auth checks before the page renders.

```mermaid
flowchart TD
    REQ["Incoming Request"] --> MATCHER{Matches proxy<br/>matcher pattern?}

    MATCHER -->|"No (static assets,<br/>images, favicon)"| PASS_THROUGH["Pass through<br/>(no auth check)"]
    MATCHER -->|Yes| SUPABASE["Create Supabase<br/>server client<br/>(reads cookies)"]

    SUPABASE --> GET_USER["supabase.auth.getUser()"]
    GET_USER --> CHECK_PUBLIC{Is public route?<br/>/songbook, /login, /}

    CHECK_PUBLIC -->|Yes| ALLOW["✅ Allow request<br/>(return response)"]
    CHECK_PUBLIC -->|No| CHECK_AUTH{User authenticated?}

    CHECK_AUTH -->|No| REDIRECT_LOGIN["↩️ Redirect to /login"]
    CHECK_AUTH -->|Yes| CHECK_ADMIN{Route starts<br/>with /admin?}

    CHECK_ADMIN -->|No| ALLOW
    CHECK_ADMIN -->|Yes| FETCH_ROLE["Fetch profile.role<br/>from Supabase DB"]

    FETCH_ROLE --> CHECK_ROLE{role = 'member'<br/>or no profile?}
    CHECK_ROLE -->|Yes| REDIRECT_HOME["↩️ Redirect to /"]
    CHECK_ROLE -->|No| ALLOW

    style ALLOW fill:#16a34a,color:#fff
    style REDIRECT_LOGIN fill:#f59e0b,color:#fff
    style REDIRECT_HOME fill:#dc2626,color:#fff
    style PASS_THROUGH fill:#94a3b8,color:#fff
```

## Proxy Matcher

The proxy skips these patterns (no auth overhead):
- `_next/static/*` — Next.js static assets
- `_next/image/*` — Next.js image optimization
- `favicon.ico` — Browser icon
- `manifest.json`, `manifest.webmanifest` — PWA manifest
- `*.svg`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp` — Image files

## Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as /login (client)
    participant SB as Supabase Auth
    participant R as Router

    U->>LP: Enter email + password
    U->>LP: Submit form
    LP->>SB: signInWithPassword({ email, password })

    alt Auth Success
        SB-->>LP: Session + cookies set
        LP->>R: router.push('/')
        LP->>R: router.refresh()
        R-->>U: Redirect to /songbook (via landing page redirect)
    else Auth Failure
        SB-->>LP: Error object
        LP-->>U: Display error message
    end
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
        ANON["Anonymous"] -->|can access| PUB["/(public)/<br/>songbook, login"]
        MEMBER_R["member"] -->|can access| PUB
        MEMBER_R -->|can access| MEM["/(member)/<br/>dashboard, attendance, donate"]
        DH["dept_head"] -->|can access| PUB
        DH -->|can access| MEM
        DH -->|can access| ADM["/(admin)/<br/>scoped to department"]
        ADMIN_R["admin"] -->|can access| PUB
        ADMIN_R -->|can access| MEM
        ADMIN_R -->|can access| ADM
        SA["super_admin"] -->|can access| PUB
        SA -->|can access| MEM
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
```

> **Note:** Department-level scoping for `dept_head` is planned but not yet enforced at the middleware level. Currently, middleware only checks that the role is not `member` for `/admin/*` routes. Finer-grained department scoping will be handled via Supabase RLS policies on the database.
