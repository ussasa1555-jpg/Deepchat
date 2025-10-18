# UX FLOWS — STEP-BY-STEP USER INTERACTIONS

```
[USER_FLOWS] DEEPCHAT INTERACTION SEQUENCES
════════════════════════════════════════════════════════════
```

## FLOW A: REGISTRATION (Anonymous Email)

### Step 1: Email Entry `/auth/register`

**Interface**:
```
┌─────────────────────────────────────┐
│ [SYSTEM_REGISTRATION]               │
│                                     │
│ Enter email for verification:      │
│ > ___________________________       │
│                                     │
│ Note: Email will never be displayed │
│ after registration. Store your UID  │
│ securely for future logins.         │
└─────────────────────────────────────┘
```

**Validation**:
- Valid email format
- Not already registered (no error message shown for privacy)
- Rate limit: 3 attempts / hour

**Action**: `[TRANSMIT]` button or Enter key

---

### Step 2: Email Verification

**Email Sent**: 6-digit code to provided address

**Interface**:
```
┌─────────────────────────────────────┐
│ [VERIFICATION_CODE_SENT]            │
│                                     │
│ A 6-digit code has been transmitted │
│ to your email. Enter it below:      │
│                                     │
│ > _ _ _ _ _ _                       │
│                                     │
│ Code expires in: 14:37              │
│                                     │
│ [RESEND_CODE] [CHANGE_EMAIL]        │
└─────────────────────────────────────┘
```

**Validation**:
- 3 attempts maximum
- 15-minute expiry
- If failed: Return to Step 1

---

### Step 3: UID Generation

**Server Action**: Generate unique UID (DW-XXXX-XXXX format)

**Display**:
```
┌─────────────────────────────────────┐
│ [UID_ASSIGNED]                      │
│                                     │
│ Your unique identifier:             │
│                                     │
│     DW-1A2B-3C4D                    │
│                                     │
│ ⚠ CRITICAL: Store this securely.    │
│   You can use it to login instead   │
│   of your email address.            │
│                                     │
│ [I_HAVE_SAVED_IT] (required)        │
└─────────────────────────────────────┘
```

**Action**: Must click acknowledgment checkbox before proceeding

---

### Step 4: Profile Setup

**Interface**:
```
┌─────────────────────────────────────┐
│ [PROFILE_CONFIGURATION]             │
│                                     │
│ Nickname (3-16 chars):              │
│ > CipherQueen_____                  │
│                                     │
│ Password (min 12 chars):            │
│ > ************                      │
│                                     │
│ Confirm Password:                   │
│ > ************                      │
│                                     │
│ Avatar (optional):                  │
│ [PIXEL_ART] [ASCII_ART] [SKIP]      │
│                                     │
│ [COMPLETE_REGISTRATION]             │
└─────────────────────────────────────┘
```

**Validation**:
- Nickname: alphanumeric + underscore, unique check
- Password: min 12 chars, strength meter
- Passwords match

**Success**: `[REGISTRATION_COMPLETE]` → Auto-login → Redirect to `/dashboard`

---

### Post-Registration State

✓ Email hidden from all future UI/API responses  
✓ UID becomes primary identifier  
✓ Session token issued (12h TTL)  
✓ Welcome message on dashboard  

---

## FLOW B: LOGIN

### Entry Point: `/auth/login`

**Interface**:
```
┌─────────────────────────────────────┐
│ [AUTHENTICATION_REQUIRED]           │
│                                     │
│ Login method: [EMAIL] [UID]         │
│                                     │
│ Identifier:                         │
│ > _________________________         │
│                                     │
│ Password:                           │
│ > ************                      │
│                                     │
│ [AUTHENTICATE]                      │
│                                     │
│ [FORGOT_PASSWORD?]                  │
└─────────────────────────────────────┘
```

---

### Option 1: Email Login

**Input**: Email address (hidden characters)  
**Validation**: Format check only (no "email not found" message for security)

---

### Option 2: UID Login

**Input**: DW-XXXX-XXXX format  
**Auto-formatting**: Hyphens inserted automatically at positions 3, 8

---

### Validation States

**Loading**:
```
[AUTHENTICATING...]
████░░░░░░░░░░░░░░░░ 25%
Verifying credentials...
```

**Success**:
```
[ACCESS_GRANTED]
Session established. Redirecting...
```
→ Redirect to `/dashboard` after 1 second

**Failure**:
```
[ERROR_401] INVALID_CREDENTIALS
Attempts remaining: 4/5

[RETRY] [RESET_PASSWORD]
```

**Rate Limited**:
```
[ERROR_429] TOO_MANY_ATTEMPTS
Account locked for: 14:37 (MM:SS)

Security lockout in effect. Try again after countdown.
```

---

### Session Management

- **JWT issued**: 12-hour expiry
- **Refresh token**: Optional 7-day (user choice at login)
- **Auto-logout**: At 12h or manual via dashboard
- **No "Remember Me"**: Explicit session duration choice

---

## FLOW C: MANUAL PURGE_DATA

### Step 1: Navigate to `/purge`

**Interface**:
```
┌─────────────────────────────────────┐
│ [WARNING] IRREVERSIBLE_DATA_DELETION│
│                                     │
│ This command will permanently delete│
│ all your data except your UID and   │
│ password hash.                      │
│                                     │
│ Type the following command to       │
│ proceed:                            │
│                                     │
│ PURGE_DATA --CONFIRM                │
│                                     │
│ > _____________________________     │
│                                     │
│ [ESC] Return to Dashboard           │
└─────────────────────────────────────┘
```

---

### Step 2: Command Entry

**User Types**: `PURGE_DATA --CONFIRM`

**Validation**:
- Case-sensitive exact match required
- No auto-complete/suggestions

**Invalid Input Examples**:
```
> purge data --confirm
[SYNTAX_ERROR] COMMAND_NOT_RECOGNIZED
Expected: PURGE_DATA --CONFIRM (exact case)

> PURGE_DATA
[PARSE_ERROR] MISSING_FLAG: --CONFIRM
```

---

### Step 3: Confirmation Modal (DOS-style)

**Display**:
```
╔═══════════════════════════════════════╗
║ [!] FINAL WARNING                     ║
╠═══════════════════════════════════════╣
║                                       ║
║ This will DELETE:                     ║
║ • All messages sent/received          ║
║ • All room memberships                ║
║ • All DM threads                      ║
║ • All AI session logs                 ║
║ • Network node connections            ║
║                                       ║
║ RETAINED:                             ║
║ • Your UID: DW-1A2B-3C4D              ║
║ • Password hash (for re-login)        ║
║                                       ║
║ This action is IRREVERSIBLE.          ║
║                                       ║
║ Re-type your password to confirm:     ║
║ > _____________________________       ║
║                                       ║
║ [ESC] ABORT    [ENTER] EXECUTE        ║
╚═══════════════════════════════════════╝
```

**Focus**: Auto-focus on password input  
**Escape**: Returns to dashboard (purge cancelled)

---

### Step 4: Password Re-verification

**Server Validates**: Password hash matches

**If Incorrect**:
```
[ERROR_401] PASSWORD_VERIFICATION_FAILED
Purge operation cancelled.

[RETRY] [EXIT]
```

**If Correct**: Proceed to Step 5

---

### Step 5: Purge Execution

**Progress Display**:
```
[EXECUTING_PURGE...]
████████░░░░░░░░░░░░ 40%

Deleting messages...
Removing room memberships...
Wiping DM threads...
Clearing AI sessions...
Dissolving network nodes...

[PURGE_COMPLETE] — DATA_WIPED
```

**Server Actions**:
1. CASCADE DELETE all messages WHERE uid = current_user
2. DELETE FROM members WHERE uid = current_user
3. DELETE FROM dm_threads WHERE participant
4. DELETE FROM ai_sessions WHERE uid = current_user
5. DELETE FROM nodes WHERE owner_uid OR peer_uid = current_user
6. Log action in purge_logs (hashed UID only)

**Success Screen**:
```
┌─────────────────────────────────────┐
│ [PURGE_COMPLETE]                    │
│                                     │
│ All data has been wiped.            │
│ Your account shell remains active.  │
│                                     │
│ UID: DW-1A2B-3C4D                   │
│ Status: CLEAN_SLATE                 │
│                                     │
│ [RETURN_TO_DASHBOARD]               │
└─────────────────────────────────────┘
```

---

### Edge Cases

**Account Deletion vs Data Purge**:
- **PURGE_DATA**: Wipes content, keeps account (UID + password)
- **DELETE_ACCOUNT**: Full removal (separate flow, future feature)

**Concurrent Sessions**: Other active sessions logged out immediately post-purge

---

## FLOW D: PRIVATE ROOM JOIN

### Entry Point: `/rooms/private`

**Interface**:
```
┌─────────────────────────────────────┐
│ ┌─ DEEPCHAT v1.0 ─ PRIVATE ACCESS ┐ │
│ └──────────────────────────────────┘ │
│                                     │
│ [PRIVATE_CHANNEL_ACCESS]            │
│                                     │
│ Enter room key to establish         │
│ connection:                         │
│                                     │
│ > CONNECT --KEY=____-____-____█     │
│                                     │
│ ┌─ SECURITY NOTICE ──────────────┐  │
│ │ • Keys expire after 10 days    │  │
│ │ • 5 attempts per hour limit    │  │
│ │ • No keys stored locally       │  │
│ └────────────────────────────────┘  │
│                                     │
│ [ESC] Return to /rooms              │
└─────────────────────────────────────┘
```

---

### Step 1: Key Input

**User Types**: `CONNECT --KEY=A1B2-C3D4-E5F6`

**Input Masking**: `CONNECT --KEY=****-****-****` (as typed)

**Auto-formatting**:
- Hyphens auto-inserted at positions 4, 9
- Lowercase → uppercase conversion
- Max 14 characters (XXXX-XXXX-XXXX)

---

### Step 2: Validation States

**State A: Loading**
```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...]
████░░░░░░░░░░░░░░░░ 20%

Checking key format...
Querying room database...
Verifying access permissions...
```
*Duration: 1.5 seconds (artificial delay for security)*

---

**State B: Success**
```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...] ✓ COMPLETE
████████████████████ 100%

[ROOM_FOUND] "The Cipher Lounge"
[DECRYPTING_SESSION...]
[ACCESS_GRANTED]

>>> Redirecting to secure channel...
```

**Effects**:
- Brief CRT flicker (200ms)
- Green glow pulse around border
- Optional SFX: Modem handshake (if audio enabled)
- Redirect after 1 second → `/room/[id]`

---

**State C: Failure**
```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...] ✗ FAILED

[ERROR_403] INVALID_OR_EXPIRED_KEY
[CONNECTION_TERMINATED]

Possible causes:
• Key has expired (>10 days inactive)
• Incorrect key format
• Room no longer exists

Attempts remaining: 4/5

[ENTER] Retry  [ESC] Exit
```

**Effects**:
- Red flicker (brief)
- Error text in amber (#FF9900)
- Input field cleared for retry

---

**State D: Rate Limited**
```
[ERROR_429] TOO_MANY_ATTEMPTS

Rate limit exceeded.
Retry after: 04:37 (MM:SS)

Security lockout in effect.
```

**Countdown**: Live timer, updates every second  
**Input**: Disabled during lockout

---

### Security Measures

✓ Key never stored in browser localStorage  
✓ No URL parameter exposure (POST only)  
✓ No copy/paste functionality for key display  
✓ Rate limit: 5 attempts per UID per hour  
✓ Server-side validation only  
✓ Keys hashed in database (never plaintext)  

---

### Key Distribution (User Guidance)

**Recommended Channels**:
- End-to-end encrypted chat (Signal, Telegram secret chat)
- PGP-encrypted email
- In-person physical transfer
- Voice call (read aloud + verify checksum)

**NOT Recommended**:
- Regular email
- SMS
- Social media DMs
- Public forums

---

## FLOW E: START DM (Direct Message)

### Entry Point: `/nodes`

**Interface**:
```
┌─────────────────────────────────────┐
│ [NETWORK_NODES] SEARCH              │
│                                     │
│ Locate node by exact identifier:    │
│                                     │
│ > FIND --TARGET=_____________█      │
│                                     │
│ Accepted formats:                   │
│ • UID: DW-XXXX-XXXX                 │
│ • Nickname: exact_match             │
│                                     │
│ ┌─ YOUR NODES ──────────────────┐   │
│ │ ● DW-9Z8Y • CipherQueen       │   │
│ │   Status: ONLINE              │   │
│ │   [OPEN_DM] [REMOVE]          │   │
│ │                               │   │
│ │ ◦ DW-3C4D • PhantomKey        │   │
│ │   Status: OFFLINE (2h ago)    │   │
│ │   [OPEN_DM] [REMOVE]          │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

### Step 1: Search by UID or Nickname

**User Types**:
- `FIND --TARGET=DW-9Z8Y-7X6W` (UID search)
- `FIND --TARGET=CipherQueen` (nickname search)

**Validation**:
- Exact match only (no fuzzy search, no autocomplete)
- Case-insensitive for nicknames
- Format validation for UIDs

---

### Step 2: Search Results

**If Found**:
```
[SCANNING_NETWORK...]
████████████████████ 100%

[NODE_LOCATED]

UID: DW-9Z8Y-7X6W
NICKNAME: CipherQueen
STATUS: ONLINE
LAST_SEEN: Currently active

INITIATE_SECURE_CHANNEL? [Y/N]
```

**If Not Found**:
```
[SCANNING_NETWORK...]
████████████████████ 100%

[ERROR_404] NODE_NOT_FOUND

No user matches the identifier.
Verify exact spelling and format.

[RETRY_SEARCH]
```

---

### Step 3: Connection Request

**User Confirms**: Types `Y` or clicks `[YES]`

**Action**:
```
[TRANSMITTING_REQUEST...]

Connection request sent to DW-9Z8Y-7X6W

Status: PENDING
Expires: 72 hours

[VIEW_PENDING_REQUESTS]
```

**Server Action**: INSERT INTO nodes (owner_uid, peer_uid, status='pending')

---

### Step 4: Target User Receives Notification

**Notification Display** (on target's dashboard/nodes page):
```
┌─────────────────────────────────────┐
│ [INCOMING_CONNECTION_REQUEST]       │
│                                     │
│ From: DW-1A2B-3C4D • NewUser        │
│ Sent: 3 minutes ago                 │
│                                     │
│ [ACCEPT] [DECLINE] [BLOCK]          │
└─────────────────────────────────────┘
```

**Options**:
- **ACCEPT**: Creates DM thread, adds to both users' nodes
- **DECLINE**: Removes request, no notification to sender
- **BLOCK**: Prevents future requests from this UID

---

### Step 5: Acceptance Flow

**Target User Clicks `[ACCEPT]`**:

**Server Actions**:
1. UPDATE nodes SET status='accepted'
2. CREATE dm_thread
3. INSERT INTO dm_participants (both UIDs)

**Success Notification**:
```
[CONNECTION_ESTABLISHED]

DW-1A2B-3C4D • NewUser
Added to your network nodes.

[OPEN_DM]
```

---

### Step 6: DM Opened

**Redirect**: `/dm/[uid]` (uid = DW-1A2B-3C4D)

**Interface**:
```
┌─────────────────────────────────────┐
│ [ENCRYPTED MESSAGE CHANNEL]         │
│ DW-1A2B-3C4D • NewUser              │
├─────────────────────────────────────┤
│                                     │
│ [SYSTEM] Secure channel established.│
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ > ______________________________█   │
└─────────────────────────────────────┘
```

**First Message**: Ready to send

---

### Edge Cases

**Request Expires** (72 hours):
```
[REQUEST_EXPIRED]

Connection request to DW-9Z8Y-7X6W
has timed out.

[SEND_NEW_REQUEST] [CANCEL]
```

**User Blocked You**:
```
[ERROR_403] CONNECTION_REFUSED

Unable to establish secure channel.
Target may have blocked requests.
```
*Note: Doesn't explicitly say "blocked" for privacy*

**Already Connected**:
```
[ALREADY_CONNECTED]

This node is already in your network.

[OPEN_DM]
```

---

## FLOW F: CREATE PUBLIC ROOM

### Entry Point: `/rooms/public` → Click `[CREATE_NEW]`

**Modal Interface**:
```
┌─────────────────────────────────────┐
│ [CREATE_PUBLIC_ROOM]                │
│                                     │
│ Room Name:                          │
│ > The Cipher Lounge__________       │
│                                     │
│ Description (optional):             │
│ > A space for encrypted chat        │
│   enthusiasts...                    │
│                                     │
│ [CREATE] [CANCEL]                   │
└─────────────────────────────────────┘
```

**Validation**:
- Name: 3-50 characters
- Description: Max 200 characters
- Rate limit: 5 rooms/day per UID

**Success**:
```
[ROOM_CREATED]

Room ID: room_abc123
Name: The Cipher Lounge

Auto-joining as admin...
```
→ Redirect to `/room/[id]`

---

## FLOW G: AI ORACLE SESSION

### Entry Point: `/oracle`

**Interface**:
```
┌─────────────────────────────────────┐
│ [ORACLE_7.0] QUERY_INTERFACE        │
│                                     │
│ [SYSTEM] Ephemeral session initiated│
│ Session TTL: 1 hour                 │
│                                     │
│ > How does encryption work?_____█   │
└─────────────────────────────────────┘
```

**User Sends Query**: Types question + Enter

**AI Response**:
```
[OUTPUT_0xF0F]: PROCESSING_QUERY...
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%

• SIGNAL: STABLE
• RISK: LOW
• DATA:

  ╔═══════════════════════════════╗
  ║ Encryption transforms         ║
  ║ plaintext data into           ║
  ║ ciphertext via algorithmic    ║
  ║ transformation. Common        ║
  ║ methods include AES-256...    ║
  ╚═══════════════════════════════╝

[END_TRANSMISSION]
```

**Session Management**:
- Stored in Redis with 1h TTL
- No database writes
- Auto-purge after 1 hour inactivity
- Rate limit: 20 queries/hour per UID

---

## SUMMARY: KEY UX PRINCIPLES

✓ **Keyboard-First**: All flows navigable without mouse  
✓ **Immediate Feedback**: Loading states, success/error messages  
✓ **Privacy Defaults**: Email hidden, UID-first, no tracking  
✓ **Retro Aesthetics**: Terminal UI, monospace fonts, CLI commands  
✓ **Security Friction**: Multi-step confirmations for destructive actions  
✓ **No Dark Patterns**: Clear warnings, explicit consent, reversible where possible  




