# TECHNICAL ARCHITECTURE

```
[ARCHITECTURE] DEEPCHAT TECHNICAL STACK & STRUCTURE
════════════════════════════════════════════════════════════
```

## STACK OVERVIEW

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14+ | App Router, SSR/ISR, Edge Runtime |
| **TypeScript** | 5.x | Type safety, strict mode |
| **Tailwind CSS** | 3.x | Utility-first styling, custom theme |
| **Framer Motion** | 11.x | Animations, glitch effects |
| **Zustand** | 4.x | Global UI state (theme, sounds, modals) |
| **React Query** | 5.x | Server state caching, mutations |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 3.x | Runtime validation, type generation |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | BaaS (Auth, Postgres, Realtime, Storage) |
| **Postgres** | Primary database (v15+) |
| **Supabase Auth** | Email/password authentication |
| **Supabase Realtime** | WebSocket for live chat |
| **Edge Functions** | Deno runtime, serverless API |
| **Redis** | Session cache, rate limiting, AI sessions (Upstash) |
| **OpenAI API** | GPT-4 Turbo for Oracle 7.0 |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting, edge functions |
| **Supabase Cloud** | Managed Postgres + Realtime |
| **Upstash Redis** | Serverless Redis (TTL cache) |
| **Deno Deploy** | Edge function runtime (via Supabase) |

---

## FRONTEND ARCHITECTURE

### Directory Structure

```
deepchat/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── reset/
│   ├── dashboard/
│   ├── rooms/
│   │   ├── public/
│   │   └── private/
│   ├── room/[id]/
│   ├── nodes/
│   ├── dm/[uid]/
│   ├── oracle/
│   ├── settings/
│   ├── purge/
│   ├── legal/
│   │   ├── tos/
│   │   └── privacy/
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React components
│   ├── ui/                 # UI Kit components
│   │   ├── TerminalPanel.tsx
│   │   ├── CLIInput.tsx
│   │   ├── NeonButton.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── RoomHeader.tsx
│   └── layout/
│       ├── Header.tsx
│       └── CRTOverlay.tsx
├── lib/                    # Utilities
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── redis.ts
│   ├── validation/
│   │   └── schemas.ts      # Zod schemas
│   └── utils.ts
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useRealtime.ts
│   └── useRateLimit.ts
├── stores/                 # Zustand stores
│   ├── uiStore.ts
│   └── audioStore.ts
├── types/                  # TypeScript types
│   ├── database.ts         # Generated from Supabase
│   └── index.ts
├── styles/
│   └── globals.css
├── public/
│   └── sounds/
│       ├── keypress.mp3
│       ├── modem.mp3
│       ├── error.mp3
│       └── success.mp3
└── supabase/               # Supabase config
    ├── functions/          # Edge functions
    │   ├── oracle/
    │   ├── verify-key/
    │   └── purge/
    └── migrations/         # SQL migrations
```

---

### State Management Strategy

**1. Server State (React Query)**:
- Messages, rooms, users, nodes
- Cached with stale-while-revalidate
- Optimistic updates for messages

**2. UI State (Zustand)**:
- Theme settings, audio enabled/disabled
- Modal open/closed states
- Toast notifications

**3. Auth State (Supabase Context)**:
- Session, user, UID
- Provided via React Context
- Persisted in secure cookies

**4. Realtime State (Custom Hook)**:
- WebSocket connection status
- Live message updates
- Presence (future feature)

---

### Rendering Strategy

| Route | Strategy | Reason |
|-------|----------|--------|
| `/legal/*` | Static (SSG) | Rarely changes |
| `/dashboard` | Server Component | User-specific, no client state |
| `/room/[id]` | Client Component | Realtime updates, WebSocket |
| `/dm/[uid]` | Client Component | Realtime updates |
| `/oracle` | Client Component | Stateful AI conversation |
| `/auth/*` | Client Component | Form interactions |

---

## BACKEND ARCHITECTURE

### UID Generation System

**Format**: `DW-XXXX-XXXX`

**SQL Function**:
```sql
CREATE OR REPLACE FUNCTION generate_uid()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- 34 chars (no I, O)
  result TEXT := 'DW-';
  random_char TEXT;
BEGIN
  FOR i IN 1..8 LOOP
    IF i = 5 THEN
      result := result || '-';
    END IF;
    random_char := substr(chars, floor(random() * length(chars))::int + 1, 1);
    result := result || random_char;
  END LOOP;
  
  -- Collision check
  IF EXISTS (SELECT 1 FROM users WHERE uid = result) THEN
    RETURN generate_uid(); -- Recursive retry
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Trigger on User Insert**:
```sql
CREATE TRIGGER set_uid_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  WHEN (NEW.uid IS NULL)
  EXECUTE FUNCTION set_uid();

CREATE FUNCTION set_uid()
RETURNS TRIGGER AS $$
BEGIN
  NEW.uid := generate_uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Authentication Flow

**Registration**:
```mermaid
User → [Email] → Supabase Auth
                ↓
          [Send verification code]
                ↓
User → [Enter code] → Verify
                ↓
          [UID generated via trigger]
                ↓
User → [Nickname, Password] → Create profile
                ↓
          [Session JWT issued]
                ↓
          Redirect to /dashboard
```

**Login**:
```mermaid
User → [Email/UID + Password] → Supabase Auth
                ↓
        [Validate credentials]
                ↓
        [Issue JWT (12h TTL)]
                ↓
        Redirect to /dashboard
```

**Session Management**:
- **JWT**: 12-hour expiry (access token)
- **Refresh Token**: 7-day (optional, secure cookie)
- **Storage**: HTTP-only cookies (not localStorage)
- **Renewal**: Automatic via Supabase client

---

### Realtime Chat Architecture

**WebSocket Connection**:
```typescript
// Subscribe to room messages
const channel = supabase
  .channel(`room:${roomId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      // Add message to local state
      addMessage(payload.new);
    }
  )
  .subscribe();
```

**Message Flow**:
```
User types message
      ↓
Client: Optimistic update (instant UI feedback)
      ↓
POST /api/messages (with RLS check)
      ↓
Postgres INSERT (if authorized)
      ↓
Realtime broadcast to all channel subscribers
      ↓
Other clients receive & render message
```

**RLS Enforcement**:
- Even with WebSocket, RLS policies enforced
- User only receives messages from rooms they're a member of
- No way to bypass via direct WebSocket subscription

---

### Private Room Key System

**Key Generation** (on room creation):
```typescript
import { randomBytes } from 'crypto';

function generateRoomKey(): string {
  const buffer = randomBytes(6); // 6 bytes = 12 hex chars
  const hex = buffer.toString('hex').toUpperCase();
  
  // Format: XXXX-XXXX-XXXX
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}
```

**Key Storage** (hashed):
```typescript
import { hash } from 'bcrypt';

const keyHash = await hash(roomKey, 10); // bcrypt with 10 rounds

// Store in rooms.key_hash (never plaintext)
await supabase
  .from('rooms')
  .update({ key_hash: keyHash })
  .eq('id', roomId);
```

**Key Validation** (Edge Function):
```typescript
// POST /api/rooms/verify-key
export async function POST(req: Request) {
  const { key, roomId } = await req.json();
  
  // Rate limit check (Redis)
  const uid = getCurrentUserUID();
  const attempts = await redis.incr(`rate:room_key:${uid}`);
  if (attempts === 1) {
    await redis.expire(`rate:room_key:${uid}`, 3600);
  }
  if (attempts > 5) {
    return Response.json(
      { error: 'RATE_LIMITED', retry_after: await redis.ttl(`rate:room_key:${uid}`) },
      { status: 429 }
    );
  }
  
  // Fetch room
  const { data: room } = await supabase
    .from('rooms')
    .select('id, key_hash, name')
    .eq('id', roomId)
    .single();
  
  if (!room) {
    return Response.json({ error: 'ROOM_NOT_FOUND' }, { status: 404 });
  }
  
  // Verify key (constant-time comparison via bcrypt)
  const isValid = await bcrypt.compare(key, room.key_hash);
  
  if (!isValid) {
    return Response.json({ error: 'INVALID_KEY' }, { status: 403 });
  }
  
  // Add user to room members
  await supabase
    .from('members')
    .insert({ room_id: roomId, uid, role: 'member' });
  
  return Response.json({ success: true, room });
}
```

---

### AI Oracle System

**Architecture**:
```
User message
      ↓
POST /api/oracle
      ↓
Check Redis for session: `ai:session:${sessionId}`
      ↓
Load conversation history (if exists)
      ↓
Append user message
      ↓
Call OpenAI API (GPT-4 Turbo)
      ↓
Format response in retro style
      ↓
Update Redis session (SET with EX 3600)
      ↓
Return formatted response
      ↓
(NO database write of conversation)
```

**Edge Function** (`/api/oracle`):
```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();
  const uid = getCurrentUserUID();
  
  // Rate limit: 20 queries/hour
  const count = await redis.incr(`rate:oracle:${uid}`);
  if (count === 1) await redis.expire(`rate:oracle:${uid}`, 3600);
  if (count > 20) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }
  
  // Load session history
  const historyJson = await redis.get(`ai:session:${sessionId}`);
  const history = historyJson ? JSON.parse(historyJson) : [];
  
  // Append user message
  history.push({ role: 'user', content: message });
  
  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `You are Oracle 7.0, an enigmatic AI in a retro terminal network. 
        Respond in cryptic, technical language with ASCII formatting. 
        Use headers like [OUTPUT_0xF0F], system codes, and box-drawing characters.
        Be concise, formal, mysterious. Never break character.`,
      },
      ...history,
    ],
    temperature: 0.8,
    max_tokens: 500,
  });
  
  const aiResponse = completion.choices[0].message.content;
  
  // Append AI response to history
  history.push({ role: 'assistant', content: aiResponse });
  
  // Save to Redis (1 hour TTL)
  await redis.setex(
    `ai:session:${sessionId}`,
    3600,
    JSON.stringify(history.slice(-20)) // Keep last 20 messages
  );
  
  return Response.json({ response: aiResponse });
}
```

**Cost Management**:
- Rate limit: 20 queries/hour per UID
- Monthly budget cap: $100 (~3,000-10,000 sessions)
- If exceeded: Return error with upgrade prompt

---

### Data Purge System

**Manual PURGE_DATA** (Edge Function):
```typescript
// POST /api/purge
export async function POST(req: Request) {
  const { password } = await req.json();
  const uid = getCurrentUserUID();
  
  // Verify password
  const { data: user } = await supabase.auth.getUser();
  const isValid = await verifyPassword(user.email, password);
  
  if (!isValid) {
    return Response.json({ error: 'INVALID_PASSWORD' }, { status: 401 });
  }
  
  // Execute purge (cascade delete)
  const { error } = await supabase.rpc('purge_user_data', { target_uid: uid });
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  // Log action (hashed UID)
  await supabase.from('purge_logs').insert({
    uid_hash: sha256(uid),
    action: 'purge_data',
  });
  
  return Response.json({ success: true });
}
```

**SQL Function**:
```sql
CREATE OR REPLACE FUNCTION purge_user_data(target_uid TEXT)
RETURNS VOID AS $$
BEGIN
  -- Delete messages
  DELETE FROM messages WHERE uid = target_uid;
  
  -- Delete DMs
  DELETE FROM dm_messages WHERE uid = target_uid;
  DELETE FROM dm_participants WHERE uid = target_uid;
  
  -- Leave rooms
  DELETE FROM members WHERE uid = target_uid;
  
  -- Remove network nodes
  DELETE FROM nodes WHERE owner_uid = target_uid OR peer_uid = target_uid;
  
  -- Clear AI sessions (Redis handled separately)
  
  -- Update user profile to "clean slate" (keep UID + password)
  UPDATE users
  SET
    nickname = 'PURGED_USER',
    avatar = NULL,
    last_login_at = NULL
  WHERE uid = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Auto-Purge CRON** (daily at 03:00 UTC):
```sql
-- Supabase Edge Function scheduled via pg_cron
SELECT cron.schedule(
  'auto-purge-expired-data',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$
    -- Delete expired messages
    DELETE FROM messages WHERE ttl_at < NOW();
    DELETE FROM dm_messages WHERE ttl_at < NOW();
    
    -- Delete expired AI sessions (handled in Redis with native TTL)
    
    -- Delete old purge logs
    DELETE FROM purge_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete pending node requests > 72h
    DELETE FROM nodes WHERE status = 'pending' AND created_at < NOW() - INTERVAL '72 hours';
    
    -- Vacuum tables to reclaim space
    VACUUM ANALYZE messages;
    VACUUM ANALYZE dm_messages;
  $$
);
```

---

### Rate Limiting System

**Redis Implementation** (Upstash):
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
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

**Rate Limit Rules**:
```typescript
const RATE_LIMITS = {
  login: { limit: 5, window: 900 }, // 5 attempts per 15 min
  register: { limit: 3, window: 3600 }, // 3 per hour
  message_send: { limit: 60, window: 60 }, // 60 per minute
  private_room_key: { limit: 5, window: 3600 }, // 5 per hour
  oracle_query: { limit: 20, window: 3600 }, // 20 per hour
  dm_create: { limit: 10, window: 3600 }, // 10 per hour
};
```

---

## SECURITY ARCHITECTURE

### Content Security Policy

**Headers** (`next.config.js`):
```javascript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' wss://*.supabase.co https://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
        ],
      },
    ];
  },
};
```

---

### Password Security

**Hashing**: Argon2id (Supabase default)

**Requirements** (enforced client + server):
- Minimum 12 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Zxcvbn strength score ≥ 3

**Validation Schema**:
```typescript
import { z } from 'zod';
import zxcvbn from 'zxcvbn';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .refine((password) => zxcvbn(password).score >= 3, {
    message: 'Password too weak',
  });
```

---

### Input Sanitization

**Message Content**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeMessage(input: string): string {
  // Remove HTML tags
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Trim whitespace
  return clean.trim().slice(0, 2000); // Max 2000 chars
}
```

**SQL Injection Prevention**:
- Supabase client uses parameterized queries
- All RLS policies prevent unauthorized access
- No raw SQL in application code

---

### HTTPS & Certificates

- **Vercel**: Auto HTTPS with Let's Encrypt
- **Supabase**: TLS 1.3 enforced
- **WebSocket**: WSS only (no WS)

---

## MONITORING & OBSERVABILITY

### Error Tracking

**Sentry Integration**:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

### Performance Monitoring

**Vercel Analytics**:
- Core Web Vitals
- Page load times
- Edge function latency

**Supabase Metrics**:
- Database query performance
- Connection pool usage
- Realtime subscriber count

---

## DEPLOYMENT PIPELINE

```
Git Push → GitHub
      ↓
Vercel Build (auto-trigger)
      ↓
- Next.js build
- TypeScript check
- Linting (ESLint)
- Tests (if any)
      ↓
Deploy to Preview (PR) or Production (main)
      ↓
Supabase migrations (manual or CI)
      ↓
Smoke tests
      ↓
Live ✓
```

---

## ENVIRONMENT VARIABLES

**Required**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only

# Redis (Upstash)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# App
NEXT_PUBLIC_APP_URL=https://deepchat.app
```

---

## PERFORMANCE TARGETS

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Performance | ≥ 90 | Lighthouse CI |
| First Contentful Paint | < 1.5s | Web Vitals |
| Time to Interactive | < 3s | Web Vitals |
| WebSocket latency | < 100ms | Custom monitoring |
| API response time (p95) | < 500ms | Vercel Analytics |
| Database query time (p95) | < 200ms | Supabase logs |

---

## SCALABILITY CONSIDERATIONS

### Database

**Current**: Supabase Free tier (500MB, 2GB transfer)  
**Next**: Pro tier ($25/mo) → 8GB, 50GB transfer  
**Scaling**: Dedicated instance for >10k users  

**Optimization**:
- Indexes on `(uid, created_at)`, `(room_id, created_at)`
- Partitioning on `messages` table by date (if >1M rows)
- Connection pooling (Supabase default: pgBouncer)

### Redis

**Current**: Upstash Free tier (10k requests/day)  
**Scaling**: Pay-as-you-go ($0.20/100k requests)

### CDN

**Assets**: Vercel Edge Network (global CDN)  
**Caching**: Static assets (1 year), API routes (no cache)

---

## DISASTER RECOVERY

### Backups

**Supabase**: Daily automated backups (7-day retention on Pro tier)  
**Manual Exports**: Weekly pg_dump to encrypted S3 bucket  
**Redis**: No persistence needed (ephemeral data only)  

### Restore Procedure

1. Spin up new Supabase project
2. Restore from latest pg_dump
3. Update environment variables
4. Redeploy frontend (Vercel)
5. Test auth + realtime
6. Switch DNS (if domain change)

**RTO**: < 4 hours  
**RPO**: < 24 hours




