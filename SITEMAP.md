# SITEMAP & NAVIGATION FLOW

```
[SYSTEM_ARCHITECTURE] DEEPCHAT WEB v1.0 — NAVIGATION MAP
════════════════════════════════════════════════════════════

┌─ ROOT (/)
│
├─ /auth
│  ├─ /auth/login          → Email/UID + Password entry
│  ├─ /auth/register       → Anonymous email registration
│  └─ /auth/reset          → Password recovery flow
│
├─ /dashboard              → Terminal-style entry panel
│  │                         - System status indicators
│  │                         - Quick command palette
│  │                         - Last activity feed
│
├─ /rooms
│  ├─ /rooms/public        → List of open channels
│  └─ /rooms/private       → CLI key entry interface
│
├─ /room/[id]              → Active chat session
│  │                         (context-aware: public/private/encrypted)
│
├─ /nodes                  → Network Nodes (contacts/friends)
│  │                         - Search by UID or exact Nickname
│  │                         - Connection requests
│
├─ /dm/[uid]               → Direct message thread
│  │                         [ENCRYPTED MESSAGE CHANNEL]
│
├─ /oracle                 → AI Bot Interface (Oracle 7.0)
│  │                         - Ephemeral session UI
│  │                         - Cryptic retro-futuristic persona
│
├─ /settings               → BIOS-style configuration
│  │                         - Nickname, Password, Avatar
│  │                         - Theme/Palette selector
│
├─ /purge                  → PURGE_DATA command interface
│  │                         - CLI-style data wipe
│  │                         - Multi-step confirmation
│
└─ /legal
   ├─ /legal/tos           → Terms of Service (DOS format)
   └─ /legal/privacy       → Privacy Policy (retro-formatted)

════════════════════════════════════════════════════════════
```

## NAVIGATION RULES

### Authentication Requirements
- **Public Routes** (no auth required):
  - `/auth/*` (login, register, reset)
  - `/legal/*` (TOS, privacy)

- **Protected Routes** (auth required):
  - All other routes redirect to `/auth/login` if session expired

### Session Management
- **Session TTL**: 12 hours maximum
- **Auto-redirect**: Expired sessions → `/auth/login`
- **Refresh Token**: Optional 7-day (secure cookie)
- **Logout**: Manual via dashboard or auto-expire

### Keyboard Shortcuts
- `ESC` → Cancel current action / Close modal
- `CTRL+K` → Clear current input field
- `CTRL+/` → Open quick command palette (dashboard)
- `CTRL+L` → Jump to location/room search
- `CTRL+N` → New DM (from nodes page)

### URL Structure
- **Public rooms**: `/room/[uuid]` (accessible via list)
- **Private rooms**: `/room/[uuid]` (accessible only post-key validation)
- **Direct messages**: `/dm/[uid]` (uid = target user's UID, e.g., DW-1A2B-3C4D)
- **No shareable links**: Private room keys never in URL parameters

### Security Constraints
- No external links in private room keys (anti-phishing)
- No URL-based room invites (keys entered via CLI only)
- Rate limiting per UID on all protected routes
- HTTPS-only (CSP enforced)

---

## PAGE-BY-PAGE DESCRIPTIONS

### `/auth/login`
**Purpose**: User authentication  
**Inputs**:
- Email OR UID (DW-XXXX-XXXX)
- Password (masked)

**Features**:
- Option toggle: Email vs UID
- "Forgot password?" link → `/auth/reset`
- Rate limit: 5 attempts / 15 minutes
- No "Remember Me" (explicit session choice)

**Success**: Redirect to `/dashboard`  
**Failure**: Error message + attempt counter

---

### `/auth/register`
**Purpose**: Anonymous user registration  
**Steps**:
1. Enter email
2. Verify email (6-digit code)
3. UID minted (DW-XXXX-XXXX)
4. Choose Nickname (3-16 chars)
5. Set password (min 12 chars)

**Post-Registration**:
- Email hidden from all future UI
- UID becomes primary identifier
- Redirect to `/dashboard`

---

### `/dashboard`
**Purpose**: Main entry point post-login  
**Layout**: Terminal-style interface

**Sections**:
- **Header**: `[SYSTEM_ONLINE] DW-XXXX-XXXX • Nickname`
- **Status Panel**:
  - Active rooms count
  - Unread DMs count
  - Network nodes online
- **Quick Commands**:
  - `> JOIN_PUBLIC_ROOM`
  - `> CONNECT_PRIVATE_ROOM`
  - `> SEARCH_NODES`
  - `> ORACLE_QUERY`
- **Recent Activity**: Last 10 messages/events (scrollable log)

---

### `/rooms/public`
**Purpose**: Browse and join open channels  
**Display**: List of public rooms

**Each Room Card**:
```
┌─────────────────────────────────────┐
│ [ROOM_001] The Cipher Lounge        │
│ Members: 42 • Last active: 2m ago   │
│ [ENTER]                             │
└─────────────────────────────────────┘
```

**Actions**:
- Click `[ENTER]` → Join room → Redirect to `/room/[id]`
- `[CREATE_NEW]` button → Modal to create room

---

### `/rooms/private`
**Purpose**: Join private room via key  
**Interface**: Full-screen CLI simulation

**Input Prompt**:
```
> CONNECT --KEY=____-____-____
```

**Validation States**:
- `[VALIDATING_KEY...]` (loading)
- `[ACCESS_GRANTED]` → Redirect to `/room/[id]`
- `[ERROR_403] INVALID_KEY` → Retry prompt

**Security**:
- Keys never in URL
- 5 attempts / hour limit
- No copy/paste (keyboard only)

---

### `/room/[id]`
**Purpose**: Active chat session (public or private)  
**Layout**: Full-screen terminal chat

**Header** (context-aware):
- Public: `[OPEN_CHANNEL] Room Name`
- Private: `[ENCRYPTED_SESSION_ACTIVE] Room Name`

**Message Display**:
```
12:34:56 DW-1A2B > Hello, network.
12:35:12 DW-3C4D > Transmission received.
12:36:01 [SYSTEM] User DW-5E6F joined.
```

**Input**:
```
> ________________________________█
```

**Sidebar** (collapsible):
- Members list (UID + Nickname)
- Room info (created, key expiry if private)
- `[LEAVE_ROOM]` button

---

### `/nodes`
**Purpose**: Network contacts (friends/connections)  
**Title**: `[NETWORK_NODES]`

**Search Interface**:
```
> FIND --TARGET=DW-XXXX-XXXX
  OR: --TARGET=Nickname
```

**Node List**:
```
┌─────────────────────────────────────┐
│ ● DW-9Z8Y-7X6W • CipherQueen        │
│   Status: ONLINE                    │
│   [OPEN_DM] [REMOVE_NODE]           │
└─────────────────────────────────────┘
```

**Actions**:
- `[ADD_NODE]` → Search → Send request
- `[OPEN_DM]` → Redirect to `/dm/[uid]`
- Accept/decline incoming requests

---

### `/dm/[uid]`
**Purpose**: Direct encrypted messaging  
**Header**: `[ENCRYPTED MESSAGE CHANNEL] DW-XXXX-XXXX • Nickname`

**Layout**: Same as `/room/[id]` but 1-on-1

**Features**:
- End-to-end style encryption (transport layer)
- Same 30-day TTL as room messages
- 15-minute grace period for message deletion

---

### `/oracle`
**Purpose**: AI chatbot (Oracle 7.0)  
**Interface**: Terminal chat with AI persona

**Header**: `[ORACLE_7.0] QUERY_INTERFACE`

**AI Response Format**:
```
[OUTPUT_0xF0F]: PROCESSING_QUERY... COMPLETE

• SIGNAL: STABLE
• RISK: LOW
• DATA:
  ╔════════════════════════╗
  ║ Your answer here...    ║
  ╚════════════════════════╝

[END_TRANSMISSION]
```

**Limits**:
- 20 queries / hour
- Session expires after 1 hour of inactivity
- No conversation history saved to DB

---

### `/settings`
**Purpose**: User configuration  
**Style**: BIOS-like menu

**Options**:
```
╔═══════════════════════════════╗
║ SYSTEM_CONFIGURATION          ║
╠═══════════════════════════════╣
║ > Nickname: CipherQueen       ║
║ > Password: ************      ║
║ > Avatar: [PIXEL_ART]         ║
║ > Theme: CLASSIC_GREEN        ║
║ > System Audio: MUTED         ║
╚═══════════════════════════════╝
```

**Navigation**: Arrow keys, Enter to edit

---

### `/purge`
**Purpose**: Manual data deletion  
**Interface**: CLI command entry

**Flow**:
1. Type: `PURGE_DATA --CONFIRM`
2. Modal warning (DOS-style)
3. Re-enter password
4. Execution confirmation
5. Data wiped → Redirect to `/dashboard`

**Warning Text**:
```
[!] IRREVERSIBLE_DATA_DELETION
This will permanently delete all your:
• Messages sent/received
• Room memberships
• DM threads
• AI session logs
• Network node connections

RETAINED: UID + Password hash only
```

---

### `/legal/tos`
**Purpose**: Terms of Service  
**Format**: DOS-style plain text

**Content Sections**:
- Acceptable use policy
- Prohibited content
- Account termination rules
- Disclaimers

---

### `/legal/privacy`
**Purpose**: Privacy Policy  
**Format**: Retro-formatted plain text

**Content Sections**:
- What data is collected (minimal)
- What is NOT collected (IP, device, email exposure)
- Data retention (30 days)
- PURGE_DATA flow
- User rights (GDPR/CCPA)

---

## MOBILE RESPONSIVENESS (Web v1)

- All pages keyboard-navigable (desktop priority)
- Mobile: Responsive layouts, touch-friendly buttons
- Terminal aesthetic maintained (smaller fonts on mobile)
- Virtual keyboard support for CLI inputs
- No native app features (web-only for v1)




