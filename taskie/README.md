# 🗂️ Taskie — Team Task Manager

A production-ready team task management app built with Next.js 14, Prisma, PostgreSQL, and NextAuth.js.

---

## ✅ Features

- **Authentication** — Signup/Login with hashed passwords (bcrypt)
- **Role-Based Access Control** — ADMIN and MEMBER roles
- **Project Management** — Admins create projects, all members can view
- **Task Management** — Create, assign, set status, track due dates
- **Dashboard** — Stats overview (Total, In Progress, Done, Overdue)
- **Overdue Detection** — Tasks past due date highlighted in red

---

## 🚀 Local Setup (Step by Step)

### 1. Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/taskie.git
cd taskie
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Your Railway PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Generate a secret: run -> openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## 🗄️ Database Commands

| Command | Description |
|---|---|
| `npm run db:push` | Push schema to DB (no migrations) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## 🌐 Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. Push this repo to your GitHub account named `taskie`
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your `taskie` repo
4. Railway will detect it's a Next.js app automatically

**Set environment variables in Railway:**
- `DATABASE_URL` → your Railway PostgreSQL URL (from the Railway PostgreSQL service → Connect tab)
- `NEXTAUTH_SECRET` → run `openssl rand -base64 32` and paste the result
- `NEXTAUTH_URL` → your Railway app URL (e.g., `https://taskie-production.up.railway.app`)

5. Railway will build and deploy automatically on every push

### Option B: Deploy to Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Add the same environment variables
4. Click Deploy

> **Note:** Change `NEXTAUTH_URL` to your Vercel URL (e.g., `https://taskie.vercel.app`)

---

## 📁 Project Structure

```
taskie/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx       # Login page
│   │   └── signup/page.tsx      # Signup page
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard layout (with sidebar)
│   │   └── page.tsx             # Dashboard with stats
│   ├── projects/
│   │   ├── [id]/page.tsx        # Project detail + tasks
│   │   └── page.tsx             # Projects list
│   ├── api/auth/[...nextauth]/  # NextAuth handler
│   ├── globals.css
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Redirect to dashboard/login
├── actions/
│   ├── auth.ts                  # Register server action
│   ├── projects.ts              # Project CRUD
│   └── tasks.ts                 # Task CRUD + stats
├── components/
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── CreateProjectModal.tsx   # Modal for project creation
│   ├── CreateTaskModal.tsx      # Modal for task creation
│   └── TaskCard.tsx             # Task card with inline status update
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   └── utils.ts                 # Utility functions
├── prisma/
│   └── schema.prisma            # Database schema
├── types/
│   └── next-auth.d.ts           # Type extensions
├── auth.ts                      # NextAuth configuration
└── middleware.ts                # Route protection
```

---

## 🔐 Role Permissions

| Action | ADMIN | MEMBER |
|---|---|---|
| Create Project | ✅ | ❌ |
| View Projects | ✅ | ✅ |
| Create Task | ✅ | ❌ |
| View Tasks | ✅ | ✅ |
| Update own task status | ✅ | ✅ (if assigned) |
| Delete Task | ✅ | ❌ |
| Delete Project | ✅ | ❌ |
| View Team Members | ✅ | ❌ |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (hosted on Railway)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5 (Auth.js)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
