# INSTALLATION GUIDE

## ⚡ Quick Install

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Then edit .env.local with your credentials

# 3. Start development server
npm run dev
```

Visit: http://localhost:3000

---

## 📋 Detailed Setup

### 1. Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account (free tier works)
- Upstash Redis account (free tier works)
- OpenAI API key (optional, for Oracle AI)

### 2. Clone & Install

```bash
cd C:\Projects\Deepchat
npm install
```

### 3. Supabase Setup

#### Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `deepchat`
   - Database Password: (save it!)
   - Region: Choose closest to you
4. Wait 2-3 minutes for provisioning

#### Get Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL`
   - `anon public` key  
   - `service_role` key

#### Apply Database Migration
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

#### Enable Realtime
1. Go to **Database** → **Replication**
2. Enable for: `messages`, `dm_messages`
3. Save

### 4. Redis Setup (Upstash)

1. Go to https://console.upstash.com
2. Create Database:
   - Name: `deepchat-redis`
   - Region: Same as Supabase
   - Type: Pay as you go
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 5. Environment Variables

Edit `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# OpenAI (optional)
OPENAI_API_KEY=sk-your-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 — you should see the retro terminal interface! 🟢

---

## 🧪 Verify Installation

### Check 1: Homepage Loads
- Visit http://localhost:3000
- Should see green terminal UI with "[PRIVACY_FOCUSED_COMMUNICATION_PROTOCOL]"

### Check 2: Supabase Connected
```bash
# In browser console:
# (test if Supabase is reachable)
```

### Check 3: Database Tables
1. Go to Supabase Dashboard → **Table Editor**
2. Should see: `users`, `rooms`, `messages`, etc.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Supabase"
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure Supabase project is not paused

### Error: "Redis connection failed"
- Verify Upstash credentials
- Check if Redis database is active

### Error: "Type errors"
- Run: `supabase gen types typescript --local > types/database.ts`
- Restart dev server

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

---

## 📦 Production Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
```

### Environment Variables in Vercel
Add all variables from `.env.local` in:
**Vercel Dashboard** → **Settings** → **Environment Variables**

---

## 🔄 Update Database Schema

When you change the schema:

```bash
# Create new migration
supabase migration new your_change_name

# Edit: supabase/migrations/TIMESTAMP_your_change_name.sql

# Apply migration
supabase db push
```

---

## ✅ Next Steps

1. Read [QUICK_START.md](./QUICK_START.md) for development guide
2. Check [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) for all specs
3. Start building features from [UX_FLOWS.md](./UX_FLOWS.md)

---

**Need Help?**  
- Docs: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- Email: team@deepchat.app















