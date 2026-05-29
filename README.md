# HRMS — Human Resource Management System

A full-stack HRMS built with Next.js, Express.js, Supabase, and Socket.io.

**Live:** [hrms-system-ochre.vercel.app](https://hrms-system-ochre.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS |
| Backend | Node.js 18+, Express.js |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (JWT) |
| Realtime | Socket.io |
| Push Notifications | Firebase Cloud Messaging (optional) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
hrms/
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
│   ├── .env.example
│   └── railway.json
└── hrms-frontend/              # Next.js App
    ├── app/
    ├── components/
    ├── context/
    ├── hooks/
    ├── lib/
    ├── utils/
    ├── .env.example
    └── vercel.json
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Supabase project ([supabase.com](https://supabase.com))

### 1. Clone

```bash
git clone https://github.com/Ritikraja07/HRMS-System.git
cd HRMS-System
```

### 2. Supabase Setup

1. Create a Supabase project
2. Run migrations in order via SQL Editor:
   ```
   supabase/migrations/001_create_tables.sql
   supabase/migrations/002_rls_policies.sql
   supabase/migrations/003_seed_data.sql
   supabase/migrations/004_add_announcements.sql
   ```
3. Enable **Email** auth under Authentication → Providers
4. Copy **Project URL**, **Anon Key**, **Service Role Key**, and **JWT Secret** from Settings → API

### 3. Backend

```bash
cd hrms-backend
cp .env.example .env
npm install
npm run dev        # http://localhost:4000
```

| Variable | Value |
|---|---|
| `PORT` | `4000` |
| `NODE_ENV` | `development` |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `JWT_SECRET` | Supabase → Settings → API → JWT Settings |
| `CORS_ORIGIN` | `http://localhost:3000` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON (optional) |

Health check: `GET http://localhost:4000/health`

### 4. Frontend

```bash
cd hrms-frontend
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase console (optional, use `dummy` to disable) |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@hrms.com | HrmsPass@2025 |
| Manager | manager1@hrms.com | HrmsPass@2025 |
| Employee | employee1@hrms.com | HrmsPass@2025 |

Seeded by `003_seed_data.sql`. Change passwords before going to production.

---

## Features

### Employee
- Punch In / Out with live timer
- Attendance calendar with monthly summary
- Task management (create, update, complete)
- Project dashboard with real-time chat (Socket.io)
- Leave requests with balance tracking
- Payslip viewer
- Daily EOD updates with mood selector
- Push notifications (FCM)
- Profile and avatar management

### Manager
- Team dashboard with live attendance feed
- Leave approval / rejection with comments
- Team member overview and task assignment

### Admin
- Org-wide stats dashboard
- Employee directory (onboard, activate, deactivate)
- Payroll and payslip management
- Reports (attendance, payroll, tasks) with charts
- Shift schedule management
- Announcements

---

## Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub Repo
2. Select `Ritikraja07/HRMS-System`
3. Under Service Settings set **Root Directory** to `hrms-backend`
4. Add environment variables:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | your Supabase URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
   | `JWT_SECRET` | your JWT secret |
   | `CORS_ORIGIN` | your Vercel frontend URL |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON (optional) |

5. Railway auto-detects Node.js and runs `node server.js` (configured in `railway.json`)
6. Copy the generated Railway URL

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → Import `Ritikraja07/HRMS-System`
2. Set **Root Directory** to `hrms-frontend`
3. Framework auto-detected as Next.js
4. Add environment variables:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_BACKEND_URL` | your Railway URL |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_FIREBASE_*` | Firebase values (use `dummy` to disable) |

5. Deploy

After both are deployed, update `CORS_ORIGIN` on Railway to your Vercel production URL and redeploy the backend.

---

## Security

- JWT-protected API routes with role-based access control
- Supabase Row Level Security on all tables
- Rate limiting: 300 req / 15 min general, 20 req / 15 min on auth endpoints
- Helmet.js security headers
- CORS restricted to the configured frontend origin
