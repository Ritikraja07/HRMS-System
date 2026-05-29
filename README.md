# 🏢 HRMS — Human Resource Management System

A **production-ready, full-stack HRMS** built with Next.js 14, Express.js, Supabase, and Socket.io — deployable on Vercel + Railway in minutes.

[![Backend CI](https://github.com/YOUR_USERNAME/hrms/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/hrms/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/YOUR_USERNAME/hrms/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/hrms/actions/workflows/frontend-ci.yml)

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | Node.js 18+, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Realtime | Socket.io |
| Push Notifications | Firebase Cloud Messaging |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## 📁 Project Structure

```
hrms/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml      # Backend CI on push/PR
│       └── frontend-ci.yml     # Frontend CI (build check)
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_rls_policies.sql
│       ├── 003_seed_data.sql
│       └── 004_add_announcements.sql
├── hrms-backend/               # Express.js API
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   ├── server.js
│   ├── .env.example            ← copy to .env
│   ├── railway.json            ← Railway deployment config
│   └── Procfile
└── hrms-frontend/              # Next.js App
    ├── app/
    ├── components/
    ├── hooks/
    ├── lib/
    ├── utils/
    ├── .env.example            ← copy to .env.local
    └── vercel.json             ← Vercel deployment config
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Supabase account ([supabase.com](https://supabase.com))
- Firebase project (optional, for push notifications)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hrms.git
cd hrms
```

---

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** and run the migrations **in order**:
   ```
   supabase/migrations/001_create_tables.sql
   supabase/migrations/002_rls_policies.sql
   supabase/migrations/003_seed_data.sql
   supabase/migrations/004_add_announcements.sql
   ```
3. Enable **Email auth** in Authentication → Providers
4. Go to **Storage** → create buckets:
   - `avatars` (public)
   - `payslips` (private)
5. Copy your **Project URL**, **Anon Key**, **Service Role Key**, and **JWT Secret** from Settings → API

---

### 3. Backend Setup

```bash
cd hrms-backend
cp .env.example .env
# Edit .env with your real values
npm install
npm run dev        # starts on http://localhost:4000
```

**`.env` variables:**

| Variable | Where to find it |
|---|---|
| `PORT` | `4000` (local) |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `JWT_SECRET` | Supabase → Settings → API → JWT Secret |
| `CORS_ORIGIN` | `http://localhost:3001` (local) or your Vercel URL |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase → Project Settings → Service Accounts |

> Health check available at: `GET http://localhost:4000/health`

---

### 4. Frontend Setup

```bash
cd hrms-frontend
cp .env.example .env.local
# Edit .env.local with your real values
npm install
npm run dev        # starts on http://localhost:3000
```

**`.env.local` variables:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` (local) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase console (optional) |

Open **http://localhost:3000**

---

## 👤 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@hrms.com | HrmsPass@2025 |
| Manager | manager1@hrms.com | HrmsPass@2025 |
| Manager | manager2@hrms.com | HrmsPass@2025 |
| Employee | employee1@hrms.com | HrmsPass@2025 |
| Employee | employee2@hrms.com | HrmsPass@2025 |
| Employee | employee3@hrms.com | HrmsPass@2025 |
| Employee | employee4@hrms.com | HrmsPass@2025 |
| Employee | employee5@hrms.com | HrmsPass@2025 |

> These are seeded by `003_seed_data.sql` — change passwords in production!

---

## 🌟 Features

### Employee
- ⏱ Punch In / Out with live timer
- 📅 Attendance calendar with monthly summary
- 📋 Task management (CRUD)
- 📁 Project dashboard
- 💬 Real-time project chat (Socket.io)
- 📆 Leave requests with balance tracking
- 💰 Payslip viewer
- 📝 Daily EOD updates with mood selector
- 🔔 Push notifications (FCM)
- 👤 Profile & avatar management

### Manager
- 📊 Team dashboard with live attendance
- ✅ Leave approval/rejection with comments
- 👥 Team member overview
- 📋 Task assignment

### Admin
- 🛡 Admin dashboard with org-wide stats
- 👥 Employee directory (activate/deactivate)
- 🚀 Employee onboarding with auto account creation
- 📊 Reports (attendance, payroll, tasks) with charts
- 🕐 Shift schedule management
- 📢 Announcements

---

## 🚢 Deployment

### Backend → Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
3. Select the `hrms` repository and set **Root Directory** to `hrms-backend`
4. Add the following **Environment Variables** in Railway dashboard:

   | Key | Value |
   |---|---|
   | `PORT` | `4000` |
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | your Supabase URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
   | `JWT_SECRET` | your JWT secret |
   | `CORS_ORIGIN` | your Vercel URL (e.g. `https://hrms-app.vercel.app`) |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | your Firebase service account JSON (single line) |

5. Railway auto-detects Node.js and runs `node server.js`
6. Copy your Railway **public URL** (e.g. `https://hrms-backend.up.railway.app`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
2. Set **Root Directory** to `hrms-frontend`
3. Framework preset: **Next.js** (auto-detected)
4. Add the following **Environment Variables** in Vercel dashboard:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_BACKEND_URL` | your Railway URL |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
   | `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase VAPID key |

5. Click **Deploy** — Vercel will build and deploy automatically

> After deployment, update `CORS_ORIGIN` in Railway to your Vercel production URL and redeploy the backend.

---

## 🔒 Security

- All API routes protected by JWT middleware
- Role-based access control (admin / manager / employee)
- Supabase Row Level Security (RLS) on all tables
- Rate limiting on API endpoints (300 req/15min)
- Strict rate limiting on auth endpoints (20 req/15min)
- Helmet.js security headers

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📞 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Socket.io Docs](https://socket.io/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
