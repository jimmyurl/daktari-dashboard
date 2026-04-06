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