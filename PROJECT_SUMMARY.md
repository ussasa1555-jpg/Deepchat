# DEEPCHAT — PROJECT SUMMARY

```
[PROJECT_OVERVIEW] DEEPCHAT v1.0 — EXECUTIVE SUMMARY
════════════════════════════════════════════════════════════
```

## VISION

**Deepchat** is a privacy-focused chat platform that combines 1980s-90s retro terminal aesthetics with modern security practices. It's designed for users who value anonymity, ephemeral messaging, and a nostalgic computing experience.

---

## KEY DIFFERENTIATORS

### 1. Privacy-First Architecture
- **Anonymous by Design**: Email hidden post-signup, UID-based identity
- **Auto-Purge**: All messages deleted after 30 days
- **No Tracking**: No IP logging, no device fingerprints, no analytics
- **Minimal Logs**: Audit trails hashed and purged after 30 days

### 2. Retro Aesthetic
- **Terminal UI**: CRT effects, monospace fonts, blinking cursors
- **Neon Palette**: Green (#00FF00), cyan (#00FFFF), magenta (#FF00FF) on black
- **DOS-Style Modals**: Box-drawing characters, system headers like `[ACCESS_GRANTED]`
- **No Modern Clutter**: No emojis, no social media jargon, no "like" buttons

### 3. Security Features
- **Private Room Keys**: CLI-entered keys, no URL sharing (anti-phishing)
- **Row-Level Security**: Database-enforced access control
- **Rate Limiting**: Redis-based throttling on all critical endpoints
- **Manual Purge**: User-initiated `PURGE_DATA` command for complete data wipe

### 4. Ephemeral AI
- **Oracle 7.0**: Cryptic AI chatbot with retro persona
- **No History**: Conversations stored in Redis (1h TTL), never in DB
- **Privacy**: No content logged, UID not sent to OpenAI

---

## CORE FEATURES (v1.0 Web)

| Feature | Description |
|---------|-------------|
| **Anonymous Registration** | Email verification → UID minted (DW-XXXX-XXXX) → Never show email again |
| **Public Rooms** | Open chat channels, anyone can join, real-time messaging |
| **Private Rooms** | CLI key entry (CONNECT --KEY=XXXX-XXXX-XXXX), bcrypt-validated, 10-day expiry |
| **Direct Messages** | Search by exact UID/Nickname → request/accept → encrypted channel |
| **Network Nodes** | Contacts system (no "friends" jargon), 72h request expiry |
| **Oracle 7.0** | AI chatbot with terminal persona, ephemeral sessions |
| **PURGE_DATA** | Manual data wipe (keeps UID + password for re-login) |
| **Auto-Purge** | Messages/DMs auto-delete after 30 days (CRON job) |
| **Settings** | BIOS-style menu: nickname, password, avatar, theme, audio |

---

## TECH STACK

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (Custom retro theme)
- **Framer Motion** (Glitch effects, animations)
- **Zustand** (UI state management)
- **React Query** (Server state caching)

### Backend
- **Supabase** (Auth, Postgres, Realtime WebSocket)
- **Redis** (Upstash: rate limiting, AI sessions)
- **OpenAI GPT-4** (Oracle AI)
- **Edge Functions** (Deno: API routes)

### Infrastructure
- **Vercel** (Frontend hosting, edge network)
- **Supabase Cloud** (Managed database + realtime)
- **Deno Deploy** (Serverless functions)

---

## USER FLOWS (HIGH-LEVEL)

### 1. Registration → First Message
```
Email entry → Verification code → UID assigned (DW-XXXX-XXXX) →
Choose nickname + password → Dashboard → Join public room →
Send first message (green terminal text)
```

### 2. Private Room Join
```
Navigate to /rooms/private → CLI interface →
Type: CONNECT --KEY=A1B2-C3D4-E5F6 → Key validated →
[ACCESS_GRANTED] → Redirect to encrypted room
```

### 3. Direct Message
```
Search: FIND --TARGET=DW-9Z8Y-7X6W → Request connection →
Target accepts → DM thread created → [ENCRYPTED MESSAGE CHANNEL] →
Send messages (30-day TTL)
```

### 4. Data Purge
```
Navigate to /purge → Type: PURGE_DATA --CONFIRM →
Warning modal → Re-enter password → Execute →
All data wiped (except UID + password) → Clean slate
```

---

## SECURITY HIGHLIGHTS

### Database Security
- **Row-Level Security (RLS)**: Enabled on ALL tables
- **Email Protection**: View-based exclusion, never returned in SELECTs
- **Cascade Deletes**: ON DELETE CASCADE for referential integrity
- **Hashed Audit Logs**: SHA-256 UID, not plaintext

### Authentication
- **Argon2id**: Password hashing via Supabase
- **12-Hour Sessions**: JWT with optional 7-day refresh
- **Rate Limiting**: 5 login attempts → 15-minute lockout
- **No OAuth**: Email/password only (deliberate)

### Rate Limiting (Redis)
- Login: 5 attempts / 15 min
- Register: 3 / hour
- Message send: 60 / minute
- Private room key: 5 / hour
- Oracle AI: 20 / hour

### Content Security
- **CSP**: Strict Content-Security-Policy headers
- **HTTPS Only**: Enforced via Vercel + Supabase
- **No Third-Party**: No analytics, no tracking pixels
- **Input Sanitization**: DOMPurify for XSS prevention

---

## DATA RETENTION POLICY

| Data Type | Retention | Method |
|-----------|-----------|--------|
| Messages (room & DM) | 30 days | Auto-purge (CRON) |
| AI sessions | 1 hour | Redis native TTL |
| Private rooms (inactive) | 10 days | Auto-purge (CRON) |
| Pending node requests | 72 hours | Auto-purge (CRON) |
| Audit logs | 30 days | Auto-purge (CRON) |
| User accounts | Until manual delete | User action |

**CRON Job**: Runs daily at 03:00 UTC, deletes expired data, vacuums tables

---

## COMPLIANCE

### GDPR (EU)
✓ Right to Access (users can see all their data)  
✓ Right to Erasure (PURGE_DATA command)  
✓ Data Minimization (30-day auto-purge)  
✓ Purpose Limitation (chat only, no secondary use)  
✓ Storage Limitation (ephemeral by design)  

### CCPA (California)
✓ Right to Delete (same as GDPR)  
✓ Right to Know (users can export data, future feature)  
✓ No Sale of Data (no third-party sharing)  

---

## PERFORMANCE TARGETS

| Metric | Target | Status |
|--------|--------|--------|
| Lighthouse Performance | ≥90 | TBD (post-build) |
| First Contentful Paint | <1.5s | TBD |
| Time to Interactive | <3s | TBD |
| Initial JS Bundle | <100KB gzip | TBD |
| WebSocket Latency | <100ms | TBD |
| API Response (p95) | <500ms | TBD |

---

## ROADMAP

### Phase 1: Web v1.0 (Current)
- Core features (rooms, DMs, Oracle, purge)
- Retro UI implementation
- Security hardening (RLS, rate limiting)
- Auto-purge CRON
- **Target**: MVP launch

### Phase 2: Web v1.1 (+1 month)
- Export data feature (JSON download before purge)
- 2FA (optional, TOTP)
- Configurable retention (7/14/30/90 days)
- Room tags/categories
- Message search (local, not server-side)

### Phase 3: iOS App (+4 months)
- SwiftUI native app
- Shared auth with web
- Haptic feedback for CLI interactions
- FaceID lock (privacy, not identity)
- Local-only cache (24h TTL)
- Optional push: "INCOMING TRANSMISSION" (no content)

### Phase 4: Advanced Features (+6 months)
- End-to-end encryption (Signal protocol)
- Voice messages (audio only, no video)
- File sharing (encrypted, size-limited)
- Self-destructing messages (5s-24h custom TTL)
- Anonymous rooms (no UID shown)

---

## BUDGET ESTIMATES (Monthly)

### Hosting & Services
- **Vercel Pro**: $20/mo (team, analytics)
- **Supabase Pro**: $25/mo (8GB DB, 50GB transfer)
- **Upstash Redis**: ~$10/mo (pay-as-you-go)
- **OpenAI API**: ~$50-100/mo (3,000-10,000 AI sessions)
- **Domain**: $1/mo (deepchat.app)

**Total**: ~$106-156/mo

### Scaling (10k users)
- Supabase Pro: $25/mo (sufficient for 10k users)
- Redis: ~$30/mo (higher usage)
- OpenAI: $200/mo (budget cap)
- CDN/Bandwidth: Included in Vercel

**Total**: ~$256/mo

---

## TEAM REQUIREMENTS

### Minimum Viable Team
- **1 Full-Stack Developer** (Next.js + Supabase)
- **1 Designer** (UI/UX, retro aesthetic)
- **Part-time**: Legal (TOS/Privacy), QA (testing)

### Ideal Team (Post-Launch)
- 2 Full-Stack Developers
- 1 Frontend Specialist (React, animations)
- 1 Backend/DevOps (Supabase, Redis, monitoring)
- 1 Designer
- 1 Security Consultant (quarterly audits)
- Part-time: Community Manager, Legal

---

## RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Database breach** | High | RLS + encryption at rest, minimal data stored |
| **API abuse** | Medium | Rate limiting, Redis throttling, budget caps |
| **Spam/abuse** | Medium | Content filters, report system, admin tools |
| **Supabase outage** | High | Daily backups, documented restore procedure |
| **OpenAI costs** | Low | Budget cap ($100/mo), alert at 80% |
| **Legal issues** | Medium | Clear TOS, DMCA agent, abuse reporting |

---

## SUCCESS METRICS (3 months post-launch)

| Metric | Target |
|--------|--------|
| **Active Users** | 1,000 DAU |
| **Retention (7-day)** | >40% |
| **Avg Session Duration** | >10 minutes |
| **Messages Sent** | >10,000/day |
| **Private Rooms Created** | >100 |
| **DM Threads** | >500 active |
| **Oracle Queries** | >1,000/day |
| **PURGE_DATA Executions** | <5/day (low churn) |

---

## MARKETING POSITIONING

### Target Audience
- **Privacy Advocates**: Users who distrust mainstream social media
- **Retro Enthusiasts**: Fans of 80s/90s computing aesthetics
- **Developers**: Tech-savvy users who appreciate minimalism
- **Anonymous Communities**: Forums, whistleblowers, activists

### Key Messages
- "Chat like it's 1989 — with 2025 security"
- "Your messages, auto-deleted. Your data, never sold."
- "No tracking. No ads. No bullshit."
- "Enter the network. Leave no trace."

### Launch Channels
- Hacker News (Show HN post)
- Reddit: r/privacy, r/retrobattlestations, r/cyberpunk
- Product Hunt
- Privacy-focused newsletters
- Mastodon/Bluesky (not Twitter/X)

---

## COMPETITIVE LANDSCAPE

| Competitor | Strengths | Deepchat Advantage |
|------------|-----------|-------------------|
| **Signal** | E2EE, trusted | Retro UI, ephemeral by default, no phone number |
| **Telegram** | Feature-rich | Privacy-first (no metadata retention), simpler |
| **Discord** | Popular, gaming | No tracking, auto-purge, cleaner UI |
| **Matrix/Element** | Decentralized | Easier onboarding, better UX |
| **IRC** | Lightweight, old-school | Modern security, better mobile support |

**Unique Selling Points**:
1. Only chat app with retro terminal aesthetic
2. Auto-purge by default (not opt-in)
3. UID-based identity (no phone, no username leaks)
4. CLI-based private rooms (anti-phishing design)

---

## LEGAL CONSIDERATIONS

### Required Policies
- [x] Privacy Policy (retro-formatted)
- [x] Terms of Service (DOS-style)
- [ ] DMCA Agent (if UGC grows)
- [ ] Cookie Policy (minimal, session cookies only)

### Jurisdictional Concerns
- **Recommended**: Incorporate in privacy-friendly jurisdiction (e.g., Switzerland, Iceland)
- **Hosting**: Supabase US/EU regions available (choose based on target market)
- **GDPR**: Compliant via data minimization and right to erasure
- **CCPA**: Compliant via no-sale policy

---

## OPEN QUESTIONS

1. **Monetization**: How to sustain without ads/tracking?
   - Option A: Premium tier ($5/mo) with longer retention, more AI queries
   - Option B: Donations (Patreon, Open Collective)
   - Option C: Self-hosted licenses for enterprises

2. **Moderation**: How to handle abuse without tracking users?
   - Option A: Report system + hashed UID bans
   - Option B: Community moderation (room admins only)
   - Option C: AI content filter (server-side, no logs)

3. **End-to-End Encryption**: Should we implement Signal Protocol?
   - Pros: True E2EE, zero-knowledge
   - Cons: Complex, breaks some features (search, moderation)
   - Decision: Post-v1 feature, opt-in per room

4. **Decentralization**: Should Deepchat be federated (like Matrix)?
   - Pros: Censorship-resistant, user-owned servers
   - Cons: Complexity, metadata leaks between servers
   - Decision: Explore in Phase 5 (12+ months)

---

## CONTACT

**Project Lead**: [Your Name]  
**Email**: team@deepchat.app  
**Website**: https://deepchat.app (TBD)  
**GitHub**: https://github.com/deepchat (TBD)  
**Support**: support@deepchat.app  

---

## CREDITS

**Inspired by**:
- BBS systems (1980s-90s)
- IRC (Internet Relay Chat)
- Cyberpunk aesthetics
- Privacy-focused tools (Signal, Tor, Tails)

**Technology Stack**:
- Next.js (Vercel)
- Supabase (PostgreSQL + Realtime)
- Tailwind CSS
- OpenAI
- Upstash Redis

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-14  
**Status**: Specification Complete ✓



















