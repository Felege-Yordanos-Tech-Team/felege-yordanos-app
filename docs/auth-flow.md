> **Outdated:** this describes the old Supabase Auth flow. Auth now uses Better Auth: see `apps/web/lib/auth.ts`, `apps/web/lib/session.ts` and `apps/web/proxy.ts`. The RLS tables below are still the reference for the permission rules each screen must enforce when ported.

# Authentication & Authorization Flow

## Proxy Request Flow

`proxy.ts` (Next.js 16 convention) runs on every request except static assets.

```mermaid
flowchart TD
    REQ["Incoming Request"] --> MATCHER{Matches proxy?}

    MATCHER -->|No static assets| PASS["Pass through"]
    MATCHER -->|Yes| SUPABASE["Create Supabase client"]

    SUPABASE --> GET_USER["getUser()"]
    GET_USER --> IS_PUBLIC{"/ or /login?"}

    IS_PUBLIC -->|Yes + logged in| REDIRECT_DASH["→ /dashboard"]
    IS_PUBLIC -->|Yes + not logged in| ALLOW["Allow"]
    IS_PUBLIC -->|No| CHECK_AUTH{Authenticated?}

    CHECK_AUTH -->|No| REDIRECT_LOGIN["→ /login"]
    CHECK_AUTH -->|Yes| IS_ADMIN{"/admin/*?"}

    IS_ADMIN -->|No| ALLOW_AUTH["Allow"]
    IS_ADMIN -->|Yes| CHECK_ROLE{role = member?}
    CHECK_ROLE -->|Yes| REDIRECT_DASHBOARD["→ /dashboard"]
    CHECK_ROLE -->|No| ALLOW_ADMIN["Allow"]

    style ALLOW fill:#16a34a,color:#fff
    style ALLOW_AUTH fill:#16a34a,color:#fff
    style ALLOW_ADMIN fill:#16a34a,color:#fff
    style REDIRECT_LOGIN fill:#f59e0b,color:#fff
    style REDIRECT_DASH fill:#3b82f6,color:#fff
    style REDIRECT_DASHBOARD fill:#dc2626,color:#fff
    style PASS fill:#94a3b8,color:#fff
```

## Login / Sign-Up Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as /login
    participant SB as Supabase Auth
    participant DB as profiles table

    alt Sign Up
        LP->>SB: signUp({ email, password })
        SB->>DB: trigger → create profile (role='member')
    else Sign In
        LP->>SB: signInWithPassword({ email, password })
    end

    alt Success
        LP->>U: Redirect to /dashboard
    else Failure
        LP->>U: Show error
    end
```

## Member Claim Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as /claim
    participant SB as Supabase
    participant M as members
    participant P as profiles

    U->>C: Enter member ID
    C->>SB: SELECT from members WHERE member_id = input

    alt Not found
        C-->>U: "Member ID not found"
    else Already claimed
        C-->>U: "Already linked to another account"
    else Available
        C->>M: UPDATE auth_user_id = uid
        C->>P: UPDATE display_name = member name
        C-->>U: Toast "Profile linked!"
        C->>U: Redirect to /dashboard
    end
```

## Donation Flow

```mermaid
sequenceDiagram
    participant M as Member
    participant D as /donate
    participant ST as Supabase Storage
    participant DB as donations table
    participant A as Admin (/admin/donations)

    M->>D: Fill amount, method, notes
    M->>D: Upload receipt image
    D->>ST: Upload to receipts/[uid]/[file]
    D->>DB: INSERT donation (status='pending')
    D-->>M: Toast "Pending verification"

    A->>DB: SELECT all pending donations
    A->>ST: createSignedUrl() for receipt

    alt Verify
        A->>DB: UPDATE status='verified'
    else Reject
        A->>DB: UPDATE status='rejected', rejection_reason
        Note over M: Member sees reason on /donate
    end
```

## Attendance Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant E as /admin/attendance
    participant C as /admin/attendance/[eventId]
    participant DB as Supabase

    A->>E: Create event (title, date, time, dept)
    E->>DB: INSERT event

    A->>C: Open check-in page

    alt Member List tab
        C->>DB: SELECT all active members
        A->>C: Click P/A/L for each member
        C->>DB: UPSERT attendance record
    else Quick Check-in tab
        A->>C: Enter member ID
        C->>DB: SELECT member, UPSERT present
        C-->>A: Toast "[Name] Checked in"
    end
```

## Access Control Summary

```mermaid
graph TD
    subgraph ROLES["Role → Access"]
        direction LR
        ANON["Anonymous"] -->|"/ and /login only"| PUB["Public"]
        MEMBER_R["member"] -->|all member routes| MEM["Member"]
        DH["dept_head"] -->|+ admin routes (own dept)| ADM["Admin"]
        ADMIN_R["admin"] -->|+ admin routes (all depts)| ADM
        SA["super_admin"] -->|+ user management| ALL["Everything"]
    end

    style ANON fill:#94a3b8,color:#fff
    style MEMBER_R fill:#94a3b8,color:#fff
    style DH fill:#f59e0b,color:#fff
    style ADMIN_R fill:#3b82f6,color:#fff
    style SA fill:#ef4444,color:#fff
```

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own + admins (via get_my_role) | Trigger only | Own + super_admin | — |
| members | All authenticated | — | Claim unclaimed + admins | — |
| categories | Authenticated | — | — | — |
| songs | Authenticated | Admin/super_admin | Admin/super_admin | Admin/super_admin |
| departments | Authenticated | Super_admin | Super_admin | Super_admin |
| events | Authenticated | Dept_head (own) + admin | Creator + admin | Creator + admin |
| attendance | Own + dept_head/admin | Dept_head (own) + admin | Dept_head (own) + admin | — |
| donations | Own + admin + Budget dept | Own (donor_id) | Admin + Budget dept | — |
| storage:receipts | Own folder + admin + Budget dept | Own folder | — | — |
