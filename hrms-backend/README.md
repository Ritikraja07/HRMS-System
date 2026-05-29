# HRMS Backend — Express.js API

REST API + Socket.io backend for the HRMS application, built with **Node.js**, **Express.js**, and **Supabase**.

[![Backend CI](https://github.com/YOUR_USERNAME/hrms-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/hrms-backend/actions/workflows/ci.yml)

> **Frontend repo**: [hrms-frontend](https://github.com/YOUR_USERNAME/hrms-frontend)

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (Supabase JWT Secret) |
| Realtime | Socket.io |
| Push Notifications | Firebase Admin SDK |

---

## 📁 Project Structure

```
hrms-backend/
├── .github/workflows/ci.yml   # GitHub Actions CI
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql   # Schema — run first
│       ├── 002_rls_policies.sql    # Row Level Security
│       ├── 003_seed_data.sql       # Demo users & seed data
│       └── 004_add_announcements.sql
├── controllers/       # Route handler logic
├── middleware/        # JWT auth, RBAC, rate limiter, error handler
├── routes/            # Express routers
├── socket/            # Socket.io event handlers
├── utils/             # Supabase client, FCM, validators, response helpers
├── server.js          # App entry point
├── .env.example       # Environment variable template
├── railway.json       # Railway deployment config
└── Procfile           # Process start command
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Firebase](https://console.firebase.google.com) project (optional — for push notifications)

---

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations **in order**:

   ```
   supabase/migrations/001_create_tables.sql
   supabase/migrations/002_rls_policies.sql
   supabase/migrations/003_seed_data.sql
   supabase/migrations/004_add_announcements.sql
   ```

3. Enable **Email** auth in **Authentication → Providers**
4. Go to **Storage** → create two buckets:
   - `avatars` — set to **public**
   - `payslips` — set to **private**
5. Copy your keys from **Settings → API**:
   - Project URL
   - `anon` / public key
   - `service_role` / secret key
   - JWT Secret

---

### 2. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/hrms-backend.git
cd hrms-backend
npm install
```

---

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your real values
```

| Variable | Where to find it |
|---|---|
| `PORT` | `4000` (local default) |
| `NODE_ENV` | `development` or `production` |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `JWT_SECRET` | Supabase → Settings → API → JWT Secret |
| `CORS_ORIGIN` | Frontend URL (e.g. `http://localhost:3000`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase → Project Settings → Service Accounts → Generate new private key (paste as single-line JSON) |

---

### 4. Run

```bash
npm run dev       # Development with nodemon (hot reload)
npm start         # Production
```

Health check: `GET http://localhost:4000/health`

---

## 👤 Demo Credentials

Seeded by `003_seed_data.sql`:

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

> Change all passwords before going to production!

---

## 🔌 API Endpoints

| Module | Base Path |
|---|---|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Attendance | `/api/attendance` |
| Tasks | `/api/tasks` |
| Projects | `/api/projects` |
| Messages | `/api/messages` |
| Leave | `/api/leave` |
| Payslips | `/api/payslips` |
| Updates | `/api/updates` |
| Notifications | `/api/notifications` |
| Admin | `/api/admin` |
| Manager | `/api/manager` |
| Shifts | `/api/shifts` |
| Announcements | `/api/announcements` |

---

## 🚢 Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
3. Select `hrms-backend` — Railway auto-detects Node.js
4. Add all environment variables from `.env.example` in the Railway dashboard
5. Railway runs `node server.js` automatically (via `railway.json`)
6. Copy the Railway public URL — you'll need it for the frontend's `NEXT_PUBLIC_BACKEND_URL`

> After deploying the frontend, come back and update `CORS_ORIGIN` to your Vercel URL, then redeploy.

---

## 🔒 Security

- JWT middleware on all protected routes
- Role-based access control (admin / manager / employee)
- Rate limiting: 300 req/15min (API), 20 req/15min (auth)
- Helmet.js security headers
- Supabase Row Level Security (RLS) enforced at the database level

---

## 📞 Resources

- [Express.js Docs](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Socket.io Docs](https://socket.io/docs)
