cat > README.md << 'EOF'
# Daktari Admin Dashboard

A modern, secure admin panel for managing healthcare providers — built with React, Vite, and Supabase.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## Features

- Custom auth — no Supabase auth.users dependency
- Role-based access control (super admin and standard admin)
- Healthcare provider dashboard and analytics
- Fast, responsive UI powered by Vite and Tailwind

## Quick Start

### 1. Clone the repo
\`\`\`bash
git clone https://github.com/jimmyurl/daktari-dashboard.git
cd daktari-dashboard
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure environment
\`\`\`bash
cp .env.example .env
# Edit .env with your Supabase credentials
\`\`\`

### 4. Set up the database
In Supabase → SQL Editor, run \`admin_users.sql\`. This creates the \`daktari.admin_users\` table and your first login.

### 5. Run the app
\`\`\`bash
npm run dev
\`\`\`
Visit \`http://localhost:5173\` and sign in with your admin credentials.

## Project Structure

\`\`\`
src/
├── lib/
│   ├── supabase.js       # Supabase client
│   └── AuthContext.jsx   # Custom auth (no auth.users dependency)
├── components/           # Reusable UI components
├── pages/                # App pages and routes
└── App.jsx               # Root component
\`\`\`

## Environment Variables

| Variable | Description |
|---|---|
| VITE_SUPABASE_URL | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Your Supabase anon/public key |

> Never commit your `.env` file. It is listed in `.gitignore`.

## Security

- Admin credentials managed server-side via Supabase RLS policies
- Environment variables never committed to version control
- Role-based access control restricts features by admin level
- Custom auth schema isolated from Supabase's built-in auth system

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'Add your feature'`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a pull request

---

MIT License · [jimmyurl](https://github.com/jimmyurl)
EOF

git add README.md
git commit -m "Add proper README"
git push origin main