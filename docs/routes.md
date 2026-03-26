# Route Map

## All Routes

```mermaid
graph TD
    subgraph PUBLIC["(public) — No auth required"]
        LOGIN["/login<br/>Sign-in / sign-up form"]
    end

    subgraph MEMBER["(member) — Authenticated users"]
        DASHBOARD["/dashboard<br/>Member home + quick links"]
        SONGBOOK["/songbook<br/>Song list (browse/search)"]
        SONG_DETAIL["/songbook/[id]<br/>Song lyrics & details"]
        ATTENDANCE["/attendance<br/>Personal attendance history"]
        DONATE["/donate<br/>Submit donation + receipt"]
    end

    subgraph ADMIN["(admin) — dept_head / admin / super_admin"]
        ADMIN_HOME["/admin<br/>Admin dashboard"]
        ADMIN_USERS["/admin/users<br/>Manage roles (super_admin)"]
        ADMIN_ATTENDANCE["/admin/attendance<br/>Manage events & attendance"]
        ADMIN_CHECKIN["/admin/attendance/[eventId]<br/>Check-in for specific event"]
        ADMIN_DONATIONS["/admin/donations<br/>Verify submitted donations"]
    end

    ROOT["/ (landing)"] -->|redirect| DASHBOARD

    ADMIN_ATTENDANCE --> ADMIN_CHECKIN

    style PUBLIC fill:#f0fdf4,stroke:#16a34a
    style MEMBER fill:#eff6ff,stroke:#2563eb
    style ADMIN fill:#fef2f2,stroke:#dc2626
    style ROOT fill:#f8fafc,stroke:#64748b
```

## Route Details

| Route | Auth | Roles | Layout | Status |
|-------|------|-------|--------|--------|
| `/` | Protected | Any | Root | Redirects to `/dashboard` |
| `/login` | Public | Any (logged-in users redirected to `/dashboard`) | Root > Public | Working (sign-in + sign-up) |
| `/dashboard` | Protected | All authenticated | Root > Member | Working (shows user email) |
| `/songbook` | Protected | All authenticated | Root > Member | Placeholder |
| `/songbook/[id]` | Protected | All authenticated | Root > Member | Placeholder |
| `/attendance` | Protected | All authenticated | Root > Member | Placeholder |
| `/donate` | Protected | All authenticated | Root > Member | Placeholder |
| `/admin` | Protected | dept_head, admin, super_admin | Root > Admin | Placeholder |
| `/admin/users` | Protected | dept_head, admin, super_admin | Root > Admin | Placeholder |
| `/admin/attendance` | Protected | dept_head, admin, super_admin | Root > Admin | Placeholder |
| `/admin/attendance/[eventId]` | Protected | dept_head, admin, super_admin | Root > Admin | Placeholder |
| `/admin/donations` | Protected | dept_head, admin, super_admin | Root > Admin | Placeholder |

## Layout Hierarchy

```mermaid
graph TD
    ROOT_LAYOUT["RootLayout<br/>html lang='am', body, global.css<br/>metadata + viewport"]

    ROOT_LAYOUT --> PUBLIC_LAYOUT["PublicLayout<br/>min-h-screen wrapper<br/>No header, no BottomNav"]
    ROOT_LAYOUT --> MEMBER_LAYOUT["MemberLayout<br/>Header (branding + logout)<br/>BottomNav (member links)"]
    ROOT_LAYOUT --> ADMIN_LAYOUT["AdminLayout<br/>Header (branding + logout)<br/>BottomNav (member + admin links)"]

    PUBLIC_LAYOUT --> P1["/login"]

    MEMBER_LAYOUT --> M1["/dashboard"]
    MEMBER_LAYOUT --> M2["/songbook"]
    MEMBER_LAYOUT --> M3["/songbook/[id]"]
    MEMBER_LAYOUT --> M4["/attendance"]
    MEMBER_LAYOUT --> M5["/donate"]

    ADMIN_LAYOUT --> A1["/admin"]
    ADMIN_LAYOUT --> A2["/admin/users"]
    ADMIN_LAYOUT --> A3["/admin/attendance"]
    ADMIN_LAYOUT --> A4["/admin/attendance/[eventId]"]
    ADMIN_LAYOUT --> A5["/admin/donations"]

    style ROOT_LAYOUT fill:#1e40af,color:#fff
    style PUBLIC_LAYOUT fill:#16a34a,color:#fff
    style MEMBER_LAYOUT fill:#2563eb,color:#fff
    style ADMIN_LAYOUT fill:#dc2626,color:#fff
```

## BottomNav Links

```mermaid
graph LR
    subgraph MEMBER_NAV["Member BottomNav"]
        N1["🏠 Home<br/>/dashboard"]
        N2["🎵 Songbook<br/>/songbook"]
        N3["📋 Attendance<br/>/attendance"]
        N4["❤️ Donate<br/>/donate"]
    end

    subgraph ADMIN_NAV["Admin BottomNav (adds)"]
        N5["🛡️ Admin<br/>/admin"]
    end

    MEMBER_NAV -.->|"role = dept_head | admin | super_admin"| ADMIN_NAV

    style MEMBER_NAV fill:#eff6ff,stroke:#2563eb
    style ADMIN_NAV fill:#fef2f2,stroke:#dc2626
```
