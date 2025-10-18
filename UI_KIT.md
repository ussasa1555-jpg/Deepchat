# UI KIT — RETRO DESIGN SYSTEM

```
[DESIGN_SYSTEM] DEEPCHAT RETRO UI KIT v1.0
════════════════════════════════════════════════════════════
```

## COLOR PALETTE

### Primary Colors

| Color Name | Hex | RGB | Usage | Preview |
|------------|-----|-----|-------|---------|
| Pure Black | `#000000` | `0, 0, 0` | Canvas, panels, backgrounds | ███ |
| Neon Green | `#00FF00` | `0, 255, 0` | Primary text, success, active states | ███ |
| Cyan | `#00FFFF` | `0, 255, 255` | Links, system messages | ███ |
| Magenta | `#FF00FF` | `255, 0, 255` | Highlights, badges, special emphasis | ███ |
| Amber | `#FF9900` | `255, 153, 0` | Warnings, errors, critical alerts | ███ |

### Secondary Colors

| Color Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| Dark Green | `#003300` | `0, 51, 0` | Hover states, borders, inactive |
| Dark Cyan | `#001a1a` | `0, 26, 26` | Secondary panels, card backgrounds |
| Dark Magenta | `#330033` | `51, 0, 51` | Subtle accents, badges |
| Deep Black | `#0a0a0a` | `10, 10, 10` | Layered panels (depth) |

### Grayscale (Limited Use)

| Color Name | Hex | Usage |
|------------|-----|-------|
| Charcoal | `#333333` | Disabled states |
| Gray | `#666666` | Muted text, timestamps |
| Light Gray | `#999999` | Placeholders, hints |
| Near White | `#CCCCCC` | Extreme highlights only |

### Usage Rules

✓ **Default body text**: `#00FF00` on `#000000`  
✓ **Links**: `#00FFFF` with underline on hover  
✓ **Errors**: `#FF9900` text on `#000000`  
✓ **Success**: `#00FF00` with brief flash/glow  
✗ **Never use pure white** (`#FFFFFF`) except for laser-focus highlights  
✗ **Avoid gray text** unless intentionally muted (timestamps, disabled)  

---

## TYPOGRAPHY

### Font Stack

```css
font-family: 'Consolas', 'Courier New', 'Lucida Console', 'Monaco', monospace;
```

**Optional Retro Font** (Google Fonts):
```css
font-family: 'VT323', 'Consolas', monospace;
```

### Type Scale

| Element | Size | Weight | Transform | Letter Spacing |
|---------|------|--------|-----------|----------------|
| H1 | 24px | Normal | Uppercase | 2px |
| H2 | 20px | Normal | Uppercase | 1.5px |
| H3 | 18px | Normal | Uppercase | 1px |
| Body | 16px | Normal | None | 0.5px |
| Small | 14px | Normal | None | 0.5px |
| Code | 14px | Normal | None | 0 |
| Tiny | 12px | Normal | Uppercase | 1px |

### Line Height

- **Headings**: 1.2
- **Body text**: 1.6
- **Code blocks**: 1.4

### Text Styles

**No Bold or Italic** (preserves monospace aesthetic)

**Emphasis Techniques**:
- `UPPERCASE` for emphasis
- `[BRACKETS]` for system labels
- `> Prefix` for commands/prompts
- `• Bullets` for lists

### Special Characters

**ASCII Box Drawing**:
```
─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼
═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬
```

**Symbols**:
```
• ◦ ▪ ▫ (bullets)
✓ ✗ ⚠ (status)
● ◯ ◐ (indicators)
█ ░ ▓ (blocks, progress bars)
```

---

## COMPONENT LIBRARY

### 1. TerminalPanel

**Visual Example**:
```
┌────────────────────────────────────────┐
│ ┌─ PANEL_HEADER ─────────────────┐     │
│ │ Content area                   │     │
│ │ Multiple lines supported       │     │
│ └────────────────────────────────┘     │
└────────────────────────────────────────┘
```

**CSS Properties**:
```css
.terminal-panel {
  background: #000000;
  border: 2px solid #00FF00;
  padding: 16px;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  font-family: 'Consolas', monospace;
}
```

**Variants**:
- `.panel-green` → `#00FF00` border
- `.panel-cyan` → `#00FFFF` border
- `.panel-amber` → `#FF9900` border (warnings)

---

### 2. CLIInput (Command Line Input)

**Visual Example**:
```
> COMMAND_PROMPT █
```

**CSS Properties**:
```css
.cli-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #00FF00;
  color: #00FF00;
  font-family: 'Consolas', monospace;
  font-size: 16px;
  outline: none;
  padding: 8px 0;
}

.cli-input:focus {
  border-bottom: 2px solid #00FFFF;
}

.cli-input::placeholder {
  color: #666666;
}
```

**Cursor Animation**:
```css
.cursor {
  display: inline-block;
  width: 10px;
  height: 20px;
  background: #00FF00;
  animation: blink 500ms infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

**States**:
- `:focus` → cyan underline
- `:disabled` → gray text, no cursor
- `:error` → amber underline + shake animation

---

### 3. NeonButton

**Visual Example**:
```
┌──────────────┐
│ [ EXECUTE ]  │
└──────────────┘
```

**CSS Properties**:
```css
.neon-button {
  background: transparent;
  border: 2px solid #00FF00;
  color: #00FF00;
  padding: 8px 16px;
  font-family: 'Consolas', monospace;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.neon-button:hover {
  background: #00FF00;
  color: #000000;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.7);
}

.neon-button:active {
  transform: scale(0.95);
}

.neon-button:disabled {
  border-color: #333333;
  color: #666666;
  cursor: not-allowed;
  box-shadow: none;
}
```

**Variants**:
- `.btn-primary` → Green (`#00FF00`)
- `.btn-secondary` → Cyan (`#00FFFF`)
- `.btn-danger` → Amber (`#FF9900`)

---

### 4. GhostLink (Text Links)

**Visual Example**:
```
Visit the network nodes
```

**CSS Properties**:
```css
.ghost-link {
  color: #00FFFF;
  text-decoration: underline;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-link:hover {
  color: #00FFFF;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
  animation: flicker 0.3s;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  10%, 30%, 50%, 70%, 90% { opacity: 0.9; }
  20%, 40%, 60%, 80% { opacity: 1; }
}
```

---

### 5. LogLine (Chat Message)

**Visual Example**:
```
12:34:56 DW-1A2B > Hello, network.
```

**HTML Structure**:
```html
<div class="log-line">
  <span class="timestamp">12:34:56</span>
  <span class="uid">DW-1A2B</span>
  <span class="separator">></span>
  <span class="message">Hello, network.</span>
</div>
```

**CSS Properties**:
```css
.log-line {
  font-family: 'Consolas', monospace;
  line-height: 1.6;
  margin: 4px 0;
}

.timestamp {
  color: #666666;
  margin-right: 8px;
}

.uid {
  color: #00FF00;
  margin-right: 4px;
}

.separator {
  color: #00FFFF;
  margin-right: 8px;
}

.message {
  color: #00FF00;
}

/* System messages */
.log-line.system {
  color: #00FFFF;
  font-style: normal;
}

.log-line.system::before {
  content: "[SYSTEM] ";
  color: #00FFFF;
}
```

---

### 6. StatusLED (Indicator)

**Visual Example**:
```
● ONLINE  ◦ OFFLINE  ⚠ AWAY
```

**CSS Properties**:
```css
.status-led {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-led.online {
  background: #00FF00;
  animation: pulse-glow 2s infinite;
}

.status-led.offline {
  background: #333333;
}

.status-led.away {
  background: #FF9900;
  animation: pulse-glow 4s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px currentColor;
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 20px currentColor;
    opacity: 0.7;
  }
}
```

---

### 7. Card (BIOS-Style Panel)

**Visual Example**:
```
╔═══════════════════════════╗
║ SYSTEM_CONFIGURATION      ║
╠═══════════════════════════╣
║ [Option 1]                ║
║ [Option 2]                ║
╚═══════════════════════════╝
```

**CSS Properties**:
```css
.bios-card {
  background: #001a1a;
  border: 2px solid #00FFFF;
  padding: 12px;
  font-family: 'Consolas', monospace;
}

.bios-card-header {
  border-bottom: 1px solid #00FFFF;
  padding-bottom: 8px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.bios-card-option {
  padding: 4px 0;
  color: #00FF00;
  cursor: pointer;
}

.bios-card-option:hover {
  background: #003300;
}

.bios-card-option.selected {
  background: #00FF00;
  color: #000000;
}
```

---

### 8. Modal (DOS-Style Dialog)

**Visual Example**:
```
┌───────────────────────────────┐
│ [!] CONFIRMATION_REQUIRED     │
├───────────────────────────────┤
│                               │
│ Message content here...       │
│                               │
├───────────────────────────────┤
│ [Y] Yes    [N] No             │
└───────────────────────────────┘
```

**CSS Properties**:
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: #000000;
  border: 3px double #00FF00;
  padding: 16px;
  min-width: 400px;
  max-width: 600px;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
  animation: modal-appear 0.2s ease;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  color: #FF9900;
  text-transform: uppercase;
  border-bottom: 1px solid #00FF00;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.modal-body {
  color: #00FF00;
  line-height: 1.6;
  margin-bottom: 16px;
}

.modal-footer {
  border-top: 1px solid #00FF00;
  padding-top: 12px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

**Keyboard Shortcuts**:
- `ESC` → Close/cancel
- `Enter` → Confirm (if single action)
- `Y`/`N` → Quick shortcuts for yes/no dialogs

---

### 9. Toast (DOS Notification)

**Visual Example**:
```
╔═══════════════════════════╗
║ [✓] MESSAGE_SENT          ║
╚═══════════════════════════╝
```

**CSS Properties**:
```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #000000;
  border: 2px solid #00FF00;
  padding: 12px 16px;
  min-width: 250px;
  z-index: 2000;
  animation: toast-slide-in 0.3s ease;
}

@keyframes toast-slide-in {
  from {
    transform: translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast.success {
  border-color: #00FF00;
}

.toast.error {
  border-color: #FF9900;
}

.toast.info {
  border-color: #00FFFF;
}

.toast-icon {
  display: inline-block;
  margin-right: 8px;
}

.toast-message {
  display: inline-block;
  color: #00FF00;
  text-transform: uppercase;
}
```

**Auto-Dismiss**: 3 seconds (configurable)

---

### 10. ProgressBar

**Visual Example**:
```
████████░░░░░░░░░░░░ 40%
```

**CSS Properties**:
```css
.progress-bar {
  width: 100%;
  height: 20px;
  background: #003300;
  border: 1px solid #00FF00;
  position: relative;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #00FF00;
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.progress-bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #00FF00;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  mix-blend-mode: difference;
}
```

---

## VISUAL EFFECTS

### 1. CRT Scanlines Overlay

**Implementation**:
```css
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
```

**Usage**: Apply globally to `<body>` or root container

---

### 2. Flicker Animation

**Implementation**:
```css
@keyframes flicker {
  0%, 100% { opacity: 1; }
  10%, 30%, 50%, 70%, 90% { opacity: 0.9; }
  20%, 40%, 60%, 80% { opacity: 1; }
}

.flicker {
  animation: flicker 0.3s;
}
```

**Usage**: Links, buttons on hover (subtle, not loop)

---

### 3. Glitch Effect

**Implementation**:
```css
@keyframes glitch {
  0% {
    transform: translate(0);
    text-shadow: 0 0 0 transparent;
  }
  20% {
    transform: translate(-2px, 2px);
    text-shadow: 2px 0 #FF00FF, -2px 0 #00FFFF;
  }
  40% {
    transform: translate(2px, -2px);
    text-shadow: -2px 0 #FF00FF, 2px 0 #00FFFF;
  }
  60% {
    transform: translate(-2px, -2px);
    text-shadow: 2px 0 #00FFFF, -2px 0 #FF00FF;
  }
  80% {
    transform: translate(2px, 2px);
    text-shadow: -2px 0 #00FFFF, 2px 0 #FF00FF;
  }
  100% {
    transform: translate(0);
    text-shadow: 0 0 0 transparent;
  }
}

.glitch {
  animation: glitch 0.3s;
}
```

**Usage**: Critical actions only (purge, errors)

---

### 4. Glow Pulse

**Implementation**:
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 255, 0, 1);
  }
}

.glow-pulse {
  animation: pulse-glow 2s infinite;
}
```

**Usage**: Status indicators, active connections

---

### 5. Typing Cursor

**Implementation** (see CLIInput above)

---

## SOUND EFFECTS (OPTIONAL)

### Audio Files Needed

| Sound | Trigger | Duration | Volume |
|-------|---------|----------|--------|
| Keypress tick | Character typed | 50ms | 20% |
| Modem handshake | Private room connect | 2-3s | 30% |
| Error beep | Failed login/key | 200ms | 25% |
| Success chime | Registration, purge | 500ms | 30% |

### Implementation

```javascript
const sounds = {
  keypress: new Audio('/sounds/keypress.mp3'),
  modem: new Audio('/sounds/modem.mp3'),
  error: new Audio('/sounds/error.mp3'),
  success: new Audio('/sounds/success.mp3'),
};

// Set volumes
Object.values(sounds).forEach(sound => {
  sound.volume = 0.3;
});

// Play with mute check
function playSound(type) {
  if (settings.audioEnabled) {
    sounds[type].currentTime = 0;
    sounds[type].play();
  }
}
```

**Default**: All sounds muted (opt-in via `/settings`)

---

## ACCESSIBILITY

### Focus Indicators

```css
*:focus {
  outline: 2px solid #00FFFF;
  outline-offset: 2px;
}

/* Custom focus for buttons */
.neon-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #00FFFF;
}
```

### High Contrast

All color combinations meet **WCAG AAA** (7:1 ratio):
- `#00FF00` on `#000000`: 15.3:1 ✓
- `#00FFFF` on `#000000`: 14.6:1 ✓
- `#FF9900` on `#000000`: 8.3:1 ✓

### Screen Reader Support

- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- ARIA labels on all interactive components
- Live regions for dynamic content (`role="alert"`, `aria-live="polite"`)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## RESPONSIVE DESIGN

### Breakpoints

| Size | Width | Usage |
|------|-------|-------|
| Mobile | < 640px | Single column, larger tap targets |
| Tablet | 641-1024px | Adjusted spacing, sidebar collapsible |
| Desktop | > 1024px | Full layout, sidebars visible |

### Mobile Adaptations

- Font size: 14px (vs 16px desktop)
- Button padding: 12px 20px (larger tap targets)
- Modal width: 90vw (vs fixed 600px)
- Scanline opacity: 0.02 (vs 0.05, less distraction)

---

## TAILWIND CONFIG EXTENSION

```javascript
// tailwind.config.js
module.exports = {
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
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
        },
      },
      animation: {
        blink: 'blink 500ms infinite',
        flicker: 'flicker 300ms',
        glitch: 'glitch 300ms',
      },
    },
  },
};
```

---

## COMPONENT CHECKLIST

- [x] TerminalPanel
- [x] CLIInput
- [x] NeonButton
- [x] GhostLink
- [x] LogLine
- [x] StatusLED
- [x] Card (BIOS)
- [x] Modal (DOS)
- [x] Toast
- [x] ProgressBar
- [x] CRT Scanlines
- [x] Flicker effect
- [x] Glitch effect
- [x] Glow pulse
- [x] Typing cursor

---

## DESIGN TOKENS (CSS Variables)

```css
:root {
  /* Colors */
  --color-bg: #000000;
  --color-primary: #00FF00;
  --color-secondary: #00FFFF;
  --color-accent: #FF00FF;
  --color-warn: #FF9900;
  --color-muted: #666666;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-mono: 'Consolas', monospace;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 20px;
  --line-height: 1.6;

  /* Effects */
  --glow-sm: 0 0 5px;
  --glow-md: 0 0 10px;
  --glow-lg: 0 0 20px;
  
  /* Transitions */
  --transition-fast: 0.1s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```




