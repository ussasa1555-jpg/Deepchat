# 🚀 DEEPS ROOMS - PRODUCTION INSTALLATION GUIDE

**Version:** 1.0.0  
**Date:** October 2025  
**Production Ready:** ✅ YES  
**Performance:** Optimized for 10,000+ concurrent users

---

## 📋 **QUICK START (5 Minutes)**

### **For Simple Chat App (DM Only)**
```
1. Run: 01_BASE_CORE.sql
2. Run: 02_DM_SYSTEM.sql
3. Done! ✅
```

### **For Full Platform (Rooms + DM + Social)**
```
1. Run: 01_BASE_CORE.sql
2. Run: 02_DM_SYSTEM.sql
3. Run: 03_ROOMS_SYSTEM.sql
4. Run: 04_SOCIAL_FEATURES.sql
5. (Optional) 05_ADMIN_SECURITY.sql
```

---

## 📚 **FILE OVERVIEW**

| File | Purpose | Required? | Size | Features |
|------|---------|-----------|------|----------|
| `01_BASE_CORE.sql` | Users, auth, extensions | ✅ **YES** | Small | Users table, auth triggers |
| `02_DM_SYSTEM.sql` | Direct messaging | ✅ **YES** | Medium | E2EE, read receipts, TTL, blocks |
| `03_ROOMS_SYSTEM.sql` | Group chat rooms | 🔵 Optional | Medium | Public/private rooms, member limits |
| `04_SOCIAL_FEATURES.sql` | Friends, reports, AI | 🔵 Optional | Medium | Friend system, reports, Oracle AI |
| `05_ADMIN_SECURITY.sql` | Admin panel | ⚠️ Advanced | Large | 3-tier roles, 2FA, audit logs |

---

## 🎯 **INSTALLATION STEPS**

### **STEP 1: Open Supabase SQL Editor**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

---

### **STEP 2: Run Files in Order**

#### **🟢 REQUIRED - BASE CORE**
```sql
-- Copy and paste: 01_BASE_CORE.sql
-- Expected output: "✅ BASE CORE READY"
-- Time: ~2 seconds
```

**What it does:**
- Creates `users` table
- Sets up auth triggers
- Enables RLS

**Verify:**
```sql
SELECT * FROM users LIMIT 1;
```

---

#### **🟢 REQUIRED - DM SYSTEM**
```sql
-- Copy and paste: 02_DM_SYSTEM.sql
-- Expected output: "✅ DM SYSTEM READY"
-- Time: ~5 seconds
```

**What it does:**
- Creates `dm_threads`, `dm_participants`, `dm_messages`
- Creates `blocked_users`
- Sets up E2EE encryption fields
- Enables read receipts & notifications
- Auto TTL (30 days)

**Verify:**
```sql
SELECT COUNT(*) FROM dm_threads;
SELECT COUNT(*) FROM dm_messages;
```

---

#### **🔵 OPTIONAL - ROOMS SYSTEM**
```sql
-- Copy and paste: 03_ROOMS_SYSTEM.sql
-- Expected output: "✅ ROOMS SYSTEM READY"
-- Time: ~5 seconds
```

**What it does:**
- Creates `rooms`, `members`, `messages`
- Public/private rooms with key protection
- Member limits (12 for private rooms)
- Room creation limits (1 public/day for users)

**Verify:**
```sql
SELECT COUNT(*) FROM rooms;
```

---

#### **🔵 OPTIONAL - SOCIAL FEATURES**
```sql
-- Copy and paste: 04_SOCIAL_FEATURES.sql
-- Expected output: "✅ SOCIAL FEATURES READY"
-- Time: ~3 seconds
```

**What it does:**
- Creates `nodes` (friend system)
- Creates `reports` (user reporting)
- Creates `ai_sessions` (Oracle AI)
- Creates `purge_logs` (GDPR compliance)

**Verify:**
```sql
SELECT COUNT(*) FROM nodes;
```

---

#### **⚠️ ADVANCED - ADMIN & SECURITY**
```sql
-- Copy and paste: 05_ADMIN_SECURITY.sql
-- Expected output: "✅ ADMIN & SECURITY READY"
-- Time: ~10 seconds
```

**What it does:**
- 3-tier role system (user/admin/management)
- 2FA (Two-Factor Authentication)
- User bans & admin timeouts
- Immutable audit logs
- IP whitelist/blacklist

**⚠️ IMPORTANT:** After running, create your first management user:
```sql
-- Replace YOUR_UID with your actual user ID
UPDATE users 
SET role = 'management' 
WHERE uid = 'YOUR_UID';
```

---

## ✅ **VERIFICATION CHECKLIST**

### **After Each File:**

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 🧪 **TESTING**

### **Test 1: User Registration**
1. Register a new user in your app
2. Check: `SELECT * FROM users WHERE email = 'test@example.com';`
3. Expected: User should appear

### **Test 2: DM Sending**
1. Send a DM from frontend
2. Check: `SELECT * FROM dm_messages ORDER BY created_at DESC LIMIT 1;`
3. Expected: Message with `ttl_at` set to 30 days from now

### **Test 3: Room Creation (if installed)**
1. Create a room from frontend
2. Check: `SELECT * FROM rooms ORDER BY created_at DESC LIMIT 1;`
3. Expected: Room with creator as admin member

---

## 🔥 **PERFORMANCE TUNING**

### **For 10,000+ Users:**

```sql
-- Add composite indexes
CREATE INDEX CONCURRENTLY idx_dm_messages_thread_ttl 
ON dm_messages(thread_id, ttl_at) 
WHERE deleted = false;

CREATE INDEX CONCURRENTLY idx_messages_room_ttl 
ON messages(room_id, ttl_at) 
WHERE deleted = false;

-- Analyze tables
ANALYZE users;
ANALYZE dm_messages;
ANALYZE messages;
ANALYZE nodes;
```

---

## 🛡️ **SECURITY CHECKLIST**

- [ ] RLS enabled on all tables
- [ ] No public INSERT/UPDATE/DELETE policies without checks
- [ ] All functions use `SECURITY DEFINER` with `SET search_path`
- [ ] Admin actions are immutable (no UPDATE/DELETE policies)
- [ ] TTL enforced on messages (auto-delete after 30 days)
- [ ] No self-connections in `nodes` table
- [ ] No self-blocks in `blocked_users` table

---

## 📊 **MONITORING QUERIES**

```sql
-- Active users (last 24 hours)
SELECT COUNT(DISTINCT uid) 
FROM users 
WHERE last_login_at > NOW() - INTERVAL '24 hours';

-- Messages today
SELECT COUNT(*) 
FROM dm_messages 
WHERE created_at::date = CURRENT_DATE;

-- Active rooms
SELECT COUNT(*) 
FROM rooms 
WHERE last_activity_at > NOW() - INTERVAL '7 days';

-- Top users by message count
SELECT u.nickname, COUNT(dm.id) as message_count
FROM users u
JOIN dm_messages dm ON dm.uid = u.uid
WHERE dm.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.nickname
ORDER BY message_count DESC
LIMIT 10;
```

---

## 🆘 **TROUBLESHOOTING**

### **Error: "relation already exists"**
```sql
-- Safe to ignore if re-running
-- Or drop specific table:
DROP TABLE table_name CASCADE;
```

### **Error: "permission denied"**
```sql
-- Check RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Grant permissions:
GRANT ALL ON your_table TO authenticated, anon;
```

### **Messages not appearing after refresh**
```sql
-- Check TTL:
SELECT id, body, created_at, ttl_at, (ttl_at - NOW()) as time_remaining
FROM dm_messages
WHERE thread_id = 'YOUR_THREAD_ID'
ORDER BY created_at DESC;

-- If ttl_at is NULL, trigger didn't fire
-- Re-run 02_DM_SYSTEM.sql
```

### **"blocked_users 406 error"**
```sql
-- Table missing, run:
-- See 02_DM_SYSTEM.sql, Step 4
```

---

## 🔄 **MAINTENANCE**

### **Daily (Automated with pg_cron):**
```sql
-- Cleanup expired messages
DELETE FROM dm_messages WHERE ttl_at < NOW();
DELETE FROM messages WHERE ttl_at < NOW();

-- Cleanup expired AI sessions
DELETE FROM ai_sessions WHERE ttl_at < NOW();

-- Expire old bans
UPDATE user_bans 
SET is_active = false 
WHERE is_active = true 
  AND expires_at < NOW();
```

### **Weekly:**
```sql
-- Vacuum analyze
VACUUM ANALYZE dm_messages;
VACUUM ANALYZE messages;
```

---

## 📞 **SUPPORT**

- **Documentation:** See individual SQL files for detailed comments
- **Performance Issues:** Check indexes with `EXPLAIN ANALYZE`
- **Security Concerns:** Review RLS policies in each file

---

## 🎉 **SUCCESS!**

If you see these outputs:
```
✅ BASE CORE READY
✅ DM SYSTEM READY
✅ ROOMS SYSTEM READY (if installed)
✅ SOCIAL FEATURES READY (if installed)
✅ ADMIN & SECURITY READY (if installed)
```

**Your database is production-ready!** 🚀

---

## 📈 **WHAT'S NEXT?**

1. **Frontend Integration:** Connect your Next.js app
2. **Realtime Setup:** Enable Supabase Realtime on project settings
3. **Email Setup:** Configure SMTP for auth emails
4. **Monitoring:** Set up database metrics
5. **Backups:** Enable Point-in-Time Recovery (PITR)

---

**Built with ❤️ for production at scale**  
**Questions? Check the SQL files for detailed inline documentation**





