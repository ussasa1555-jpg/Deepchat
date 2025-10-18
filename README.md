# DEEPS ROOMS v1.0

**A retro, privacy-focused chat platform with terminal aesthetics and ephemeral messaging.**

---

## 🎯 PROJECT OVERVIEW

Deepchat is a web-based messaging platform that prioritizes privacy, anonymity, and a nostalgic retro computing experience. Built with a terminal/DOS aesthetic, it offers public rooms, private encrypted channels, direct messaging, and an AI companion—all with automatic data purge and minimal logging.

### Core Principles
- **Privacy First**: No tracking, minimal logs, 30-day auto-purge
- **Anonymous by Design**: UID-based identity, email hidden post-signup
- **Retro Aesthetic**: CRT effects, monospace fonts, neon green terminals
- **Ephemeral Data**: Messages auto-delete, sessions expire, AI conversations disappear
- **Security**: Row-level security, rate limiting, no phishing vectors

---

## 📚 DOCUMENTATION INDEX

| Document | Description |
|----------|-------------|
| [SITEMAP.md](./SITEMAP.md) | Navigation structure and routing |
| [UX_FLOWS.md](./UX_FLOWS.md) | Step-by-step user interaction flows |
| [ROOM_KEY_INTERFACE.md](./ROOM_KEY_INTERFACE.md) | Private room CLI specification |
| [UI_KIT.md](./UI_KIT.md) | Design system and component library |
| [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) | Tech stack and system design |
| [RLS_SECURITY.md](./RLS_SECURITY.md) | Row-level security policies |
| [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) | Database schema and relationships |
| [RETENTION_PURGE.md](./RETENTION_PURGE.md) | Data lifecycle and purge specs |
| [COPYWRITING_GUIDE.md](./COPYWRITING_GUIDE.md) | Content tone and messaging style |
| [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) | Definition of done checklist |

---

## 🚀 TECH STACK (v1.0 Web)

**Frontend**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS (custom retro theme)
- Framer Motion (glitch effects)
- Zustand (UI state)

**Backend**
- Supabase (Auth, Postgres, Realtime)
- Edge Functions (Deno)
- Redis (TTL sessions)
- OpenAI API (Oracle 7.0 AI)

**Security**
- Row-Level Security (RLS) on all tables
- Argon2id password hashing
- JWT sessions (12h TTL)
- Rate limiting (Redis)

---

## 🎨 BRAND IDENTITY

**Visual Style**: 1980s-90s terminal/BBS aesthetic  
**Color Palette**: Neon green (#00FF00), cyan (#00FFFF), magenta (#FF00FF) on pure black (#000000)  
**Typography**: Monospace only (Consolas, Courier New, VT323)  
**Effects**: CRT scanlines, glitch animations, typewriter text  

---

## 🔐 PRIVACY FEATURES

✓ Email hidden after registration (never shown in UI)  
✓ UID-based identity (e.g., DW-7F2A-9K1B)  
✓ Auto-purge messages after 30 days  
✓ Manual PURGE_DATA command (irreversible)  
✓ No IP/device tracking (ephemeral rate limiting only)  
✓ Minimal hashed audit logs (30-day retention)  
✓ AI conversations not stored (1-hour Redis TTL)  

---

## 📱 FUTURE: iOS APP (4 MONTHS POST-WEB)

**Planned Features**:
- SwiftUI shell mirroring web flows
- Shared authentication
- Haptic feedback for CLI interactions
- FaceID lock (privacy, not identity)
- Local cache ≤24h TTL
- Optional push: "INCOMING TRANSMISSION" (no content preview)

**Not Included**: No additional data collection beyond web

---

## 🚫 NON-GOALS (v1.0)

This platform deliberately **excludes**:
- Mobile apps (web v1 only)
- Push notifications
- Public user profiles
- Media feeds/photo sharing
- Geolocation features
- DM by email search
- Analytics/advertising
- OAuth/social login

---

## 📊 PROJECT STATUS

**Phase**: ✅ Core Features Implemented (v1.0)  
**Implementation Status**: ~70% Complete

**✅ Completed:**
1. ✅ Database schema (10 tables, RLS, functions)
2. ✅ Supabase integration (Auth, Realtime)
3. ✅ Next.js frontend (15 pages)
4. ✅ Component library (3 core components)
5. ✅ Authentication flows (login, register, reset)
6. ✅ Realtime chat (public rooms, DMs)
7. ⚠️ AI integration (UI ready, API key needed)
8. ⚠️ Security (RLS active, rate limiting needs Redis config)
9. ⏳ Performance testing (pending)
10. ⏳ Beta launch (ready for testing)

**⚠️ Needs Configuration:**
- `.env.local` file with API keys
- Realtime enabled in Supabase
- Redis configured (optional for rate limiting)
- OpenAI API key (optional for Oracle AI)

**See:** [START_HERE.md](./START_HERE.md) for quick start guide

---

## 📄 LICENSE

TBD (Recommend AGPL-3.0 for source-available privacy software)

---

**Generated**: 2025-10-14  
**Version**: 1.0.0-spec  
**Maintainer**: [Your Name/Team]



