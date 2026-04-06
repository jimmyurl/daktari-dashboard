# Daktari Admin Panel

React + Vite + Tailwind + Supabase control panel for the Daktari app.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## First Time Setup

### 1. Run schema SQL
Supabase → SQL Editor → paste `../daktari_full/supabase/schema.sql` → Run

### 2. Run admin_users.sql
Supabase → SQL Editor → paste `admin_users.sql` → Run
This creates `daktari.admin_users` table and your first login:
- Email: jpmpanga@gmail.com
- Password: REDACTED

### 3. Set .env
Edit `.env` with your real anon key (eyJ... from Supabase → Settings → API):
```
VITE_SUPABASE_URL=https://jwseypmwlcnyxabfaqmd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Run & login
```bash
npm run dev
```
Sign in at http://localhost:5173 with jpmpanga@gmail.com / REDACTED

## Structure
```
src/
├── lib/
│   ├── supabase.js        Supabase client
│   └── AuthContext.jsx    Custom auth (no auth.users dependency)
├── components/
│   └── Layout.jsx         Sidebar + navigation
├── pages/
│   ├── LoginPage.jsx
│   ├── Dashboard.jsx      Stats + charts
│   ├── PatientsPage.jsx   Manage patients
│   ├── DoctorsPage.jsx    Manage doctors
│   ├── AppointmentsPage.jsx
│   ├── AdminsPage.jsx     Manage admin users
│   └── SetupPage.jsx      Setup guide
├── App.jsx
├── main.jsx
└── index.css
```
