# Architecture

A short tour of how this app is wired together. Diagrams render on GitHub — no setup needed.

---

## 1. System context

The big picture: what talks to what.

```mermaid
graph LR
  subgraph Users
    Visitor[👤 Public visitor<br/>browser]
    Volunteer[🎓 Volunteer advocate<br/>browser]
    Recipient[📨 Recipient<br/>email or SMS]
  end

  subgraph Hosting
    Netlify[(🌐 Netlify<br/>static hosting + CDN)]
  end

  subgraph SupabaseCloud[Supabase Cloud]
    Auth[🔐 Auth<br/>email + password]
    DB[(🗄️ Postgres<br/>brochures, categories,<br/>share_logs, tutorial_steps)]
    Storage[📁 Storage<br/>brochure files]
    EdgeFn[⚡ Edge Function<br/>send-email]
  end

  Gmail[✉️ Gmail SMTP]
  GitHub[🐙 GitHub<br/>source + Actions CI]
  Tests[🧪 Playwright tests<br/>separate repo]

  Visitor -->|HTTPS| Netlify
  Volunteer -->|HTTPS /admin| Netlify
  Netlify -->|fetch app bundle| Visitor
  Netlify -->|fetch app bundle| Volunteer

  Volunteer -->|REST + JWT| Auth
  Volunteer -->|REST + RLS| DB
  Volunteer -->|upload PDF/PNG| Storage

  Visitor -->|REST + RLS<br/>read only| DB
  Visitor -->|invoke| EdgeFn

  EdgeFn -->|SMTP| Gmail
  Gmail -->|deliver| Recipient

  GitHub -->|deploy on push to main| Netlify
  Tests -->|GitHub Actions on schedule| GitHub
  Tests -->|API + UI assertions| Netlify
  Tests -->|REST| DB
```

### Notes

- **Netlify** auto-rebuilds from `main`; Supabase Edge Functions do **not** auto-deploy — they need a manual `supabase functions deploy`.
- **Row-Level Security (RLS)** on every table. Anonymous visitors can read non-deleted brochures and insert into `share_logs`; only authenticated users (volunteers/admins) can write to `brochures`, `categories`, and `tutorial_steps`.
- The **Edge Function** is the only path that touches Gmail SMTP — credentials never reach the browser.
- The **Playwright test repo** lives at [`appuuprety/victimsadvocate-test`](https://github.com/appuuprety/victimsadvocate-test) and runs smoke tests on every push, integration nightly, regression weekly.

---

## 2. Database schema

Tables that drive the app.

```mermaid
erDiagram
  CATEGORIES ||--o{ BROCHURES : "categorizes"
  BROCHURES  ||--o{ SHARE_LOGS : "shared as"

  CATEGORIES {
    text id PK "slug, e.g. housing"
    text label
    text icon "emoji"
    text color "hex"
    int  sort_order
  }

  BROCHURES {
    uuid        id PK
    text        title
    text        description
    text        category_id FK
    text[]      tags
    boolean     featured
    text        link_url
    text        phone_number
    text        business_hours
    text        file_path "in Storage bucket"
    text        file_name
    text        file_size
    text        file_type
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at "soft-delete (Trash)"
  }

  SHARE_LOGS {
    uuid        id PK
    uuid        brochure_id FK
    text        method "email | sms | link"
    timestamptz shared_at
  }

  TUTORIAL_STEPS {
    uuid        id PK
    int         sort_order
    text        icon
    text        title
    text        body
    boolean     is_warning
    boolean     highlight
    text        action_label
    text        action_view
    timestamptz created_at
  }
```

### Notes

- **`brochures.deleted_at`** is the soft-delete marker. The Trash tab in admin shows rows with this set; public views filter them out.
- **`tutorial_steps`** is editable from the admin "🎓 Tutorial" tab — it's not seeded into code, so anything can be changed without a deploy.
- **`share_logs`** records every share event for the Activity tab. No PII (no recipient address) — just the brochure ID and the channel used.

---

## 3. Sequence — Share a resource

What happens between the click on "Share" and the email landing in someone's inbox. The trickiest flow in the app.

```mermaid
sequenceDiagram
  autonumber
  actor User as Volunteer
  participant UI  as PublicPortal
  participant Modal as ShareModal
  participant Fn  as Edge Function<br/>send-email
  participant SMTP as Gmail SMTP
  participant DB  as Postgres

  User->>UI: Tick checkbox on 1–5 brochure cards
  UI->>UI: setSelected (Set of IDs, max 5)
  User->>UI: Click "Share N Resources"
  UI->>Modal: open with brochures array
  User->>Modal: Pick Email tab, type recipient
  User->>Modal: Click "Send Anonymously"

  loop For each selected brochure
    Modal->>Fn: invoke('send-email', {to, brochureTitle, link})<br/>Authorization: Bearer ANON_KEY
    Fn->>SMTP: SMTP send via nodemailer
    SMTP-->>Fn: 250 OK
    Fn-->>Modal: 200 success
    Modal->>DB: insert into share_logs<br/>(brochure_id, method='email')
  end

  Modal-->>User: "✓ N emails sent anonymously!"
```

### Notes

- The modal sends **one email per resource in parallel** (`Promise.all`) instead of one combined email. This is a workaround for the un-deployed Edge Function update — the existing function only knows how to format a single resource at a time.
- The **Authorization header** is required because Supabase Edge Functions reject unauthenticated calls by default. The anon key is safe to ship in the bundle (RLS does the actual gatekeeping).
- The **SMS tab** uses the same flow but routes through email-to-SMS gateways (`5551234567@vtext.com` etc.) instead of a real SMS provider, to keep cost zero.
- **Recipient address never reaches the database** — only the share method does. Privacy by design.

---

## Out of scope

What this doc deliberately doesn't cover:

- **Detailed component tree** — the React structure is small enough to read directly. See `src/components/`.
- **CSS / design tokens** — colors and shared style values live in [`src/components/ui.jsx`](../src/components/ui.jsx).
- **Translations strategy** — [`src/lib/translations.js`](../src/lib/translations.js) is the source of truth; non-English values are machine-translated and pending native-speaker review.
- **PWA / offline behavior** — see [`public/sw.js`](../public/sw.js); the gist is "cache app shell, never cache Supabase API calls."
