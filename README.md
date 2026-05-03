# Erie Victim Services — Resource Portal

A web application for the Town of Erie Victim Services that connects crime survivors with confidential, free support resources. Staff can manage and share resources through an admin panel; community members access them through a public-facing portal.

---

## Features

### Public Portal
- Browse resources across 8+ categories: Housing & Shelter, Legal Aid, Counseling, Financial Assistance, Safety Planning, Children & Families, Medical & Health, and Crisis & Emergency
- Real-time search across resource titles, descriptions, and tags
- Featured resources hand-picked by advocates
- Share resources anonymously via email, SMS, or copyable link
- Bilingual support (English and Spanish)
- Emergency hotline information prominently displayed
- Contact page with Erie Victim Services phone numbers and Colorado Victim Rights Act information
- No user tracking or login required

### Admin Panel
- Dashboard with stats: total resources, featured count, categories, and share activity
- Upload and manage resources (PDF, DOCX, PNG, JPG — up to 50 MB)
- Add titles, descriptions, tags, and category assignments
- Mark resources as featured
- Create and manage resource categories with custom icons and colors
- View share activity logs
- Drag-and-drop file upload interface
- Secure email/password authentication

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Backend | Supabase (Postgres, Auth, Storage) |
| Email | Supabase Edge Function + Gmail SMTP (Nodemailer) |
| Styling | Inline React styles (no CSS framework) |
| Language | JavaScript (JSX) |

---

## Project Structure

```
src/
  App.jsx                   # Root component — handles routing between portal and admin
  main.jsx                  # React entry point
  supabaseClient.js         # Supabase client initialization
  components/
    PublicPortal.jsx        # Public-facing resource browser
    AdminPanel.jsx          # Staff dashboard
    AdminLogin.jsx          # Admin login screen
    BrochureCard.jsx        # Resource card component
    BrochureForm.jsx        # Create/edit resource form
    ShareModal.jsx          # Email/SMS/link sharing modal
    ui.jsx                  # Shared UI primitives (Button, Input, etc.)
    ColoradoLogo.jsx        # Logo component
  lib/
    helpers.js              # Utilities: sharing, auth checks, formatting
    translations.js         # English/Spanish string translations
supabase/
  functions/send-email/     # Deno edge function for sending emails
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema below
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for email sending

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the email edge function, set these in your Supabase project's Edge Function secrets:

```
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password
```

### Install and Run

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Accessing the Admin Panel

Navigate to `/admin` in your browser. Log in with the credentials created in your Supabase Auth dashboard.

---

## Database Schema

### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Slug, e.g. `"housing"` |
| `label` | text | Display name, e.g. `"Housing & Shelter"` |
| `icon` | text | Emoji icon |
| `color` | text | Hex color for UI accents |
| `sort_order` | integer | Optional display ordering |

### `brochures`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `title` | text | Resource title |
| `description` | text | Short description |
| `category_id` | text (FK) | References `categories.id` |
| `tags` | text[] | Array of searchable tags |
| `featured` | boolean | Show in featured section |
| `file_path` | text | Path in Supabase Storage |
| `file_name` | text | Original filename |
| `file_size` | text | Formatted size, e.g. `"2.5 MB"` |
| `file_type` | text | Extension, e.g. `"pdf"` |
| `link_url` | text | External URL (alternative to file upload) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `share_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `brochure_id` | uuid (FK) | References `brochures.id` |
| `method` | text | `"email"`, `"sms"`, or `"link"` |
| `shared_at` | timestamp | |

### Storage

Create a public Supabase Storage bucket named `brochures` for uploaded files.

---

## Privacy

The application is designed with survivor privacy in mind:

- No user accounts or tracking on the public portal
- Anonymous sharing: emails and SMS are sent from the organization's account, not the user's
- No analytics or third-party scripts

---

## License

See [LICENSE](LICENSE).
