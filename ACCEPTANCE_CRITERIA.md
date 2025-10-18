# ACCEPTANCE CRITERIA & DEFINITION OF DONE

```
[ACCEPTANCE_CRITERIA] DEEPCHAT v1.0 — DEFINITION OF DONE
════════════════════════════════════════════════════════════
```

## OVERVIEW

This document defines the **minimum viable product (MVP)** for Deepchat v1.0 web. All criteria must be met before launch.

---

## 1. AUTHENTICATION & IDENTITY

### ✓ Registration Flow

- [ ] User can register with email only (no OAuth)
- [ ] Email verification required (6-digit code, 15-min expiry)
- [ ] UID auto-generated in format `DW-XXXX-XXXX` on registration
- [ ] UID displayed prominently post-registration with "save securely" warning
- [ ] Nickname chosen during registration (3-16 chars, alphanumeric + underscore)
- [ ] Password meets requirements: ≥12 chars, 1 uppercase, 1 lowercase, 1 number
- [ ] Password strength indicator shown (zxcvbn score ≥3 required)
- [ ] Registration rate limited: 3 attempts per hour per IP
- [ ] Email never shown in UI after registration

---

### ✓ Login Flow

- [ ] Can login with email OR UID + password
- [ ] Input toggle between email/UID modes
- [ ] Session JWT issued with 12-hour expiry
- [ ] Optional refresh token (7-day, secure cookie)
- [ ] Rate limited: 5 failed attempts = 15-minute lockout
- [ ] Attempt counter displayed: "Attempts remaining: X/5"
- [ ] "Forgot password?" link functional
- [ ] Auto-redirect to `/dashboard` on success
- [ ] Session persists across browser refresh (cookie-based)

---

### ✓ Password Reset

- [ ] User enters email → receives reset link
- [ ] Reset link expires in 1 hour
- [ ] New password meets same requirements as registration
- [ ] Old sessions invalidated on password change
- [ ] Security email sent to notify of password change

---

### ✓ Session Management

- [ ] Session expires after 12 hours of inactivity
- [ ] Auto-logout redirects to `/auth/login`
- [ ] Active session indicator in header/dashboard
- [ ] Manual logout button functional
- [ ] Logout clears cookies and invalidates JWT

---

## 2. PUBLIC ROOMS

### ✓ Room List (`/rooms/public`)

- [ ] Displays all public rooms in list/grid format
- [ ] Each room shows: name, member count, last activity time
- [ ] Rooms sorted by last activity (most recent first)
- [ ] Click room → auto-join → redirect to `/room/[id]`
- [ ] "Create New Room" button functional
- [ ] No private rooms shown in this list

---

### ✓ Room Creation

- [ ] Modal form with fields: name (required), description (optional)
- [ ] Name: 3-50 chars, description: max 200 chars
- [ ] Rate limited: 5 rooms per day per UID
- [ ] Creator automatically admin of room
- [ ] Room appears in public list immediately
- [ ] Auto-redirect to created room

---

### ✓ Room Chat (`/room/[id]`)

- [ ] Header shows: `[OPEN_CHANNEL]` + room name
- [ ] Message list displays: timestamp, UID, nickname, message content
- [ ] Format: `HH:MM:SS DW-XXXX > Message text`
- [ ] Messages auto-scroll to bottom on new message
- [ ] System messages in cyan: joins, leaves, admin actions
- [ ] Input field with blinking cursor, max 2000 chars
- [ ] Enter key sends message, Shift+Enter new line
- [ ] ESC clears input field
- [ ] Rate limited: 60 messages per minute per UID

---

### ✓ Realtime Updates

- [ ] New messages appear instantly (WebSocket)
- [ ] Join/leave events broadcast to all members
- [ ] No page refresh needed for updates
- [ ] Connection status indicator (online/offline)
- [ ] Auto-reconnect on connection loss
- [ ] Queued messages sent when reconnected

---

### ✓ Room Membership

- [ ] Can leave room via `[LEAVE_ROOM]` button
- [ ] Leave confirmation prompt shown
- [ ] After leaving, room disappears from user's room list
- [ ] Can re-join public room at any time
- [ ] Members list shows all current members (UID + Nickname)

---

## 3. PRIVATE ROOMS

### ✓ Key Entry Interface (`/rooms/private`)

- [ ] Full-screen CLI interface displayed
- [ ] Input prompt: `> CONNECT --KEY=____-____-____`
- [ ] Blinking cursor animation functional
- [ ] Auto-uppercase conversion on typing
- [ ] Auto-hyphen insertion at positions 4, 9
- [ ] Paste functionality disabled
- [ ] ESC returns to `/rooms`

---

### ✓ Key Validation

- [ ] Client-side format validation (12 chars + 2 hyphens)
- [ ] Server-side bcrypt comparison (constant-time)
- [ ] Loading state: `[VALIDATING_KEY...]` with progress bar
- [ ] Success: Brief CRT flicker → redirect to room
- [ ] Failure: Error message + attempts remaining (5 max)
- [ ] Rate limited: 5 attempts per hour per UID
- [ ] Countdown timer during lockout (MM:SS format)

---

### ✓ Key Security

- [ ] Keys never in URL parameters
- [ ] Keys never logged in plaintext (hashed only)
- [ ] Keys never in browser localStorage
- [ ] No auto-fill from clipboard
- [ ] Input masked after submit: `****-****-****`
- [ ] No QR code generation
- [ ] No shareable invite links

---

### ✓ Private Room Creation

- [ ] Same as public, but with "Private" checkbox
- [ ] Key auto-generated (12 hex chars, formatted XXXX-XXXX-XXXX)
- [ ] Key shown to creator ONCE with "Copy and share securely" warning
- [ ] Key hashed (bcrypt) before storing in database
- [ ] Room not listed in public rooms
- [ ] Only members see room in their dashboard

---

### ✓ Private Room Chat

- [ ] Header shows: `[ENCRYPTED_SESSION_ACTIVE]` + room name
- [ ] Same message format as public rooms
- [ ] Key expiry shown in room info (10 days inactivity)
- [ ] Admin can rotate key (invalidates old key)
- [ ] Key rotation broadcasts system message to all members

---

## 4. DIRECT MESSAGES (DMs)

### ✓ Network Nodes (`/nodes`)

- [ ] Search input: `FIND --TARGET=UID or Nickname`
- [ ] Exact match only (no fuzzy search)
- [ ] Search returns: UID, Nickname, online status
- [ ] Can send connection request from results
- [ ] Pending requests shown with 72-hour expiry countdown
- [ ] Can accept/decline incoming requests
- [ ] Block option prevents future requests from that UID

---

### ✓ Connection Requests

- [ ] Request notification shown to target user
- [ ] Shows: requester UID, nickname, time sent
- [ ] Accept → creates DM thread + adds to both users' nodes
- [ ] Decline → removes request silently (no notification to sender)
- [ ] Block → adds to block list, prevents future requests
- [ ] Auto-expire after 72 hours (cron job)

---

### ✓ DM Interface (`/dm/[uid]`)

- [ ] Header: `[ENCRYPTED MESSAGE CHANNEL]` + target UID/nickname
- [ ] Empty state: "Secure channel established"
- [ ] Same message format: `HH:MM:SS DW-XXXX > Message`
- [ ] Realtime updates via WebSocket
- [ ] Same 2000-char limit as room messages
- [ ] Can delete own messages within 15-minute window

---

### ✓ DM Thread Management

- [ ] Only 2 participants per thread (enforced by trigger)
- [ ] Either participant can delete thread
- [ ] Deleting thread removes all messages (cascade)
- [ ] Other user sees "Thread deleted" system message
- [ ] Can start new DM with same user after deletion

---

## 5. ORACLE 7.0 (AI)

### ✓ Oracle Interface (`/oracle`)

- [ ] Header: `[ORACLE_7.0] QUERY_INTERFACE`
- [ ] Input field with typewriter cursor
- [ ] Session ID generated on first query (UUID)
- [ ] Displays: "Session TTL: 1 hour"
- [ ] Rate limited: 20 queries per hour per UID

---

### ✓ Oracle Responses

- [ ] Response formatted in retro style (see COPYWRITING_GUIDE.md)
- [ ] Headers: `[OUTPUT_0xF0F]`, `[SIGNAL: STABLE]`, etc.
- [ ] ASCII box-drawing characters used
- [ ] Typewriter effect on response display (optional)
- [ ] Responses stream in real-time (if supported by API)

---

### ✓ Session Management

- [ ] Conversation history stored in Redis (not DB)
- [ ] Session expires after 1 hour of inactivity
- [ ] Expiry countdown shown in header
- [ ] On expiry: "Session expired. Start new session."
- [ ] No conversation content written to database

---

### ✓ Privacy

- [ ] No logging of conversation content
- [ ] Redis keys auto-expire (native TTL)
- [ ] OpenAI API calls proxied via Edge Function
- [ ] UID not sent to OpenAI (session ID only)
- [ ] Monthly budget cap enforced ($100)
- [ ] Over-budget error: "AI quota exceeded"

---

## 6. SETTINGS

### ✓ Settings Interface (`/settings`)

- [ ] BIOS-style menu layout
- [ ] Keyboard navigation: arrow keys + Enter
- [ ] Options: Nickname, Password, Avatar, Theme, System Audio

---

### ✓ Editable Fields

- [ ] Nickname: Can change (must be unique, 3-16 chars)
- [ ] Password: Change with old password verification
- [ ] Avatar: Upload pixel art or select ASCII preset (optional)
- [ ] Theme: Select from presets (classic green, cyan, magenta)
- [ ] System Audio: Toggle mute/unmute (default: muted)

---

### ✓ Settings Persistence

- [ ] Changes saved immediately (no "Save" button)
- [ ] Toast confirmation on each change
- [ ] Changes reflected in UI instantly
- [ ] Theme change applies without page refresh

---

## 7. PURGE_DATA

### ✓ Purge Interface (`/purge`)

- [ ] CLI command entry: `PURGE_DATA --CONFIRM`
- [ ] Exact match required (case-sensitive)
- [ ] Confirmation modal with DOS-style warning
- [ ] Lists what will be deleted vs. retained
- [ ] Password re-entry required
- [ ] ESC at any stage cancels purge

---

### ✓ Purge Execution

- [ ] Server-side function `purge_user_data()` called
- [ ] Deletes: messages, DMs, memberships, nodes, AI sessions
- [ ] Retains: UID, password hash (for re-login)
- [ ] Action logged in `purge_logs` (hashed UID only)
- [ ] Redis AI sessions cleared
- [ ] Completes in <5 seconds
- [ ] Success message: `[PURGE_COMPLETE] — DATA_WIPED`

---

### ✓ Post-Purge State

- [ ] User redirected to clean `/dashboard`
- [ ] No messages, rooms, DMs, or nodes visible
- [ ] Can immediately start using app again (clean slate)
- [ ] Confirmation email sent to user

---

## 8. SECURITY & PRIVACY

### ✓ Row-Level Security (RLS)

- [ ] RLS enabled on ALL tables
- [ ] Users can only read/write their own data
- [ ] Messages only accessible to room members
- [ ] DMs only accessible to thread participants
- [ ] Email never returned in SELECT queries (view-based protection)
- [ ] Service role policies isolated (not accessible to client)

---

### ✓ Rate Limiting

- [ ] All critical endpoints rate limited (Redis-based)
- [ ] Limits enforced: login (5/15m), register (3/h), message (60/m), room key (5/h), AI (20/h)
- [ ] Rate limit errors return 429 with retry-after header
- [ ] Countdown timers shown in UI during lockout
- [ ] IP-based + UID-based rate limiting (dual layer)

---

### ✓ Content Security

- [ ] CSP headers configured (see TECHNICAL_ARCHITECTURE.md)
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: no-referrer
- [ ] HTTPS-only (enforced by Vercel)
- [ ] WebSocket connections via WSS only

---

### ✓ Data Minimization

- [ ] Email hidden post-registration (view-based)
- [ ] No IP addresses stored (ephemeral in Redis only)
- [ ] No device fingerprints collected
- [ ] No analytics scripts (no Google Analytics, etc.)
- [ ] No third-party tracking cookies
- [ ] Audit logs hashed (SHA-256 UID, not plaintext)

---

## 9. DATA RETENTION & PURGE

### ✓ Auto-Purge CRON

- [ ] Daily job runs at 03:00 UTC
- [ ] Deletes messages where `ttl_at < NOW()`
- [ ] Deletes DM messages where `ttl_at < NOW()`
- [ ] Deletes AI sessions where `ttl_at < NOW()`
- [ ] Deletes pending nodes where `created_at > 72h`
- [ ] Deletes purge logs where `timestamp > 30d`
- [ ] Deletes inactive private rooms where `last_activity_at > 10d`
- [ ] VACUUM runs after deletions
- [ ] Job success/failure logged
- [ ] Admin alert on 3 consecutive failures

---

### ✓ TTL Triggers

- [ ] Messages: `ttl_at` set to `NOW() + 30 days` on insert
- [ ] DM messages: Same TTL trigger
- [ ] AI sessions: `ttl_at` set to `NOW() + 1 hour` on insert
- [ ] RLS policies hide expired messages (`ttl_at < NOW()`)

---

## 10. UI/UX REQUIREMENTS

### ✓ Retro Aesthetic

- [ ] Pure black background (#000000) everywhere
- [ ] Neon green (#00FF00) primary text
- [ ] Cyan (#00FFFF) links and system messages
- [ ] Amber (#FF9900) warnings and errors
- [ ] Monospace font (Consolas, Courier New)
- [ ] CRT scanlines overlay (subtle, 5% opacity)
- [ ] Blinking cursor animations
- [ ] No emojis (except in toasts: ✓✗⚠)

---

### ✓ Terminal Components

- [ ] TerminalPanel with green border and glow
- [ ] CLIInput with blinking cursor
- [ ] NeonButton with hover glow effect
- [ ] Modal with DOS-style double border
- [ ] Toast with slide-in animation
- [ ] Progress bars with block characters: `████░░░░`
- [ ] System headers: `[ALL_CAPS_FORMAT]`

---

### ✓ Responsive Design

- [ ] Mobile: single-column, larger tap targets (≥44px)
- [ ] Tablet: adjusted spacing, collapsible sidebars
- [ ] Desktop: full layout, multi-column where appropriate
- [ ] Font size scales: 14px (mobile) → 16px (desktop)
- [ ] Scanlines less prominent on mobile (2% opacity)

---

### ✓ Accessibility

- [ ] All interactive elements keyboard-navigable
- [ ] Tab order logical (left-to-right, top-to-bottom)
- [ ] Focus indicators visible (2px cyan outline)
- [ ] ARIA labels on all buttons/inputs
- [ ] Screen reader announcements for errors (`role="alert"`)
- [ ] Color contrast ≥7:1 (AAA level)
- [ ] Respects `prefers-reduced-motion` (disables animations)

---

### ✓ Performance

- [ ] Lighthouse Performance score ≥90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Initial JS bundle <100KB (gzipped)
- [ ] WebSocket reconnect <500ms
- [ ] Message send → display latency <200ms

---

## 11. LEGAL & COMPLIANCE

### ✓ Legal Pages

- [ ] `/legal/tos` — Terms of Service (plain text, retro-formatted)
- [ ] `/legal/privacy` — Privacy Policy (DOS-style, all caps headers)
- [ ] Both pages accessible without login
- [ ] Last updated date shown
- [ ] Contact email: legal@deepchat.app

---

### ✓ Privacy Policy Content

- [ ] Lists data collected (email, UID, messages)
- [ ] Lists data NOT collected (IP, device, location, analytics)
- [ ] Explains 30-day auto-purge
- [ ] Describes PURGE_DATA flow
- [ ] States GDPR/CCPA rights
- [ ] No sale of data clause
- [ ] Contact: privacy@deepchat.app

---

### ✓ TOS Content

- [ ] Prohibited content list (illegal, harassment, spam, etc.)
- [ ] Enforcement procedure (warnings, suspension, ban)
- [ ] Appeals process
- [ ] Disclaimers (no warranty, use at own risk)
- [ ] Governing law (specify jurisdiction)

---

## 12. TESTING

### ✓ Unit Tests

- [ ] UID generation (format, uniqueness)
- [ ] Password validation (strength, requirements)
- [ ] Message sanitization (XSS prevention)
- [ ] TTL calculation (30 days, 1 hour)
- [ ] Rate limiting logic (Redis counters)

---

### ✓ Integration Tests

- [ ] Registration → login flow
- [ ] Public room join → send message
- [ ] Private room key validation → access
- [ ] DM request → accept → send message
- [ ] Oracle query → response
- [ ] PURGE_DATA → verify deletion

---

### ✓ E2E Tests (Playwright/Cypress)

- [ ] User can register and login
- [ ] User can create public room
- [ ] User can send message in room
- [ ] User can join private room with valid key
- [ ] User can send DM after connection accepted
- [ ] User can execute PURGE_DATA

---

### ✓ Security Tests

- [ ] RLS prevents reading other users' data
- [ ] Rate limiting blocks after threshold
- [ ] Private room key validation uses constant-time comparison
- [ ] SQL injection attempts fail (parameterized queries)
- [ ] XSS attempts sanitized (DOMPurify)
- [ ] CSRF protected (SameSite cookies)

---

### ✓ Performance Tests

- [ ] 100 concurrent users → room message latency <500ms
- [ ] 1000 messages in room → scroll performance ≥30fps
- [ ] WebSocket reconnect under network interruption
- [ ] Redis rate limit check <50ms
- [ ] Database query time p95 <200ms

---

## 13. DEPLOYMENT

### ✓ Production Checklist

- [ ] Environment variables set (Supabase, Redis, OpenAI)
- [ ] Database migrations applied
- [ ] RLS policies enabled on all tables
- [ ] CRON jobs scheduled and tested
- [ ] CSP headers configured
- [ ] SSL certificate valid (Vercel auto)
- [ ] Domain configured (e.g., deepchat.app)
- [ ] Error tracking enabled (Sentry)
- [ ] Monitoring dashboards set up (Vercel, Supabase)

---

### ✓ Post-Deployment Verification

- [ ] Registration flow works end-to-end
- [ ] Login with email and UID both functional
- [ ] Public room creation and messaging works
- [ ] Private room key validation works
- [ ] DM flow works (request, accept, message)
- [ ] Oracle responds correctly
- [ ] PURGE_DATA executes successfully
- [ ] Auto-purge CRON runs on schedule
- [ ] Rate limiting enforces limits
- [ ] RLS policies block unauthorized access

---

## 14. DOCUMENTATION

### ✓ User-Facing Docs

- [ ] README on landing page (how Deepchat works)
- [ ] FAQ section (how to use private rooms, what is UID, etc.)
- [ ] Privacy policy linked in footer
- [ ] TOS linked in footer
- [ ] Contact/support email visible

---

### ✓ Developer Docs

- [ ] README.md (project overview, tech stack)
- [ ] CONTRIBUTING.md (how to contribute)
- [ ] .env.example (required env variables)
- [ ] Database schema documented (DATA_STRUCTURE.md)
- [ ] API endpoints documented (if applicable)

---

## 15. MONITORING & ALERTS

### ✓ Error Monitoring

- [ ] Sentry configured with DSN
- [ ] PII scrubbed from error reports (no emails, UIDs)
- [ ] Critical errors → Slack/email alert
- [ ] Error rate threshold alert (>1% requests)

---

### ✓ Performance Monitoring

- [ ] Vercel Analytics enabled
- [ ] Core Web Vitals tracked
- [ ] API response times monitored
- [ ] Database slow query log enabled (Supabase)
- [ ] Redis connection pool monitored

---

### ✓ Security Alerts

- [ ] Failed login spike → alert (>100 in 5 minutes)
- [ ] Rate limit hit spike → alert
- [ ] PURGE_DATA execution → log + alert
- [ ] Unusual database access pattern → alert

---

## 16. LAUNCH READINESS

### ✓ Final Checklist

- [ ] All acceptance criteria above met
- [ ] Beta test with 10-20 users completed
- [ ] Critical bugs fixed (P0, P1)
- [ ] Performance targets met (Lighthouse ≥90)
- [ ] Security audit passed (internal or external)
- [ ] Legal review completed (TOS, Privacy)
- [ ] Support email monitored (support@deepchat.app)
- [ ] Backup/restore procedure tested
- [ ] Incident response plan documented
- [ ] Marketing materials ready (if applicable)

---

### ✓ Go/No-Go Criteria

**LAUNCH if**:
- All "Critical" (P0) items complete
- Core flows (register, login, room, DM) work
- No security vulnerabilities (RLS, rate limiting functional)
- Legal pages live

**DELAY if**:
- Any P0 bug exists
- Security test fails
- Data purge not functional
- Performance <80 Lighthouse score

---

## DEFINITION OF DONE (DoD)

A feature is **DONE** when:

1. ✓ Code written and reviewed
2. ✓ Unit tests written and passing
3. ✓ Integration tests passing
4. ✓ UI matches design spec (retro aesthetic)
5. ✓ Accessibility requirements met (keyboard nav, ARIA)
6. ✓ Security review passed (RLS, rate limiting)
7. ✓ Performance acceptable (<3s TTI)
8. ✓ Documentation updated
9. ✓ Deployed to staging and verified
10. ✓ Product owner approval

---

## RELEASE NOTES TEMPLATE

**Deepchat v1.0.0** — [DATE]

**Features**:
- Anonymous email registration with UID-based identity
- Public and private chat rooms with CLI key entry
- Direct messages via Network Nodes system
- Oracle 7.0 AI chatbot with ephemeral sessions
- Auto-purge after 30 days (privacy-first)
- Manual PURGE_DATA command
- Retro terminal aesthetic (CRT effects, monospace, neon green)

**Security**:
- Row-Level Security on all database tables
- Rate limiting on all critical endpoints
- No IP/device tracking
- Minimal audit logs (hashed UIDs)

**Technical**:
- Next.js 14, TypeScript, Tailwind CSS
- Supabase (Auth, Postgres, Realtime)
- Redis (rate limiting, AI sessions)
- OpenAI GPT-4 (Oracle)

**Known Issues**:
- [List any minor bugs to be fixed in v1.0.1]

**Next Steps**:
- iOS app (4 months post-launch)
- Export data feature
- 2FA (optional)



