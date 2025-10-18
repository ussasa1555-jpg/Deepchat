# ROOM KEY/PASSCODE CLI INTERFACE SPECIFICATION

```
[INTERFACE_SPEC] PRIVATE ROOM KEY ENTRY SYSTEM
════════════════════════════════════════════════════════════
```

## VISUAL DESIGN

### Layout Specification

**Full-Screen Terminal Simulation**

```
┌────────────────────────────────────────────────────────┐
│ ┌─ DEEPCHAT v1.0 ─ PRIVATE ACCESS ──────────────────┐  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ [PRIVATE_CHANNEL_ACCESS]                                │
│                                                         │
│ Enter room key to establish connection                  │
│                                                         │
│ > CONNECT --KEY=____-____-____█                         │
│                                                         │
│ ┌─ SECURITY NOTICE ───────────────────────────────┐    │
│ │ • Keys expire after 10 days of inactivity       │    │
│ │ • 5 attempts per hour limit                     │    │
│ │ • No keys stored locally                        │    │
│ │ • Keys never logged in client storage           │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ [ESC] Return to /rooms                                  │
└────────────────────────────────────────────────────────┘
```

### Color Scheme

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Pure Black | `#000000` | Canvas, panels |
| Primary Text | Neon Green | `#00FF00` | Prompts, input |
| System Messages | Cyan | `#00FFFF` | Status updates |
| Warnings | Amber | `#FF9900` | Errors, alerts |
| Borders | Dark Green | `#003300` | Panel outlines |

### Typography

- **Font Family**: `'Consolas', 'Courier New', 'Lucida Console', monospace`
- **Font Size**: 16px (desktop), 14px (mobile)
- **Line Height**: 1.6
- **Letter Spacing**: 0.5px (for clarity)

### Cursor Animation

**Blinking Block Cursor**: █

```css
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.cursor {
  display: inline-block;
  width: 10px;
  height: 20px;
  background: #00FF00;
  animation: blink 500ms infinite;
}
```

### Effects

1. **Scanline Overlay**:
   - Subtle CRT scanlines (opacity: 0.05)
   - Fixed position, full viewport
   - No pointer events

2. **Focus Glow**:
   - Input field: 2px solid cyan border on focus
   - Box-shadow: `0 0 10px rgba(0, 255, 255, 0.5)`

---

## COMMAND SYNTAX & VALIDATION

### Valid Format

```
CONNECT --KEY=XXXX-XXXX-XXXX
```

**Components**:
- **Command**: `CONNECT` (required, uppercase)
- **Flag**: `--KEY=` (required, case-sensitive)
- **Key Value**: 12 alphanumeric characters + 2 hyphens
  - Format: `XXXX-XXXX-XXXX`
  - Characters: `0-9A-Z` (uppercase only)
  - Total length: 14 characters

### Parsing Rules

| Rule | Description |
|------|-------------|
| Command prefix | Must start with `CONNECT --KEY=` |
| Key segments | Three 4-character blocks |
| Hyphens | Required at positions 5 and 10 |
| Case | Auto-convert to uppercase |
| Whitespace | Stripped automatically |

### Auto-Correction Features

**1. Lowercase Conversion**:
```
Input:  CONNECT --KEY=a1b2-c3d4-e5f6
Output: CONNECT --KEY=A1B2-C3D4-E5F6
```

**2. Auto-Hyphen Insertion**:
```
Input:  CONNECT --KEY=A1B2C3D4E5F6
Output: CONNECT --KEY=A1B2-C3D4-E5F6
```

**3. Whitespace Removal**:
```
Input:  CONNECT --KEY= A1B2 - C3D4 - E5F6
Output: CONNECT --KEY=A1B2-C3D4-E5F6
```

---

## ERROR MESSAGES & VALIDATION STATES

### Client-Side Validation Errors

#### 1. Empty Input
```
> 
[INPUT_REQUIRED] COMMAND_NOT_RECOGNIZED
Expected: CONNECT --KEY=XXXX-XXXX-XXXX
```

#### 2. Invalid Syntax
```
> connect --key=abc
[SYNTAX_ERROR] KEY_FORMAT_INVALID
Expected: XXXX-XXXX-XXXX (12 chars + hyphens)
```

#### 3. Key Too Short
```
> CONNECT --KEY=ABC
[PARSE_ERROR] KEY_LENGTH_INVALID
Expected 12 characters, received 3
```

#### 4. Key Too Long
```
> CONNECT --KEY=TOOLONGKEYSTRING
[PARSE_ERROR] KEY_LENGTH_EXCEEDS_LIMIT
Maximum 14 characters (including hyphens)
```

#### 5. Unknown Flag
```
> CONNECT --PASSWORD=ABC123
[COMMAND_ERROR] UNKNOWN_FLAG: --PASSWORD
Did you mean: --KEY ?
```

#### 6. Special Characters
```
> CONNECT --KEY=A!B@-C#D$-E%F^
[PARSE_ERROR] INVALID_CHARACTERS
Key must contain only alphanumeric (0-9, A-Z)
```

#### 7. Missing Command
```
> --KEY=A1B2-C3D4-E5F6
[SYNTAX_ERROR] MISSING_COMMAND
Expected: CONNECT --KEY=...
```

### Server-Side Validation States

#### State 1: Validating

**Duration**: 1.5 seconds (artificial delay for security theater)

```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...]
████░░░░░░░░░░░░░░░░ 20%

Checking key format...
```

**Animation**: 
- Progress bar fills from 0% → 100%
- Status text changes:
  - 0-33%: "Checking key format..."
  - 34-66%: "Querying room database..."
  - 67-100%: "Verifying access permissions..."

---

#### State 2A: Success — Key Valid

```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...] ✓ COMPLETE
████████████████████ 100%

[ROOM_FOUND] "The Cipher Lounge"
Created: 2025-10-01 • Members: 42
[DECRYPTING_SESSION...]
[ACCESS_GRANTED]

>>> Redirecting to secure channel...
```

**Visual Effects**:
- **CRT Flicker**: 200ms flash (green tint)
- **Border Glow**: Pulsing green border (0-20px blur, 500ms)
- **Optional SFX**: Modem handshake (if audio enabled)

**Timing**:
- Display success message: 1 second
- Redirect to `/room/[id]`: After message

---

#### State 2B: Failure — Invalid Key

```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...] ✗ FAILED

[ERROR_403] INVALID_OR_EXPIRED_KEY
[CONNECTION_TERMINATED]

Possible causes:
• Key has expired (>10 days inactive)
• Incorrect key format
• Room has been deleted
• Access revoked by admin

Attempts remaining: 4/5

[ENTER] Retry  [ESC] Exit
```

**Visual Effects**:
- **Red Flicker**: Brief flash (amber/red tint)
- **Error Text**: Displayed in #FF9900 (amber)
- **Input Clear**: Field reset to `> CONNECT --KEY=____-____-____`

**Attempt Counter**:
- Decrements on each failure
- Stored client-side (session storage)
- Reset after successful entry OR 1 hour

---

#### State 2C: Rate Limited

```
[ERROR_429] TOO_MANY_ATTEMPTS

Rate limit exceeded.
Retry after: 04:37 (MM:SS)

Security lockout in effect.
Your UID has been temporarily restricted.

[RETURN_TO_DASHBOARD]
```

**Countdown Timer**:
- Updates every second
- Format: MM:SS (zero-padded)
- Client-side countdown synced with server timestamp
- Input field disabled during lockout

**Server-Side**:
- Redis key: `rate_limit:private_room:${uid}`
- TTL: 5 minutes (300 seconds)
- Counter: Increments on each failed attempt
- Threshold: 5 attempts

---

#### State 2D: Expired Key

```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...] ✗ FAILED

[ERROR_410] KEY_EXPIRED

This room key has expired due to
inactivity (last active: 12 days ago).

Contact the room administrator for
a refreshed access credential.

[RETURN_TO_ROOMS]
```

---

#### State 2E: Room Deleted

```
> CONNECT --KEY=****-****-****

[VALIDATING_KEY...] ✗ FAILED

[ERROR_404] ROOM_NOT_FOUND

The target room no longer exists.
It may have been deleted by the creator
or auto-purged due to inactivity.

[RETURN_TO_ROOMS]
```

---

## ANTI-PHISHING MEASURES

### Design Principles

**CRITICAL**: Keys NEVER become clickable links or shareable URLs

### ✓ Secure Implementations

| Feature | Implementation | Reason |
|---------|----------------|--------|
| **No URL parameters** | Keys never in query strings | Prevents URL-based phishing |
| **No deeplinks** | No `deepchat://join/KEY` | Prevents app-hijacking |
| **No QR codes** | No QR generation for keys | Prevents social engineering |
| **CLI input only** | Manual typing required | Forces deliberate action |
| **No clipboard paste** | Paste disabled in key field | Prevents malware injection |
| **POST-only submission** | No GET requests with keys | Prevents browser history leaks |

### ✗ Prohibited Features

**1. Click-to-Join Buttons**:
```
❌ [Join Room: A1B2-C3D4-E5F6]  // NO
✓  > CONNECT --KEY=____-____-____ // YES
```

**2. Shareable Invite URLs**:
```
❌ https://deepchat.app/join?key=A1B2-C3D4-E5F6
✓  Keys shared via encrypted external channels
```

**3. Auto-fill from Clipboard**:
```
❌ Detect key in clipboard → auto-populate
✓  Manual typing only
```

**4. Email/SMS Auto-Linking**:
```
❌ Click this link to join: [deepchat://...]
✓  Copy the key and enter it manually
```

### Security Rationale

**Why This Friction is Intentional**:

1. **Prevents Phishing**: Malicious actors can't create fake "join" links
2. **Forces Verification**: Users must obtain key from trusted source
3. **No Browser History**: Keys never stored in URL history
4. **No Link Sharing**: Can't accidentally share in insecure channels
5. **Deliberate Action**: Typing key = conscious decision to join

### Recommended Key Distribution (User Guidance)

**Secure Channels**:
- ✓ End-to-end encrypted chat (Signal, WhatsApp, Telegram secret)
- ✓ PGP-encrypted email
- ✓ Password manager shared vault
- ✓ In-person physical transfer
- ✓ Voice call + checksum verification

**Insecure Channels** (Warn Users):
- ✗ Regular email (plaintext)
- ✗ SMS (carrier access)
- ✗ Public social media
- ✗ Discord/Slack (non-E2EE)
- ✗ Shared documents (Google Docs, etc.)

---

## INPUT MASKING & PRIVACY

### Display Behavior

**As User Types**:
```
Keystroke 1: > CONNECT --KEY=A___-____-____
Keystroke 2: > CONNECT --KEY=A1__-____-____
Keystroke 3: > CONNECT --KEY=A1B_-____-____
Keystroke 4: > CONNECT --KEY=A1B2-____-____
```

**After Enter (Pre-Submit)**:
```
> CONNECT --KEY=****-****-****
```

**Rationale**: Prevents shoulder surfing while allowing user to verify input

### Masking Rules

| State | Display | Rationale |
|-------|---------|-----------|
| Typing | Last char visible for 500ms | User feedback |
| After char typed | Mask with `*` | Shoulder surfing protection |
| On submit | Full mask `****-****-****` | Privacy in screenshots |
| In logs | Never logged | Security |

### Dev Tools Protection

**Production Build**:
- Input field has `autocomplete="off"`
- No value stored in DOM attributes
- React state only (no `value` attribute in HTML)
- onPaste event blocked

---

## KEYBOARD INTERACTIONS

| Key | Action |
|-----|--------|
| `A-Z`, `0-9` | Type character (auto-uppercase) |
| `Backspace` | Delete last character |
| `Enter` | Submit command |
| `Escape` | Clear input / Return to `/rooms` |
| `Tab` | No action (prevent blur) |
| `Ctrl+V` | Blocked (no paste) |
| `Ctrl+C` | Blocked (no copy of masked value) |

---

## ACCESSIBILITY

### Screen Reader Support

**ARIA Labels**:
```html
<input
  type="text"
  aria-label="Private room key input. Format: CONNECT --KEY=XXXX-XXXX-XXXX"
  aria-describedby="key-format-hint"
  role="textbox"
/>

<div id="key-format-hint" class="sr-only">
  Enter your 12-character room key with hyphens.
  Keys expire after 10 days of inactivity.
</div>
```

**Live Region for Errors**:
```html
<div aria-live="assertive" aria-atomic="true" role="alert">
  {validationError}
</div>
```

### Keyboard Navigation

- Auto-focus on input field on page load
- ESC returns to previous page
- No tab-traps (ESC always works)

### High Contrast Mode

- Ensure text/background ratio ≥ 7:1 (AAA)
- Error messages in amber (#FF9900) have sufficient contrast
- Focus indicators always visible (2px cyan border)

---

## PERFORMANCE CONSIDERATIONS

### Client-Side Validation

**Instant Feedback** (no server call):
- Format validation
- Character count
- Syntax checking

**Timing**: < 50ms response to keystrokes

### Server-Side Validation

**1.5-Second Delay**:
- **Purpose**: Security theater (prevents brute-force feeling instant)
- **Implementation**: Artificial delay even if DB query returns faster
- **UX**: Progress bar gives feedback during wait

### Rate Limiting Strategy

**Redis Implementation**:
```javascript
// Sliding window counter
key: `rate_limit:private_room:${uid}`
expiry: 3600 seconds (1 hour)

On attempt:
  current = INCR key
  if current == 1: EXPIRE key 3600
  if current > 5: RETURN error 429
  else: PROCEED
```

---

## LOGGING & SECURITY

### What is Logged (Server-Side)

| Event | Data Logged | Retention |
|-------|-------------|-----------|
| Key attempt | Hashed key + UID + timestamp | 30 days |
| Success | Room ID + UID + timestamp | 30 days |
| Failure | Failure reason code + UID | 30 days |
| Rate limit hit | UID + timestamp | 7 days |

### What is NOT Logged

- ✗ Plaintext keys
- ✗ IP addresses (ephemeral only, in Redis for rate limit)
- ✗ User agent strings
- ✗ Browser fingerprints

### Security Audit Trail

**Minimal Event Log Example**:
```json
{
  "event": "private_room_attempt",
  "uid": "DW-1A2B-3C4D",
  "key_hash": "sha256:a1b2c3d4...",
  "result": "success",
  "room_id": "room_abc123",
  "timestamp": "2025-10-14T12:34:56Z"
}
```

**Purpose**: Abuse detection, not user surveillance

---

## OPTIONAL SOUND EFFECTS

### Modem Handshake SFX

**Trigger**: Successful key validation → access granted

**Audio**:
- Classic dial-up modem sound
- Duration: 2-3 seconds
- Volume: 30% (adjustable in settings)
- Format: MP3/OGG (cross-browser)

**Control**:
- Muted by default
- Toggle in `/settings` → "System Audio"
- Respects system `prefers-reduced-motion`

### Keypress Ticks

**Trigger**: Each character typed

**Audio**:
- Mechanical keyboard click
- Duration: 50ms
- Volume: 20%

**Control**: Same as above

---

## COMPONENT IMPLEMENTATION SPEC

### React Component Structure

```typescript
interface PrivateRoomKeyProps {
  onSuccess: (roomId: string) => void;
  onCancel: () => void;
}

interface KeyValidationState {
  status: 'idle' | 'validating' | 'success' | 'error' | 'rate_limited';
  message?: string;
  remainingAttempts?: number;
  retryAfter?: number; // seconds
}
```

### State Machine

```
IDLE → (user types) → TYPING
TYPING → (press Enter) → VALIDATING
VALIDATING → (server response) → SUCCESS | ERROR | RATE_LIMITED
ERROR → (retry) → IDLE
RATE_LIMITED → (countdown ends) → IDLE
SUCCESS → (redirect) → (exit component)
```

### API Endpoint

**POST** `/api/rooms/verify-key`

**Request**:
```json
{
  "command": "CONNECT",
  "key": "A1B2C3D4E5F6" // hyphens stripped, uppercase
}
```

**Response (Success)**:
```json
{
  "success": true,
  "room": {
    "id": "room_abc123",
    "name": "The Cipher Lounge",
    "members_count": 42,
    "created_at": "2025-10-01T10:00:00Z"
  }
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_KEY",
    "message": "Key not found or expired",
    "remaining_attempts": 4
  }
}
```

**Response (Rate Limited)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many attempts",
    "retry_after": 277 // seconds
  }
}
```

---

## TESTING CHECKLIST

### Functional Tests

- [ ] Valid key → success redirect
- [ ] Invalid key → error message
- [ ] Expired key → specific error
- [ ] Deleted room → 404 error
- [ ] 5 failed attempts → rate limit
- [ ] Rate limit countdown → re-enables after timeout
- [ ] ESC key → returns to `/rooms`
- [ ] Auto-uppercase conversion works
- [ ] Auto-hyphen insertion works
- [ ] Paste blocked

### Security Tests

- [ ] Keys never in URL
- [ ] Keys never in browser history
- [ ] Keys never in localStorage
- [ ] Server logs hashed keys only
- [ ] Rate limiting enforced server-side
- [ ] No timing attacks (constant-time validation)

### Accessibility Tests

- [ ] Screen reader announces errors
- [ ] Keyboard-only navigation works
- [ ] Focus visible at all times
- [ ] High contrast mode readable
- [ ] Error messages have `role="alert"`

### Performance Tests

- [ ] Client validation < 50ms
- [ ] Server response < 2s
- [ ] Rate limit check < 100ms (Redis)
- [ ] No UI freezes during validation

---

## FUTURE ENHANCEMENTS (Post-v1)

- **Key Strength Indicator**: Visual feedback on key entropy
- **Checksum Verification**: Optional last-digit checksum for manual verification
- **Multi-Factor**: Optional 2FA for high-security rooms
- **Key Rotation**: Auto-generate new keys every N days (admin feature)
- **Temporary Keys**: Single-use keys that expire after first join




