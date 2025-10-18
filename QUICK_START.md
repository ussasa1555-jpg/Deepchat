# QUICK START GUIDE

```
[QUICK_START] DEEPCHAT DEVELOPMENT SETUP
════════════════════════════════════════════════════════════
```

## PREREQUISITES

Before starting, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **Upstash Account** ([Sign up free](https://upstash.com/))
- **OpenAI API Key** ([Get key](https://platform.openai.com/))

---

## 1. PROJECT SETUP

### Clone Repository (or create new)

```bash
# Create project directory
mkdir deepchat
cd deepchat

# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Or clone if repo exists
# git clone https://github.com/yourusername/deepchat.git
# cd deepchat
```

### Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @upstash/redis
npm install framer-motion zustand
npm install @tanstack/react-query
npm install react-hook-form zod
npm install bcrypt dompurify
npm install -D @types/bcrypt @types/dompurify

# Optional: AI
npm install openai

# Optional: Error tracking
npm install @sentry/nextjs
```

---

## 2. SUPABASE SETUP

### Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `deepchat`
4. Database password: (save securely)
5. Region: Choose closest to your users
6. Click "Create new project" (wait 2-3 minutes)

### Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` (e.g., `https://xxx.supabase.co`)
   - `anon public` key
   - `service_role` key (keep secret!)

### Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase locally
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create migration file
supabase migration new initial_schema
```

**Copy the schema from `DATA_STRUCTURE.md`** into the migration file:

```sql
-- supabase/migrations/TIMESTAMP_initial_schema.sql

-- Create tables
CREATE TABLE users (...);
CREATE TABLE rooms (...);
-- ... (see DATA_STRUCTURE.md)

-- Create indexes
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
-- ... (see DATA_STRUCTURE.md)

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... (see RLS_SECURITY.md)

-- Create policies
CREATE POLICY select_own_profile ON users FOR SELECT ...;
-- ... (see RLS_SECURITY.md)
```

**Apply migrations**:

```bash
# Push to remote Supabase project
supabase db push
```

### Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for: `messages`, `dm_messages`
3. Click "Save"

---

## 3. REDIS SETUP (UPSTASH)

### Create Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click "Create Database"
3. Name: `deepchat-redis`
4. Region: Same as Supabase (or closest)
5. Type: Pay as you go (free tier)
6. Click "Create"

### Get Redis Credentials

1. Click on your database
2. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 4. ENVIRONMENT VARIABLES

Create `.env.local` in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only, KEEP SECRET

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# OpenAI (for Oracle AI)
OPENAI_API_KEY=sk-xxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Add to `.gitignore`**:
```
.env.local
.env*.local
```

---

## 5. PROJECT STRUCTURE

Create the following directories:

```bash
mkdir -p app/{auth,dashboard,rooms,room,nodes,dm,oracle,settings,purge,legal}
mkdir -p components/{ui,chat,layout}
mkdir -p lib/{supabase,validation}
mkdir -p hooks
mkdir -p stores
mkdir -p types
mkdir -p public/sounds
```

---

## 6. TAILWIND CONFIG

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'retro-black': '#000000',
        'retro-green': '#00FF00',
        'retro-cyan': '#00FFFF',
        'retro-magenta': '#FF00FF',
        'retro-amber': '#FF9900',
        'retro-dark-green': '#003300',
        'retro-dark-cyan': '#001a1a',
      },
      fontFamily: {
        mono: ['Consolas', 'Courier New', 'monospace'],
        retro: ['VT323', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 0, 0.5)',
        'glow-cyan': '0 0 10px rgba(0, 255, 255, 0.5)',
        'glow-amber': '0 0 10px rgba(255, 153, 0, 0.5)',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '10%, 30%, 50%, 70%, 90%': { opacity: '0.9' },
        },
      },
      animation: {
        blink: 'blink 500ms infinite',
        flicker: 'flicker 300ms',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 7. SUPABASE CLIENT

Create `lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export const supabase = createClientComponentClient<Database>();
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export const createClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
```

---

## 8. REDIS CLIENT

Create `lib/redis.ts`:

```typescript
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number // seconds
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    reset: ttl,
  };
}
```

---

## 9. GLOBAL STYLES

Update `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-retro-black text-retro-green font-mono;
  }
}

/* CRT Scanlines */
.crt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 3px
  );
  opacity: 0.05;
  z-index: 9999;
}

/* Blinking Cursor */
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.cursor-blink {
  animation: blink 500ms infinite;
}
```

---

## 10. ROOT LAYOUT

Update `app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deepchat — Retro Privacy Chat',
  description: 'Privacy-focused chat with 1980s terminal aesthetics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* CRT Scanlines Overlay */}
        <div className="crt-overlay" />
        
        {children}
      </body>
    </html>
  );
}
```

---

## 11. FIRST PAGE (DASHBOARD)

Create `app/dashboard/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border-2 border-retro-green p-8 shadow-glow-green">
        <h1 className="text-2xl uppercase tracking-widest mb-4">
          [SYSTEM_BOOT]
        </h1>
        <p className="text-retro-cyan">
          Welcome, {session.user.email}
        </p>
        <p className="text-sm text-retro-green/60 mt-4">
          UID: [Loading...]
        </p>
      </div>
    </div>
  );
}
```

---

## 12. RUN DEVELOPMENT SERVER

```bash
npm run dev
```

Visit: http://localhost:3000

You should see the black background with green text! 🟢

---

## 13. NEXT STEPS

Now implement features in this order:

1. **Authentication** (`/app/auth`)
   - Login page
   - Register page
   - Password reset

2. **Dashboard** (`/app/dashboard`)
   - UID display
   - Quick actions
   - Recent activity

3. **Public Rooms** (`/app/rooms/public`, `/app/room/[id]`)
   - Room list
   - Chat interface
   - Realtime messaging

4. **Private Rooms** (`/app/rooms/private`)
   - CLI key entry
   - Key validation Edge Function

5. **Direct Messages** (`/app/nodes`, `/app/dm/[uid]`)
   - Network nodes search
   - DM interface

6. **Oracle AI** (`/app/oracle`)
   - AI chat interface
   - Edge Function for OpenAI

7. **Settings** (`/app/settings`)
   - BIOS-style menu
   - Profile editing

8. **Purge Data** (`/app/purge`)
   - CLI command interface
   - Purge execution

Refer to the full specification documents for detailed implementation guidance!

---

## USEFUL COMMANDS

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Supabase
supabase start           # Start local Supabase
supabase db reset        # Reset local DB
supabase db push         # Push migrations to remote
supabase gen types typescript --local > types/database.ts  # Generate types

# Database
supabase db dump -f supabase/schema.sql  # Backup schema
```

---

## TROUBLESHOOTING

### Issue: Supabase connection fails

**Solution**: Check environment variables in `.env.local`, ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.

### Issue: Redis errors

**Solution**: Verify Upstash credentials, check if database is active in Upstash console.

### Issue: TypeScript errors

**Solution**: Generate Supabase types:
```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.ts
```

### Issue: Styles not loading

**Solution**: Restart dev server after Tailwind config changes:
```bash
npm run dev
```

---

## RESOURCES

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Upstash Redis**: https://docs.upstash.com/redis
- **OpenAI API**: https://platform.openai.com/docs

---

**Happy Coding!** 🟢

If you encounter issues, check the full specification docs or open an issue on GitHub.












