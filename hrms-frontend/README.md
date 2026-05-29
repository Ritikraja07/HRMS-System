# HRMS Frontend — Next.js App

Production-ready HR Management frontend built with **Next.js 14** (App Router), **Tailwind CSS**, and **Supabase Auth**.

[![Frontend CI](https://github.com/YOUR_USERNAME/hrms-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/hrms-frontend/actions/workflows/ci.yml)

> **Backend repo**: [hrms-backend](https://github.com/YOUR_USERNAME/hrms-backend)

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| HTTP Client | Axios |
| Realtime | Socket.io Client |
| Charts | Chart.js + react-chartjs-2 |
| Push Notifications | Firebase Cloud Messaging |

---

## 📁 Project Structure

```
hrms-frontend/
├── app/                  # Next.js App Router pages
│   ├── login/
│   ├── dashboard/
│   ├── punch/
│   ├── tasks/
│   ├── projects/
│   ├── communication/
│   ├── attendance/
│   ├── leave/
│   ├── payslips/
│   ├── updates/
│   ├── notifications/
│   ├── profile/
│   ├── announcements/
│   ├── admin/            # Admin-only pages
│   └── manager/          # Manager-only pages
├── components/ui/        # Reusable UI components
├── context/              # Auth context provider
├── hooks/                # Custom React hooks
├── lib/                  # Supabase, Firebase, Axios, Socket.io clients
├── utils/                # Formatters, validators, role guards
├── .env.example          # Environment variable template
└── vercel.json           # Vercel deployment config
```

---

## 🚀 Local Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/hrms-frontend.git
cd hrms-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your real values
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL (e.g. `http://localhost:4000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase → Cloud Messaging → Web Push certificates |

### 3. Run

```bash
npm run dev     # http://localhost:3000
npm run build   # Production build
npm start       # Production server
```

---

## 👤 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@hrms.com | HrmsPass@2025 |
| Manager | manager1@hrms.com | HrmsPass@2025 |
| Employee | employee1@hrms.com | HrmsPass@2025 |

> Seeded by the backend's Supabase migration `003_seed_data.sql`

---

## 🌟 Features

### Employee
- ⏱ Punch In / Out with live timer
- 📅 Attendance calendar
- 📋 Task management
- 📁 Project dashboard
- 💬 Real-time chat (Socket.io)
- 📆 Leave requests
- 💰 Payslip viewer
- 📝 EOD updates with mood selector
- 🔔 Push notifications (FCM)
- 👤 Profile & avatar management

### Manager
- 📊 Team dashboard with live attendance
- ✅ Leave approval / rejection
- 👥 Team overview & task assignment

### Admin
- 🛡 Org-wide dashboard & stats
- 👥 Employee directory
- 🚀 Employee onboarding
- 📊 Reports with charts
- 🕐 Shift management
- 📢 Announcements

---

## 🚢 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import this GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. Add all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard
4. Set `NEXT_PUBLIC_BACKEND_URL` to your Railway backend URL
5. Click **Deploy**

---

## 📞 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
