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

    AUTH_USERS ||--|| PROFILES : "trigger creates on signup"
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

Four RLS policies controlling who can read and update profiles:

```mermaid
graph TD
    subgraph SELECT["SELECT Policies"]
        S1["Users can read own profile<br/>auth.uid() = id"]
        S2["admin + super_admin<br/>can read all profiles"]
    end

    subgraph UPDATE["UPDATE Policies"]
        U1["Users can update own profile<br/>(role must stay the same)"]
        U2["super_admin can update<br/>any profile including role"]
    end

    style SELECT fill:#eff6ff,stroke:#2563eb
    style UPDATE fill:#fef2f2,stroke:#dc2626
```

**Role escalation prevention:** The "update own profile" policy uses a `WITH CHECK` that verifies the role column hasn't changed:
```sql
role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
```

## Future Tables (Planned)

```mermaid
erDiagram
    PROFILES ||--o{ ATTENDANCE : "records"
    PROFILES ||--o{ DONATIONS : "submits"
    DEPARTMENTS ||--o{ PROFILES : "belongs to"
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
        uuid user_id FK
        boolean present
        timestamptz checked_in_at
    }

    DONATIONS["donations"] {
        uuid id PK
        uuid user_id FK
        decimal amount
        text receipt_url
        text status "pending | verified | rejected"
        uuid verified_by FK
        timestamptz created_at
    }
```

> **Note:** Future tables are planned but not yet created. The `department_id` column on `profiles` exists but has no foreign key constraint yet — it will reference the `departments` table once created.
