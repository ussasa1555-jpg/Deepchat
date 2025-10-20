# 🧪 DEEPCHAT - COMPLETE TEST CHECKLIST

## 📋 OVERVIEW

**Total Features:** 50+
**Test Categories:** 15
**Estimated Time:** 4-6 hours
**Priority:** ⭐⭐⭐ Critical = Must pass, ⭐⭐ High = Important, ⭐ Medium = Nice to have

---

## 🔐 AUTHENTICATION & SECURITY TESTS

### 1. User Registration ⭐⭐⭐
- [ ] Register with valid email and nickname
- [ ] Verify email format validation
- [ ] Verify nickname length (3-16 chars)
- [ ] Check duplicate email rejection
- [ ] Check duplicate nickname rejection
- [ ] Verify password strength requirements
- [ ] Check account creation in database

### 2. User Login ⭐⭐⭐
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login with non-existent email (should fail)
- [ ] Check session creation
- [ ] Verify redirect to dashboard
- [ ] Test "Remember me" functionality

### 3. Two-Factor Authentication (2FA) ⭐⭐⭐
- [ ] Enable 2FA from settings
- [ ] Scan QR code with authenticator app
- [ ] Verify 6-digit code works
- [ ] Test manual secret entry
- [ ] Save backup codes
- [ ] Disable 2FA (requires password + code)
- [ ] Login with 2FA enabled
- [ ] Test backup code usage
- [ ] Check failed 2FA attempts (rate limiting)

### 4. Password Management ⭐⭐⭐
- [ ] Change password from settings
- [ ] Verify old password required
- [ ] Check password strength meter
- [ ] Request password reset
- [ ] Receive reset email
- [ ] Reset password via link
- [ ] Verify old password no longer works
- [ ] Verify auto-logout after reset

### 5. Session Management ⭐⭐
- [ ] Check session persistence (refresh page)
- [ ] Test logout functionality
- [ ] Verify session expiration
- [ ] Test concurrent sessions (different devices)
- [ ] Check device fingerprinting
- [ ] Verify IP logging in audit logs

---

## 💬 MESSAGING TESTS

### 6. Room Messages ⭐⭐⭐
- [ ] Send message in public room
- [ ] Send message in private room
- [ ] Verify real-time delivery (other users see it)
- [ ] Check message timestamp
- [ ] Test max length (2000 chars)
- [ ] Verify emoji support
- [ ] Test URL detection (cyan, clickable)
- [ ] Test `-important text-` formatting (red, bold)
- [ ] Check message order (chronological)
- [ ] Verify scroll to bottom on new message

### 7. Direct Messages (DM) ⭐⭐⭐
- [ ] Send DM to friend
- [ ] Receive DM from friend
- [ ] Verify real-time delivery
- [ ] Check DM thread creation
- [ ] Test multiple DM conversations
- [ ] Verify participant list
- [ ] Check unread DM indicators
- [ ] Test DM notifications

### 8. Message Editing ⭐⭐
- [ ] Edit own message within 1 minute
- [ ] Verify edit time limit (>1 min = cannot edit)
- [ ] Check "(edited)" indicator
- [ ] Verify edited message updates for others
- [ ] Test edit with max length

### 9. Message Deletion ⭐⭐
- [ ] Delete own message (direct, no confirmation)
- [ ] Verify "[Message deleted]" placeholder
- [ ] Check deleted message for other users
- [ ] Verify message removed from database

### 10. Self-Destruct Messages ⭐⭐
- [ ] Send self-destruct message (e.g., 60s)
- [ ] Verify countdown display next to timestamp
- [ ] Wait for timer to expire
- [ ] Check message auto-deletes
- [ ] Verify "[Message self-destructed]" placeholder
- [ ] Test different TTL values (30s, 60s, 5min)

---

## 🏠 ROOM MANAGEMENT TESTS

### 11. Public Rooms ⭐⭐⭐
- [ ] Create public room
- [ ] Join public room
- [ ] View room list
- [ ] Leave room
- [ ] Verify member count updates
- [ ] Check room description display
- [ ] Test room search/filter

### 12. Private Rooms ⭐⭐⭐
- [ ] Create private room with key
- [ ] Join private room with correct key
- [ ] Try joining with wrong key (should fail)
- [ ] Verify key is hashed (not visible)
- [ ] Copy room key
- [ ] Share room key
- [ ] Check private room in list (shows locked icon)

### 13. Room Features ⭐⭐
- [ ] View room members list
- [ ] See online/offline status of members
- [ ] View room creation date
- [ ] Check last message timestamp
- [ ] Test member roles (owner, admin, member)
- [ ] Verify room creator has admin role

### 14. Room Locking (Management Only) ⭐⭐
- [ ] Management locks a room
- [ ] Verify warning banner displays
- [ ] Check reason for lock shows
- [ ] Verify users cannot send messages
- [ ] Test read-only access
- [ ] Check unlock functionality
- [ ] Verify lock action logged

---

## 👥 FRIENDS & SOCIAL TESTS

### 15. Friend System ⭐⭐⭐
- [ ] Send friend request
- [ ] Receive friend request
- [ ] Accept friend request
- [ ] Decline friend request
- [ ] View friends list
- [ ] See online status of friends
- [ ] Unfriend user
- [ ] Check friend count updates

### 16. Blocking Users ⭐⭐
- [ ] Block a user
- [ ] Verify blocked user's DMs don't show
- [ ] Check "This user is blocked" message in DM
- [ ] Unblock user from DM page
- [ ] Verify unblock works
- [ ] Test blocked user cannot send DMs

### 17. User Profiles ⭐⭐
- [ ] View own profile
- [ ] View other user's profile
- [ ] Check nickname, email display
- [ ] Verify role badge ([ADMIN], [MGM])
- [ ] See account creation date
- [ ] View 2FA status indicator

---

## 🔔 NOTIFICATIONS & INDICATORS

### 18. Sound Notifications ⭐⭐
- [ ] Receive message in room → hear sound
- [ ] Receive DM → hear sound
- [ ] Receive friend request → hear sound
- [ ] Verify sound only for NEW messages (not own)
- [ ] Test notification sound when tab is not focused
- [ ] Check sound doesn't play for own messages

### 19. Typing Indicators ⭐⭐
- [ ] Start typing in room → others see "User is typing..."
- [ ] Stop typing → indicator disappears
- [ ] Test in DMs
- [ ] Check multiple users typing
- [ ] Verify indicator position

### 20. Read Receipts ⭐⭐
- [ ] Send message in room
- [ ] Check no tick = unread
- [ ] Have another user read it
- [ ] Verify single green checkmark appears
- [ ] Check receipt on left side of message (not below)

### 21. Online/Offline Status ⭐⭐⭐
- [ ] User logs in → shows online (green dot)
- [ ] User logs out → shows offline (gray)
- [ ] Enable "Appear Offline" → shows offline even when online
- [ ] Disable "Appear Offline" → shows online again
- [ ] Check status updates in real-time
- [ ] Verify status in friends list, DMs, rooms

---

## 🔍 SEARCH & DISCOVERY

### 22. Global Search (Admin) ⭐⭐
- [ ] Search for user by nickname
- [ ] Search for user by email
- [ ] Search for room by name
- [ ] Search for messages by content
- [ ] Filter results by type (all/users/rooms/messages)
- [ ] Click result → navigate to correct page
- [ ] Verify search works with partial matches

### 23. Message Search (In Room) ⭐⭐
- [ ] Search messages in current room
- [ ] Verify matching messages have green left border
- [ ] Check search highlights removed on clear
- [ ] Test case-insensitive search
- [ ] Verify scroll to first result

---

## 🛡️ ADMIN PANEL TESTS

### 24. Admin Access Control ⭐⭐⭐
- [ ] Admin user can access /admin
- [ ] Management user can access /admin
- [ ] Regular user CANNOT access /admin (blocked)
- [ ] Check 2FA required for admin access
- [ ] Verify IP logging for admin actions
- [ ] Test session timeout (admin sessions)

### 25. Admin Dashboard ⭐⭐⭐
- [ ] View total users count
- [ ] View total rooms count
- [ ] View total messages count
- [ ] View active threats count
- [ ] Check real-time stats (30s refresh)
- [ ] Verify color-coded alerts (red/amber/green)
- [ ] Test failed login tracking (1h, 24h)
- [ ] View active bans count

### 26. User Management (Admin) ⭐⭐⭐
- [ ] View users list
- [ ] Search user by nickname/email
- [ ] Click [Details] → see User Detail Modal
- [ ] View user statistics (messages, rooms, friends)
- [ ] View IP history
- [ ] View device history
- [ ] View recent activity log
- [ ] Check threat score display
- [ ] View 2FA status
- [ ] Ban user (admin only, with reason)
- [ ] Unban user
- [ ] Check admin quota tracking (ban limits)

### 27. Room Management (Admin) ⭐⭐⭐
- [ ] View all rooms
- [ ] Click [Info] → see Room Info Modal
- [ ] View room statistics (messages, members)
- [ ] View room health score (0-100)
- [ ] View creator information
- [ ] View member list
- [ ] View private key (Management only)
- [ ] Lock room (Management only)
- [ ] Delete room
- [ ] Verify deletion logs

### 28. Audit Logs (Admin) ⭐⭐⭐
- [ ] View audit logs
- [ ] Filter by action type
- [ ] Filter by user UID
- [ ] Filter by IP address
- [ ] Export logs to CSV
- [ ] Export logs to JSON
- [ ] Verify all admin actions are logged
- [ ] Check log immutability (cannot edit/delete)

### 29. Threat Detection (Admin) ⭐⭐
- [ ] View active threats
- [ ] Filter by severity (low/medium/high/critical)
- [ ] View threat details (IP, type, description)
- [ ] Mark threat as resolved
- [ ] Check automated threat detection works
- [ ] View threat history

### 30. Admin Chat Room ⭐⭐
- [ ] Access admin chat (/admin/chat)
- [ ] Verify only admin/management can access
- [ ] Send message in admin chat
- [ ] Receive message in real-time
- [ ] Check role badges display ([ADMIN], [MGM])
- [ ] Verify all messages are logged

---

## 🔒 SECURITY FEATURES TESTS

### 31. End-to-End Encryption ⭐⭐⭐
- [ ] Send encrypted message in room
- [ ] Verify message is encrypted in transit
- [ ] Decrypt message on receive
- [ ] Check encryption key generation
- [ ] Test key rotation (30 days)
- [ ] Verify HMAC signature
- [ ] Check nonce for replay protection
- [ ] Test encrypted DMs

### 32. Spam Detection ⭐⭐⭐
- [ ] Send duplicate message 5 times → blocked on 5th
- [ ] Send ALL CAPS message (>85% uppercase) → detected
- [ ] Send repeated characters (20+ same char) → detected
- [ ] Send multiple links → link spam detected
- [ ] Trigger flood detection (rapid messages)
- [ ] Verify spam user is temporarily blocked
- [ ] Check spam logs in threat_detections

### 33. Rate Limiting ⭐⭐⭐
- [ ] Test login rate limit (5 attempts/min)
- [ ] Test message send rate limit
- [ ] Test friend request rate limit
- [ ] Test room creation rate limit
- [ ] Test 2FA enable rate limit
- [ ] Test admin action rate limits
- [ ] Verify error messages on rate limit hit

### 34. Input Sanitization ⭐⭐⭐
- [ ] Try XSS attack in message → sanitized
- [ ] Try SQL injection in search → blocked
- [ ] Try script tags in nickname → rejected
- [ ] Test HTML injection in room description → sanitized
- [ ] Verify all user inputs are cleaned

### 35. Replay Attack Prevention ⭐⭐
- [ ] Send message with nonce
- [ ] Try to replay same message → blocked
- [ ] Verify message timestamp check
- [ ] Test nonce uniqueness

---

## ⚙️ SETTINGS & PREFERENCES

### 36. User Settings ⭐⭐⭐
- [ ] Change nickname
- [ ] Change email
- [ ] Change password
- [ ] Enable/disable 2FA
- [ ] Enable "Appear Offline"
- [ ] Disable "Appear Offline"
- [ ] View account creation date
- [ ] View last login date

### 37. Notification Settings ⭐⭐
- [ ] Toggle sound notifications
- [ ] Toggle typing indicators
- [ ] Toggle read receipts
- [ ] Toggle online status visibility
- [ ] Verify settings persist on refresh

---

## 🎨 UI/UX TESTS

### 38. Responsive Design ⭐⭐
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Check all pages are readable
- [ ] Verify buttons are clickable (touch-friendly)
- [ ] Test horizontal scrolling (none expected)

### 39. Theme & Styling ⭐⭐
- [ ] Check retro-futuristic theme loads
- [ ] Verify neon accents (cyan/magenta)
- [ ] Check terminal-style UI
- [ ] Test animated particles
- [ ] Verify all icons display correctly
- [ ] Check color contrast (readability)

### 40. Navigation ⭐⭐⭐
- [ ] Test back button in all pages
- [ ] Verify breadcrumbs (where applicable)
- [ ] Check sidebar navigation
- [ ] Test keyboard shortcuts (if any)
- [ ] Verify all links work
- [ ] Check 404 page for invalid routes

### 41. Forms & Inputs ⭐⭐⭐
- [ ] Test all input fields accept text
- [ ] Verify placeholder text shows
- [ ] Check auto-focus on relevant inputs
- [ ] Test form validation messages
- [ ] Verify submit buttons enable/disable correctly
- [ ] Check loading states during submission

### 42. Scroll Behavior ⭐⭐
- [ ] Chat auto-scrolls to bottom on new message
- [ ] User scroll up → auto-scroll disabled
- [ ] User scroll to bottom → auto-scroll re-enabled
- [ ] Test smooth scrolling
- [ ] Verify scroll position maintained on refresh

---

## 🤖 AI & ADVANCED FEATURES

### 43. Oracle AI Chat ⭐⭐
- [ ] Access /oracle page
- [ ] Send message to Oracle
- [ ] Receive AI response
- [ ] Verify conversation history
- [ ] Check session management
- [ ] Test AI response time
- [ ] Verify max message length

---

## 📊 ANALYTICS & REPORTING

### 44. User Analytics (Admin) ⭐⭐
- [ ] View user_analytics view
- [ ] Check total messages count
- [ ] View messages by time period (24h, 7d, 30d)
- [ ] See rooms created/joined
- [ ] View DM conversations count
- [ ] Check friends count
- [ ] View failed login attempts
- [ ] Verify last activity timestamp

### 45. Room Analytics (Admin) ⭐⭐
- [ ] View room_analytics view
- [ ] Check total messages in room
- [ ] View active members (24h)
- [ ] See health score (0-100)
- [ ] Check average message length
- [ ] View last message timestamp
- [ ] Verify creator information

### 46. System Statistics (Admin) ⭐⭐⭐
- [ ] Call get_system_stats()
- [ ] View total users (all time, 24h, 7d, 30d)
- [ ] View total rooms (by type)
- [ ] View total messages (by period)
- [ ] Check active threats count
- [ ] View failed logins (1h, 24h)
- [ ] See active bans count

---

## 🔄 REALTIME & PERFORMANCE

### 47. WebSocket Connectivity ⭐⭐⭐
- [ ] Check WebSocket connection establishes
- [ ] Verify real-time message delivery (<1s)
- [ ] Test reconnection on disconnect
- [ ] Check presence tracking
- [ ] Verify typing indicators work in real-time
- [ ] Test with multiple concurrent users

### 48. Page Load Performance ⭐⭐
- [ ] Check dashboard loads <2s
- [ ] Verify room list loads <1s
- [ ] Test message history loads <2s
- [ ] Check friends list loads <1s
- [ ] Verify admin panel loads <3s
- [ ] Test with 100+ messages in room

### 49. Database Performance ⭐⭐
- [ ] Query user_analytics view (<500ms)
- [ ] Query room_analytics view (<500ms)
- [ ] Test get_user_details() (<1s)
- [ ] Test get_room_details() (<1s)
- [ ] Verify indexes work (check query plans)

---

## 🚨 ERROR HANDLING & EDGE CASES

### 50. Network Errors ⭐⭐
- [ ] Disconnect internet → show error
- [ ] Reconnect → auto-recover
- [ ] Test message queue (offline → online)
- [ ] Verify graceful degradation

### 51. Invalid Inputs ⭐⭐
- [ ] Submit empty form → validation error
- [ ] Enter too long text → truncate/reject
- [ ] Enter special characters → sanitize
- [ ] Test SQL injection attempts → blocked
- [ ] Verify all error messages are user-friendly

### 52. Edge Cases ⭐⭐
- [ ] User with 0 messages
- [ ] Room with 0 members
- [ ] Empty friends list
- [ ] User never logged in
- [ ] Expired session → redirect to login
- [ ] Deleted user data (purge test)

---

## 📱 MOBILE SPECIFIC TESTS

### 53. Touch Gestures ⭐⭐
- [ ] Tap buttons (responsive)
- [ ] Scroll chat (smooth)
- [ ] Pull to refresh (if applicable)
- [ ] Swipe gestures (if any)

### 54. Mobile Keyboard ⭐⭐
- [ ] Keyboard opens on input focus
- [ ] Keyboard closes on send
- [ ] Input field stays visible above keyboard
- [ ] Test autocorrect behavior

---

## 🔐 COMPLIANCE & SECURITY AUDIT

### 55. Data Privacy ⭐⭐⭐
- [ ] Verify passwords are hashed (bcrypt)
- [ ] Check encryption keys not exposed
- [ ] Verify sensitive data in logs (redacted)
- [ ] Test data export (GDPR compliance)
- [ ] Verify account deletion (purge_user_data)

### 56. Security Headers ⭐⭐⭐
- [ ] Check CSP header present
- [ ] Verify HSTS enabled
- [ ] Check X-Frame-Options
- [ ] Verify Referrer-Policy
- [ ] Check Permissions-Policy
- [ ] Test CORS settings

---

## 📝 DOCUMENTATION TESTS

### 57. Documentation Accuracy ⭐⭐
- [ ] Read README.md → verify setup steps work
- [ ] Follow INSTALL.md → successful install
- [ ] Check QUICK_START.md → accurate info
- [ ] Review API docs (if any) → correct endpoints
- [ ] Verify migration order → runs successfully

---

## 🎯 FINAL INTEGRATION TESTS

### 58. User Journey: New User ⭐⭐⭐
1. [ ] Register account
2. [ ] Verify email
3. [ ] Login
4. [ ] Create public room
5. [ ] Send message
6. [ ] Add friend
7. [ ] Send DM
8. [ ] Enable 2FA
9. [ ] Logout

### 59. User Journey: Admin ⭐⭐⭐
1. [ ] Login as admin
2. [ ] Verify 2FA
3. [ ] Access admin panel
4. [ ] View dashboard stats
5. [ ] Search for user
6. [ ] View user details
7. [ ] View audit logs
8. [ ] Send message in admin chat
9. [ ] Logout

### 60. User Journey: Power User ⭐⭐⭐
1. [ ] Login
2. [ ] Join 5 rooms
3. [ ] Send 50 messages
4. [ ] Add 10 friends
5. [ ] Create private room
6. [ ] Share private key
7. [ ] Test all message features (edit, delete, self-destruct)
8. [ ] Block/unblock user
9. [ ] Change all settings
10. [ ] Logout

---

## 📊 TEST SUMMARY TEMPLATE

```
=== TEST RUN: [DATE] ===

TOTAL TESTS: 60
PASSED: __/60
FAILED: __/60
SKIPPED: __/60

CRITICAL FAILURES (⭐⭐⭐): __
HIGH FAILURES (⭐⭐): __
MEDIUM FAILURES (⭐): __

BLOCKERS:
- [ ] Issue 1: Description
- [ ] Issue 2: Description

NOTES:
- 
- 
- 

TESTED BY: [NAME]
ENVIRONMENT: [Dev/Staging/Prod]
BUILD: [Version/Commit Hash]
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment ⭐⭐⭐
- [ ] All critical tests (⭐⭐⭐) passed
- [ ] All migrations applied successfully
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] DNS configured

### Post-Deployment ⭐⭐⭐
- [ ] Smoke test (login, send message)
- [ ] Monitor error logs (first 30 min)
- [ ] Check real-time features work
- [ ] Verify admin panel accessible
- [ ] Test from different locations/IPs
- [ ] Monitor database performance

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues
1. **Migration errors:** Check column names match
2. **WebSocket not connecting:** Verify Supabase realtime enabled
3. **2FA QR code not working:** Use manual secret entry
4. **Admin panel 403:** Check role, 2FA, IP whitelist
5. **Messages not sending:** Check rate limits, spam detection

### Debugging Commands
```sql
-- Check user exists
SELECT * FROM users WHERE email = 'test@example.com';

-- View audit logs for user
SELECT * FROM audit_logs WHERE uid = 'USER_UID' ORDER BY created_at DESC LIMIT 50;

-- Check room messages
SELECT * FROM messages WHERE room_id = 'ROOM_ID' ORDER BY created_at DESC LIMIT 20;

-- View system stats
SELECT get_system_stats();

-- Check threat detections
SELECT * FROM threat_detections WHERE resolved = false;
```

---

## ✅ FINAL NOTES

- **Test in order:** Follow categories sequentially
- **Document failures:** Screenshot + description
- **Retest after fixes:** Mark [RETEST] next to item
- **Environment:** Note dev/staging/production
- **Browser:** Test on Chrome, Firefox, Safari, Edge
- **Time tracking:** Log time spent per category

**GOOD LUCK WITH TESTING!** 🧪🚀✨







