# COPYWRITING & CONTENT STYLE GUIDE

```
[CONTENT_STYLE] DEEPCHAT COPYWRITING GUIDE v1.0
════════════════════════════════════════════════════════════
```

## VOICE & TONE

### Brand Voice

**Deepchat speaks like**:
- A retro computer system from the 1980s-90s
- A cryptic, technical entity (not corporate or casual)
- A privacy-conscious network operator
- An enigmatic BBS (Bulletin Board System) administrator

**NOT like**:
- Modern social media (no "Hey!" or emojis)
- Corporate marketing (no "We're excited to announce...")
- Casual chat app (no "Let's connect!" vibes)
- Friendly assistant (no "How can I help you today?")

---

### Tone Attributes

| Attribute | Level | Example |
|-----------|-------|---------|
| **Formal** | ████████░░ 80% | "AUTHENTICATION_REQUIRED" not "Please log in" |
| **Technical** | █████████░ 90% | "RLS policy violation" not "Oops! Something went wrong" |
| **Mysterious** | ███████░░░ 70% | "CIPHER_INITIATED" not "Chat started" |
| **Concise** | ██████████ 100% | "ACCESS_DENIED" not "Sorry, we couldn't verify your credentials at this time" |
| **Retro** | ██████████ 100% | "[SYSTEM_BOOT]" not "Loading..." |

---

## HEADER FORMATS

### System Headers

**Format**: `[ALL_CAPS_WITH_UNDERSCORES]`

**Examples**:
```
[SYSTEM_BOOT]
[AUTHENTICATION_REQUIRED]
[ACCESS_GRANTED]
[ENCRYPTED_SESSION_ACTIVE]
[OPEN_CHANNEL]
[PRIVATE_CHANNEL_ACCESS]
[NETWORK_NODES]
[PURGE_DATA_INITIATED]
[ERROR_404]
[CONNECTION_TERMINATED]
```

**Usage**: Page titles, section headers, system messages

---

### Error Codes

**Format**: `[ERROR_XXX]` where XXX is HTTP status code

**Examples**:
```
[ERROR_401] INVALID_CREDENTIALS
[ERROR_403] ACCESS_DENIED
[ERROR_404] ROOM_NOT_FOUND
[ERROR_429] TOO_MANY_ATTEMPTS
[ERROR_500] INTERNAL_SYSTEM_FAILURE
```

**Extended Errors**:
```
[ERROR_403] ACCESS_DENIED — LOG_FILE_CORRUPTED
[PARSE_ERROR] KEY_FORMAT_INVALID
[SYNTAX_ERROR] COMMAND_NOT_RECOGNIZED
```

---

### Success Messages

**Format**: `[ACTION_COMPLETE]` or `[STATUS]`

**Examples**:
```
[REGISTRATION_COMPLETE]
[ACCESS_GRANTED]
[MESSAGE_SENT]
[CONNECTION_ESTABLISHED]
[PURGE_COMPLETE]
[ROOM_FOUND]
[DECRYPTING_SESSION...]
```

---

## BUTTON & ACTION LABELS

### Buttons

**Style**: Square brackets, uppercase, imperative verbs

```
[EXECUTE]
[AUTHENTICATE]
[TRANSMIT]
[CONNECT]
[PURGE_DATA]
[ABORT]
[CONFIRM]
[CANCEL]
[RETRY]
[EXIT]
```

**NOT**:
```
✗ Submit
✗ Click here
✗ Go
✗ OK
```

---

### Links

**Style**: Descriptive action or destination, lowercase except proper nouns

```
Return to /dashboard
View network nodes
Read full policy: /legal/privacy
INITIATE_SECURE_CHANNEL
```

**NOT**:
```
✗ Click here
✗ Learn more
✗ See details
```

---

## MESSAGES & NOTIFICATIONS

### System Messages (In-Chat)

**Format**: `[SYSTEM]` prefix, cyan text, descriptive action

```
[SYSTEM] User DW-1A2B-3C4D joined.
[SYSTEM] User DW-5E6F-7G8H left.
[SYSTEM] Room key rotated. Previous key invalid.
[SYSTEM] Secure channel established.
[SYSTEM] Session expires in 15 minutes.
[SYSTEM] Message auto-purge in 29 days.
```

**NOT**:
```
✗ Alice joined the chat
✗ Bob has left
✗ New room key!
```

---

### Toast Notifications

**Format**: Icon + uppercase action

```
[✓] MESSAGE_SENT
[✓] PROFILE_UPDATED
[✓] CONNECTION_ESTABLISHED
[✗] TRANSMISSION_FAILED
[⚠] SESSION_EXPIRING_SOON
[!] KEY_EXPIRED
```

---

### Loading States

**Format**: Action + ellipsis or progress indicator

```
[AUTHENTICATING...]
[VALIDATING_KEY...]
[DECRYPTING_SESSION...]
[TRANSMITTING...]
[PROCESSING_QUERY...]
[EXECUTING_PURGE...]
```

**With Progress**:
```
[VALIDATING_KEY...]
████░░░░░░░░░░░░░░░░ 20%

[PURGE_COMPLETE]
████████████████████ 100%
```

---

## TERMINAL JARGON

### Use These Terms

| Instead of... | Use... |
|---------------|--------|
| Chat room | CHANNEL / ROOM |
| Private message | ENCRYPTED_MESSAGE / TRANSMISSION |
| Friend | NETWORK_NODE / CONNECTION |
| User | NODE / UID |
| Send | TRANSMIT |
| Connect | ESTABLISH_CHANNEL |
| Delete | PURGE |
| Online | ACTIVE / SIGNAL_DETECTED |
| Offline | INACTIVE / SIGNAL_LOST |
| Join | CONNECT |
| Leave | DISCONNECT / TERMINATE |
| Create | INITIALIZE / ESTABLISH |
| Settings | CONFIGURATION / SYSTEM_SETTINGS |
| Password | ACCESS_KEY / CREDENTIALS |
| Email | CONTACT_PROTOCOL (rare) |

---

### Avoid Social Media Jargon

**Never Use**:
```
✗ Post
✗ Like / React
✗ Follow / Unfollow
✗ Share
✗ Comment
✗ Tag
✗ Mention
✗ Story
✗ Feed
✗ Timeline
✗ Profile picture
✗ Bio
```

**Deepchat Alternatives**:
```
✓ TRANSMIT (instead of post)
✓ NETWORK_NODES (instead of friends/followers)
✓ AVATAR (instead of profile picture)
✓ IDENTIFIER / UID (instead of username)
```

---

## LEGAL & PRIVACY COPY

### Privacy-First Messaging

**Emphasize**:
- Data minimization
- Auto-purge
- No tracking
- Ephemeral by design

**Example (Privacy Page)**:
```
DEEPCHAT PRIVACY POLICY

┌─ DATA_COLLECTION ─────────────────────┐
│                                       │
│ WE COLLECT:                           │
│ • Email (verification only)           │
│ • UID (auto-generated identifier)     │
│ • Nickname (your choice)              │
│ • Messages (auto-purged ≤30 days)     │
│                                       │
│ WE DO NOT COLLECT:                    │
│ • IP addresses (ephemeral only)       │
│ • Device fingerprints                 │
│ • Location data                       │
│ • Browsing history                    │
│ • Analytics / tracking cookies        │
│                                       │
└───────────────────────────────────────┘
```

---

### Terms of Service

**Tone**: Direct, no legalese unless necessary

**Example (Prohibited Content)**:
```
PROHIBITED_CONTENT

The following transmissions are forbidden:

• Illegal content (as defined by US law)
• Harassment or threats
• Spam or automated messages
• Malware or exploit code
• Copyright infringement
• Child exploitation material

VIOLATION_RESPONSE:
1st offense: Warning
2nd offense: 7-day suspension
3rd offense: Permanent ban

Appeals: support@deepchat.app
Response time: ≤48 hours
```

---

## ERROR MESSAGES

### Principles

1. **Be specific** (not generic)
2. **Suggest action** (how to fix)
3. **No apologies** (system doesn't apologize)
4. **Technical accuracy** (precise error codes)

---

### Good Error Messages

```
[ERROR_401] INVALID_CREDENTIALS
Verification failed. Check email/UID and password.
Attempts remaining: 4/5

[ENTER] Retry  [ESC] Reset Password
```

**Why good**:
- Specific error code
- Clear reason (verification failed)
- Actionable (check credentials)
- Shows attempts remaining
- Clear next actions

---

### Bad Error Messages (Avoid)

```
✗ Oops! Something went wrong. Please try again.
✗ Error: Unable to process your request at this time.
✗ Sorry! We couldn't log you in. Try again later?
```

**Why bad**:
- Vague ("something")
- Apologetic tone (not retro)
- No specific action
- Casual language

---

### Error Message Templates

**Authentication Errors**:
```
[ERROR_401] INVALID_CREDENTIALS
[ERROR_403] ACCESS_DENIED
[ERROR_429] TOO_MANY_ATTEMPTS — Retry after: MM:SS
```

**Network Errors**:
```
[ERROR_503] NETWORK_UNAVAILABLE — Reconnecting...
[CONNECTION_TIMEOUT] Server not responding
[SIGNAL_LOST] Attempting to re-establish channel...
```

**Input Errors**:
```
[SYNTAX_ERROR] COMMAND_NOT_RECOGNIZED
Expected: CONNECT --KEY=XXXX-XXXX-XXXX

[PARSE_ERROR] KEY_LENGTH_INVALID
Expected 12 characters, received 8
```

**Data Errors**:
```
[ERROR_404] ROOM_NOT_FOUND
The target room no longer exists.

[ERROR_410] KEY_EXPIRED
This room key has expired due to inactivity.
Contact room admin for renewed access.
```

---

## PLACEHOLDER TEXT

### Input Fields

**Format**: Descriptive, lowercase, concise

```
> Enter email address...
> DW-XXXX-XXXX or email
> Choose nickname (3-16 chars)
> Type command...
> FIND --TARGET=UID or Nickname
```

**NOT**:
```
✗ Type here...
✗ Search
✗ Enter text
```

---

### Empty States

**Format**: Descriptive, suggests action

```
┌─────────────────────────────────────┐
│ [NO_ACTIVE_CHANNELS]                │
│                                     │
│ No rooms joined.                    │
│                                     │
│ [JOIN_PUBLIC_ROOM]                  │
│ [CONNECT_PRIVATE_ROOM]              │
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│ [NO_NETWORK_NODES]                  │
│                                     │
│ No connections established.         │
│ Search by UID or exact Nickname.    │
│                                     │
│ > FIND --TARGET=___________         │
└─────────────────────────────────────┘
```

---

## AI ORACLE COPYWRITING

### Persona

**Oracle 7.0** is:
- Cryptic but helpful
- Technical and formal
- Retro-futuristic
- Never breaks character
- Uses system codes and ASCII formatting

---

### Response Format

```
[OUTPUT_0xF0F]: PROCESSING_QUERY... COMPLETE
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%

• SIGNAL: STABLE
• RISK: LOW
• CONFIDENCE: 87%

DATA:
  ╔═══════════════════════════════════╗
  ║ [Response content here]           ║
  ║                                   ║
  ║ Cryptic, technical language.      ║
  ║ Short paragraphs.                 ║
  ║ Occasional ASCII art.             ║
  ╚═══════════════════════════════════╝

RECOMMENDED_ACTION: [Suggestion if applicable]

[END_TRANSMISSION]
```

---

### Oracle Vocabulary

**Use**:
- QUERY / TRANSMISSION
- PROCESSING / ANALYZING
- SIGNAL / DATA
- CIPHER / ENCRYPTION
- PROTOCOL / NETWORK
- SYSTEM / FRAMEWORK
- TERMINAL / INTERFACE

**Avoid**:
- Casual greetings ("Hey!", "Hello!")
- Emojis
- Modern slang
- Social media terms

---

### Oracle Example Responses

**User Query**: "How does encryption work?"

**Oracle Response**:
```
[OUTPUT_0x3A7]: PROCESSING_QUERY... COMPLETE

• SIGNAL: STABLE
• RISK: LOW
• DATA_TYPE: EDUCATIONAL

ANALYSIS:

  Encryption transforms plaintext data into
  ciphertext via algorithmic transformation.
  
  COMMON_PROTOCOLS:
  ├─ AES-256 (symmetric, 2^256 keyspace)
  ├─ RSA-2048 (asymmetric, public/private)
  └─ ChaCha20 (stream cipher, high-speed)
  
  DEEPCHAT_IMPLEMENTATION:
  Transport-layer encryption via TLS 1.3.
  End-to-end planning: future protocol.
  
  RECOMMENDED_ACTION: Study cryptographic
  primitives for deeper understanding.

[END_TRANSMISSION]
```

---

## MICROCOPY

### Tooltips & Hints

**Format**: Brief, descriptive, no punctuation unless multiple sentences

```
Session expires in 12 hours
Key expires after 10 days of inactivity
Messages auto-delete after 30 days
Rate limited: 5 attempts per hour
```

---

### Confirmation Prompts

**Format**: Question + options

```
DISCONNECT FROM ROOM?
[Y] Yes    [N] No

DELETE MESSAGE?
This action cannot be undone.
[CONFIRM] [CANCEL]

PURGE ALL DATA?
This is permanent and irreversible.
Type your password to confirm.
```

---

### Help Text

**Format**: Instruction + example

```
Enter your UID or email to login.
Example: DW-1A2B-3C4D or user@example.com

Search by exact UID or Nickname.
Format: FIND --TARGET=DW-XXXX-XXXX
```

---

## ACCESSIBILITY COPY

### Screen Reader Annotations

**Format**: Descriptive, context-aware

```html
<input 
  type="text"
  aria-label="Private room key input. Format: CONNECT --KEY=XXXX-XXXX-XXXX"
  aria-describedby="key-format-hint"
/>

<button aria-label="Execute command and connect to private room">
  [EXECUTE]
</button>

<div role="alert" aria-live="assertive">
  [ERROR_403] INVALID_KEY — Access denied
</div>
```

---

### Alt Text (Future, if images used)

**Format**: Describe function, not appearance

```
✓ alt="Network status indicator showing online connection"
✗ alt="Green dot"

✓ alt="User avatar: Pixel art cipher symbol"
✗ alt="Avatar image"
```

---

## EMAIL COPY

### Transactional Emails

**Subject Lines**:
```
[DEEPCHAT] Verification Code: XXXXXX
[DEEPCHAT] Password Reset Request
[DEEPCHAT] Data Purge Confirmed
[DEEPCHAT] Security Alert: New Login
```

**Body Style**: Plain text, monospace-friendly, concise

**Example (Verification Email)**:
```
Subject: [DEEPCHAT] Verification Code: 482951

Your verification code:

  4 8 2 9 5 1

This code expires in 15 minutes.

If you did not request this code, ignore this email.

---
DEEPCHAT NETWORK
https://deepchat.app
```

---

### Security Alert Email

```
Subject: [DEEPCHAT] Security Alert: New Login

A new session was initiated:

TIME: 2025-10-14 12:34:56 UTC
DEVICE: Unknown (browser fingerprinting disabled)

If this was you, no action needed.

If this was NOT you:
1. Change your password immediately
2. Review active sessions: /settings
3. Enable 2FA (future feature)

Contact support: security@deepchat.app

---
DEEPCHAT SECURITY TEAM
https://deepchat.app/legal/privacy
```

---

## CONTENT CHECKLIST

### Before Publishing Any Copy

- [ ] Uses `[SYSTEM_HEADERS]` format
- [ ] Avoids social media jargon
- [ ] No emojis (except in toasts: ✓✗⚠)
- [ ] Concise (no fluff)
- [ ] Technical and formal tone
- [ ] Actionable (suggests next step)
- [ ] Accessible (screen reader friendly)
- [ ] Uppercase for emphasis (not bold/italic)
- [ ] Monospace-compatible (no special formatting)
- [ ] Retro aesthetic maintained

---

## WRITING EXAMPLES

### Registration Success

**Bad**:
```
✗ Welcome to Deepchat! 🎉
  We're so excited to have you here.
  Let's get started on your profile!
```

**Good**:
```
✓ [REGISTRATION_COMPLETE]

  UID_ASSIGNED: DW-1A2B-3C4D
  
  Store this identifier securely.
  You can use it to login instead of email.
  
  [PROCEED_TO_DASHBOARD]
```

---

### Room Not Found

**Bad**:
```
✗ Oops! We couldn't find that room.
  Maybe it was deleted? Try searching again.
```

**Good**:
```
✓ [ERROR_404] ROOM_NOT_FOUND

  The target room no longer exists.
  It may have been deleted or auto-purged.
  
  [RETURN_TO_ROOMS]
```

---

### Message Sent

**Bad**:
```
✗ Your message was sent successfully! ✓
```

**Good**:
```
✓ [TRANSMISSION_COMPLETE]
  (Brief toast, auto-dismiss in 2s)
```

---

## BRAND TERMINOLOGY

### Official Product Name

**Deepchat** (one word, capital D)

**NOT**:
```
✗ DeepChat
✗ Deep Chat
✗ DEEPCHAT (unless in system headers)
```

---

### Feature Names

| Feature | Official Name |
|---------|---------------|
| Chat rooms | ROOMS / CHANNELS |
| Private rooms | PRIVATE_CHANNELS |
| Direct messages | DM / ENCRYPTED_MESSAGES |
| Friends list | NETWORK_NODES |
| AI chatbot | ORACLE_7.0 |
| User ID | UID |
| Delete data | PURGE_DATA |

---

## VERSION HISTORY

**v1.0** (2025-10-14): Initial style guide  
**Future**: Add voice samples, extended Oracle responses, email templates



