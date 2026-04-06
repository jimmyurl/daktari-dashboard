# Git History Scrubbing — Full Breakdown

## What we used: `git filter-repo`

This is the **official Git-recommended tool** for rewriting history. It replaces or removes content across every commit ever made — as if the secret was never there.

---

## The Full Workflow (Now That You Know It)

### 1. Install once
```powershell
pip install git-filter-repo
```

### 2. Create a replacements file
```powershell
@"
secret-value==>REDACTED
another-secret==>REDACTED
"@ | Set-Content replacements.txt -Encoding UTF8
```
This is a simple text file where each line is `BAD_VALUE==>REPLACEMENT`. You can add as many secrets as needed.

### 3. Run filter-repo
```powershell
git-filter-repo.exe --replace-text replacements.txt --force
```
This rewrites **every commit** in your entire git history, replacing matches in every file it touches. The `--force` flag is needed because the repo is not a fresh clone.

### 4. Re-add remote and force push
```powershell
git remote add origin <your-repo-url>
git push origin --force --all
```
filter-repo removes the remote as a safety measure to prevent accidental pushes. You re-add it and force push the clean rewritten history.

### 5. Verify
```powershell
git grep "your-secret" $(git log --all --oneline | % { $_.Split(" ")[0] })
```
If this returns nothing — you're clean.

### 6. Clean up
```bash
rm replacements.txt
```
Never commit the replacements file — it contains your secrets!

---

## Why This Works

```
BEFORE:                          AFTER:
                                 
commit a1b2c3                    commit x9y8z7  ← new hash
  README: "pass: Daktari2024!"     README: "pass: REDACTED"
                                 
commit d4e5f6                    commit w6v5u4  ← new hash
  sql: 'Daktari2024!'              sql: 'REDACTED'
```

Every commit gets a **new hash** because its content changed. The old commits with secrets are garbage collected and no longer exist.

---

## Key Things to Remember

| Rule | Why |
|---|---|
| Always use PowerShell for this, not Git Bash | Git Bash mangles Windows paths |
| Delete `replacements.txt` after | It contains the secrets you're trying to hide |
| Force push is required | You're rewriting history, not adding to it |
| All collaborators must re-clone | Their local copies still have old history |
| Rotate the actual secrets too | Git history is clean but the password/key still exists in your services |

---
---

# And here's your README:

---
<br>

```markdown
# 🏥 Daktari Admin Dashboard

A modern, secure admin panel for managing healthcare providers, built with React, Vite, and Supabase.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

---

## ✨ Features

- 🔐 Secure custom authentication (no Supabase auth.users dependency)
- 👥 Admin user management with role-based access control
- 📊 Healthcare provider dashboard and analytics
- 🛡️ Super admin and standard admin roles
- ⚡ Fast, responsive UI powered by Vite + React

---

## 🚀 Quick Start

### 1. Clone the repo
git clone https://github.com/jimmyurl/daktari-dashboard.git
cd daktari-dashboard

### 2. Install dependencies
npm install

### 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

### 4. Set up the database
# In Supabase → SQL Editor, run:
admin_users.sql

### 5. Run the app
npm run dev

# Visit http://localhost:5173 and sign in with your admin credentials

---

## 🗂️ Project Structure

src/
├── lib/
│   ├── supabase.js        # Supabase client
│   └── AuthContext.jsx    # Custom auth context
├── components/            # Reusable UI components
├── pages/                 # App pages & routes
└── App.jsx                # Root component

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## 🗄️ Database Setup

This project uses a custom `daktari` schema in Supabase,
independent of Supabase's built-in auth system.

Run `admin_users.sql` in the Supabase SQL Editor to:
- Create the `daktari.admin_users` table
- Set up the `create_admin_user` function
- Create your first super admin account

---

## 🛡️ Security

- All admin credentials are managed server-side
- Environment variables are never committed to version control
- Role-based access control restricts dashboard features by admin level

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © [Jimmy](https://github.com/jimmyurl)
```

---

Copy that into your `README.md`, then:
```bash
git add README.md
git commit -m "Add proper README"
git push origin main
```