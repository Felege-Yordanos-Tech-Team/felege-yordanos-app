# Database Schema & Migrations

## Overview

The app uses Supabase (PostgreSQL) with Row Level Security (RLS). The database is managed separately via the Supabase dashboard — SQL migrations are stored in `supabase/migrations/` and run manually.

## Entity Relationship

```mermaid
erDiagram
    AUTH_USERS["auth.users (Supabase managed)"] {
        uuid id PK
        text email
        jsonb raw_user_meta_data
        timestamptz created_at
    }

    PROFILES["public.profiles"] {
        uuid id PK "FK → auth.users.id"
        text display_name "email or custom name"
        text full_name "optional"
        text role "member | dept_head | admin | super_admin"
        uuid department_id "FK → departments (future)"
        timestamptz created_at
    }

    MEMBERS["public.members"] {
        bigint id PK
        text member_id UK "e.g. ssu/01/03/05/0578"
        text name "ስም"
        text father_name "የ አባት ስም"
        text grandfather_name "የ አያት ስም"
        text gender "ወንድ | ሴት"
        text status "Active | Inactive"
        text address_phone "ስልክ"
        uuid auth_user_id UK "FK → auth.users.id"
        timestamptz created_at
    }

    CATEGORIES["public.categories"] {
        uuid id PK
        text name UK "ምስጋና | ዝማሬ | ተስፋ"
        text emoji
        text color
        integer sort_order
    }

    SONGS["public.songs"] {
        uuid id PK
        integer number UK
        text title
        text title_en
        text category "FK → categories.name"
        text lyrics
        text audio_url
        timestamptz created_at
    }

    AUTH_USERS ||--|| PROFILES : "trigger creates on signup"
    AUTH_USERS ||--o| MEMBERS : "linked via claim flow"
    CATEGORIES ||--o{ SONGS : "categorizes"
```

## Migrations

### 001_create_profile_trigger.sql

Creates the `profiles` table and a trigger that auto-creates a profile when a user signs up:

```mermaid
sequenceDiagram
    participant U as New User Signs Up
    participant A as auth.users
    participant T as handle_new_user()
    participant P as public.profiles

    U->>A: INSERT (via Supabase Auth)
    A->>T: AFTER INSERT trigger fires
    T->>P: INSERT profile
    Note over T,P: id = new.id<br/>display_name = email<br/>role = 'member'
```

**Key details:**
- `id` references `auth.users(id)` with `ON DELETE CASCADE`
- `role` has a CHECK constraint: must be one of `member`, `dept_head`, `admin`, `super_admin`
- Function uses `SECURITY DEFINER` with empty `search_path` for safety
- RLS is enabled on the table

### 002_profiles_rls.sql

RLS policies for profiles using `get_my_role()` SECURITY DEFINER helper to avoid infinite recursion:

```mermaid
graph TD
    subgraph HELPER["get_my_role() — SECURITY DEFINER"]
        H1["Reads current user's role<br/>bypassing RLS to prevent recursion"]
    end

    subgraph SELECT["SELECT Policies"]
        S1["Users can read own profile<br/>auth.uid() = id"]
        S2["admin + super_admin<br/>can read all (via get_my_role)"]
    end

    subgraph UPDATE["UPDATE Policies"]
        U1["Users can update own profile<br/>auth.uid() = id"]
        U2["super_admin can update any<br/>(via get_my_role)"]
    end

    style HELPER fill:#3ecf8e,color:#fff
    style SELECT fill:#eff6ff,stroke:#2563eb
    style UPDATE fill:#fef2f2,stroke:#dc2626
```

### 003_seed_songs.sql

Creates `categories` and `songs` tables with seed data:
- 3 categories: ምስጋና (Praise), ዝማሬ (Worship), ተስፋ (Hope)
- 5 sample songs with Amharic lyrics

### 004_songs_rls.sql

RLS for songs and categories:

| Table | Operation | Who | Condition |
|-------|-----------|-----|-----------|
| categories | SELECT | Authenticated users | `auth.role() = 'authenticated'` |
| songs | SELECT | Authenticated users | `auth.role() = 'authenticated'` |
| songs | INSERT/UPDATE/DELETE | admin, super_admin | Role check via profiles subquery |

### 004b_member_auth_link.sql

Adds `auth_user_id` column to the existing `members` table for linking auth accounts to member records:

```mermaid
graph TD
    subgraph SELECT_P["SELECT Policies"]
        S1["Users read own linked member<br/>auth_user_id = auth.uid()"]
        S2["Users read unclaimed members<br/>auth_user_id IS NULL<br/>(needed for claim flow)"]
        S3["admin + super_admin<br/>read all members"]
    end

    subgraph UPDATE_P["UPDATE Policies"]
        U1["Users can claim unclaimed<br/>SET auth_user_id WHERE IS NULL"]
        U2["admin + super_admin<br/>can update any member"]
    end

    style SELECT_P fill:#eff6ff,stroke:#2563eb
    style UPDATE_P fill:#fef2f2,stroke:#dc2626
```

## Member Claim Flow (Data)

```mermaid
sequenceDiagram
    participant U as auth.users
    participant M as members
    participant P as profiles

    Note over U,M: User enters member_id on /claim
    U->>M: SELECT WHERE member_id = input
    alt Unclaimed (auth_user_id IS NULL)
        U->>M: UPDATE SET auth_user_id = uid
        U->>P: UPDATE SET display_name = member name
        Note over M,P: Account linked!
    else Already claimed
        M-->>U: Error: already linked
    end
```

## Helper Functions

### get_my_role() (SQL)
- `SECURITY DEFINER` function that reads the current user's role bypassing RLS
- Prevents infinite recursion in RLS policies that need to check the user's role
- Used by profiles, members, and songs RLS policies

### getLinkedMember() (TypeScript)
- Located in `libs/db/src/members.ts`
- Queries `members WHERE auth_user_id = authUserId`
- Returns the full `Member` record or `null`
- Used by dashboard, profile page, and future modules (attendance, donations)

## Future Tables (Planned)

```mermaid
erDiagram
    MEMBERS ||--o{ ATTENDANCE : "records"
    MEMBERS ||--o{ DONATIONS : "submits"
    DEPARTMENTS ||--o{ MEMBERS : "belongs to"
    EVENTS ||--o{ ATTENDANCE : "tracks"
    DEPARTMENTS ||--o{ EVENTS : "organizes"

    DEPARTMENTS["departments"] {
        uuid id PK
        text name
        text description
    }

    EVENTS["events"] {
        uuid id PK
        uuid department_id FK
        text title
        timestamptz event_date
    }

    ATTENDANCE["attendance"] {
        uuid id PK
        uuid event_id FK
        bigint member_id FK
        boolean present
        timestamptz checked_in_at
    }

    DONATIONS["donations"] {
        uuid id PK
        bigint member_id FK
        decimal amount
        text receipt_url
        text status "pending | verified | rejected"
        uuid verified_by FK
        timestamptz created_at
    }
```

> **Note:** Future tables will reference `members.id` (not `profiles.id`) for attendance and donations, since these are tied to the Sunday School member record. The `department_id` column on `profiles` exists but has no FK constraint yet — it will reference the `departments` table once created.
