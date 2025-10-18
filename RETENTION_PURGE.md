# DATA RETENTION & PURGE SPECIFICATIONS

```
[RETENTION_POLICY] DATA LIFECYCLE & PURGE OPERATIONS
════════════════════════════════════════════════════════════
```

## RETENTION PHILOSOPHY

**Core Principle**: Deepchat is **ephemeral by design**. Data is automatically purged after defined periods to protect user privacy and minimize liability.

### Retention Periods

| Data Type | Retention | Enforcement |
|-----------|-----------|-------------|
| **Messages** (room & DM) | 30 days | Auto-purge (CRON) |
| **Room memberships** | Until manual leave or room deletion | User action |
| **Inactive private rooms** | 10 days | Auto-purge (TTL) |
| **AI sessions** | 1 hour | Redis TTL |
| **Pending node requests** | 72 hours | Auto-purge (CRON) |
| **Audit logs** | 30 days | Auto-purge (CRON) |
| **User accounts** | Until manual delete | User action |
| **Session JWTs** | 12 hours | Supabase Auth TTL |

---

## AUTO-PURGE PIPELINE

### 1. Message TTL (Time-To-Live)

**Implementation**: Database trigger sets `ttl_at` on insert

```sql
CREATE OR REPLACE FUNCTION set_ttl_30_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ttl_at := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_ttl
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_ttl_30_days();

CREATE TRIGGER set_dm_message_ttl
  BEFORE INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_ttl_30_days();
```

**Why 30 Days?**:
- Balance between usability and privacy
- Typical "active conversation" window
- Reduces database size, improves performance
- Complies with GDPR minimization principle

---

### 2. CRON Job (Daily Purge)

**Schedule**: Daily at 03:00 UTC (low-traffic window)

**Supabase pg_cron Setup**:
```sql
SELECT cron.schedule(
  'auto-purge-expired-data',
  '0 3 * * *', -- Every day at 3 AM UTC
  $$
    -- Delete expired messages
    DELETE FROM messages WHERE ttl_at < NOW();
    DELETE FROM dm_messages WHERE ttl_at < NOW();
    
    -- Delete expired AI sessions
    DELETE FROM ai_sessions WHERE ttl_at < NOW();
    
    -- Delete old purge logs (>30 days)
    DELETE FROM purge_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete pending node requests (>72 hours)
    DELETE FROM nodes WHERE status = 'pending' AND created_at < NOW() - INTERVAL '72 hours';
    
    -- Delete inactive private rooms (>10 days)
    DELETE FROM rooms WHERE type = 'private' AND last_activity_at < NOW() - INTERVAL '10 days';
    
    -- Vacuum to reclaim disk space
    VACUUM ANALYZE messages;
    VACUUM ANALYZE dm_messages;
    VACUUM ANALYZE ai_sessions;
  $$
);
```

**Monitoring**:
```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'auto-purge-expired-data';

-- Check last run
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-purge-expired-data')
ORDER BY start_time DESC
LIMIT 10;
```

**Alerts**:
- If job fails 3 times consecutively → Email admin
- If rows pending deletion > 1M → Slow query alert

---

### 3. Redis TTL (AI Sessions)

**Implementation**: Native Redis expiry

```typescript
// Set AI session with 1-hour TTL
await redis.setex(
  `ai:session:${sessionId}`,
  3600, // 1 hour in seconds
  JSON.stringify(conversationHistory)
);

// Redis automatically deletes key after expiry
// No manual cleanup needed
```

**Why Redis for AI Sessions?**:
- Fast in-memory operations
- Native TTL support (automatic purge)
- No database writes (privacy)
- Scalable to millions of sessions

---

## MANUAL PURGE_DATA

### User-Initiated Flow

**Trigger**: User navigates to `/purge` and executes `PURGE_DATA --CONFIRM` command

**Step-by-Step**:

1. **Command Entry**:
   ```
   User types: PURGE_DATA --CONFIRM
   ```

2. **Validation**:
   - Exact string match (case-sensitive)
   - User must be authenticated

3. **Confirmation Modal**:
   ```
   ╔════════════════════════════════════╗
   ║ [!] FINAL WARNING                  ║
   ╠════════════════════════════════════╣
   ║ This will DELETE:                  ║
   ║ • All messages sent/received       ║
   ║ • All room memberships             ║
   ║ • All DM threads                   ║
   ║ • All AI session logs              ║
   ║ • Network node connections         ║
   ║                                    ║
   ║ RETAINED:                          ║
   ║ • Your UID: DW-XXXX-XXXX           ║
   ║ • Password hash (for re-login)     ║
   ║                                    ║
   ║ Re-type your password to confirm:  ║
   ║ > _____________________________    ║
   ║                                    ║
   ║ [ESC] ABORT    [ENTER] EXECUTE     ║
   ╚════════════════════════════════════╝
   ```

4. **Password Re-verification**:
   ```typescript
   const { data: user } = await supabase.auth.getUser();
   const isValid = await supabase.auth.signInWithPassword({
     email: user.email,
     password: userEnteredPassword,
   });
   
   if (!isValid) {
     throw new Error('INVALID_PASSWORD');
   }
   ```

5. **Execute Purge**:
   ```typescript
   // Call Edge Function
   const response = await fetch('/api/purge', {
     method: 'POST',
     headers: { Authorization: `Bearer ${sessionToken}` },
     body: JSON.stringify({ password: userEnteredPassword }),
   });
   ```

6. **Server-Side Purge** (Edge Function):
   ```typescript
   export async function POST(req: Request) {
     const { password } = await req.json();
     const uid = getCurrentUserUID();
     
     // Verify password
     const isValid = await verifyPassword(uid, password);
     if (!isValid) {
       return Response.json({ error: 'INVALID_PASSWORD' }, { status: 401 });
     }
     
     // Execute purge function
     const { error } = await supabase.rpc('purge_user_data', { target_uid: uid });
     
     if (error) throw error;
     
     // Log action (hashed UID)
     await supabase.from('purge_logs').insert({
       uid_hash: sha256(uid),
       action: 'purge_data',
       timestamp: new Date().toISOString(),
     });
     
     // Clear Redis AI sessions
     const keys = await redis.keys(`ai:session:${uid}:*`);
     if (keys.length > 0) {
       await redis.del(...keys);
     }
     
     return Response.json({ success: true });
   }
   ```

7. **Database Function**:
   ```sql
   CREATE OR REPLACE FUNCTION purge_user_data(target_uid TEXT)
   RETURNS VOID AS $$
   BEGIN
     -- Delete messages (cascade handles room messages)
     DELETE FROM messages WHERE uid = target_uid;
     
     -- Delete DM messages
     DELETE FROM dm_messages WHERE uid = target_uid;
     
     -- Remove from DM threads
     DELETE FROM dm_participants WHERE uid = target_uid;
     
     -- Delete orphaned threads (no participants left)
     DELETE FROM dm_threads
     WHERE id NOT IN (SELECT DISTINCT thread_id FROM dm_participants);
     
     -- Leave all rooms
     DELETE FROM members WHERE uid = target_uid;
     
     -- Remove network nodes
     DELETE FROM nodes WHERE owner_uid = target_uid OR peer_uid = target_uid;
     
     -- Delete AI session records (Redis cleared separately)
     DELETE FROM ai_sessions WHERE uid = target_uid;
     
     -- Optional: Anonymize user profile (keep UID + auth for re-login)
     UPDATE users
     SET
       nickname = 'PURGED_' || substring(target_uid from 4),
       avatar = NULL
     WHERE uid = target_uid;
     
     -- Log completion
     RAISE NOTICE 'User data purged for UID: %', target_uid;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

8. **Success Response**:
   ```
   [PURGE_COMPLETE] — DATA_WIPED
   
   All data has been permanently deleted.
   Your account shell remains active.
   
   [RETURN_TO_DASHBOARD]
   ```

---

### What Gets Deleted

| Data | Deleted? | Notes |
|------|----------|-------|
| **Messages sent** | ✓ | All room & DM messages |
| **Messages received** | ✗ | Other users' messages stay (but your participation removed) |
| **Room memberships** | ✓ | Removed from all rooms |
| **Created rooms** | ✗ | Rooms remain, ownership transferred to oldest admin |
| **DM threads** | ✓ | Only threads where you're a participant |
| **Network nodes** | ✓ | All connections (sent & received) |
| **AI sessions** | ✓ | Redis keys + DB records |
| **UID** | ✗ | Retained for account shell |
| **Password hash** | ✗ | Retained for re-login |
| **Email** | ✗ | Managed by Supabase Auth (separate system) |

---

### Account Deletion vs. Data Purge

| Feature | PURGE_DATA | DELETE_ACCOUNT |
|---------|------------|----------------|
| **Deletes messages** | ✓ | ✓ |
| **Deletes memberships** | ✓ | ✓ |
| **Deletes UID** | ✗ | ✓ |
| **Deletes auth** | ✗ | ✓ |
| **Can re-login** | ✓ | ✗ |
| **Keeps account shell** | ✓ | ✗ |

**DELETE_ACCOUNT** (future feature):
```typescript
// Full account deletion
await supabase.rpc('delete_account', { target_uid: uid });
await supabase.auth.admin.deleteUser(uid);
```

---

## BACKUP RETENTION

### Daily Backups (Supabase Pro)

**Schedule**: Daily at 02:00 UTC (before purge runs)  
**Retention**: 7 days  
**Format**: pg_dump compressed  
**Encryption**: AES-256 at rest  

**Why Before Purge?**:
- Ensures recoverability if purge job fails
- Allows rollback within 7-day window
- Compliance with "right to access" (GDPR)

---

### Manual Backups (Weekly)

**Script**:
```bash
#!/bin/bash
# backup.sh - Run weekly via cron

DATE=$(date +%Y%m%d)
BACKUP_FILE="deepchat_backup_${DATE}.sql"

# Dump database
pg_dump -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  --clean --if-exists \
  --no-owner --no-acl \
  > "${BACKUP_FILE}"

# Compress
gzip "${BACKUP_FILE}"

# Encrypt (GPG)
gpg --encrypt --recipient admin@deepchat.app "${BACKUP_FILE}.gz"

# Upload to S3 (encrypted)
aws s3 cp "${BACKUP_FILE}.gz.gpg" \
  s3://deepchat-backups/ \
  --sse AES256

# Delete local copy
rm "${BACKUP_FILE}.gz" "${BACKUP_FILE}.gz.gpg"

echo "Backup completed: ${BACKUP_FILE}.gz.gpg"
```

**Retention**: 30 days in S3, then auto-delete via lifecycle policy

---

## COMPLIANCE & LEGAL

### GDPR (EU)

✓ **Right to Access**: Users can export their data (future feature: `/export`)  
✓ **Right to Erasure**: `PURGE_DATA` flow implements "right to be forgotten"  
✓ **Data Minimization**: 30-day TTL enforces minimal retention  
✓ **Purpose Limitation**: Data only used for chat functionality  
✓ **Storage Limitation**: Auto-purge after defined periods  

**Article 17 (Right to Erasure)**:
- User can request deletion via `/purge`
- Data erased "without undue delay"
- Implementation: Immediate (Edge Function processes in <2s)

---

### CCPA (California)

✓ **Right to Delete**: Same as GDPR (PURGE_DATA)  
✓ **Right to Know**: Users can see all their data (via UI)  
✓ **No Sale**: Data never sold to third parties  

---

### Data Breach Response

**If database compromised**:

1. **Immediate**:
   - Rotate all API keys (Supabase, Redis, OpenAI)
   - Force-logout all users (invalidate JWTs)
   - Enable read-only mode on database

2. **Within 24 Hours**:
   - Assess breach scope (which tables accessed)
   - Notify affected users (email via Supabase Auth)
   - File breach report (GDPR: 72 hours, CCPA: 45 days)

3. **Within 72 Hours**:
   - Restore from backup if data corrupted
   - Implement additional security measures
   - Public disclosure (blog post)

4. **Long-term**:
   - Security audit (third-party)
   - Review RLS policies
   - Implement additional monitoring

---

## MONITORING & ALERTS

### Daily Purge Success/Failure

**Monitoring Query**:
```sql
-- Check if purge ran today
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-purge-expired-data')
  AND start_time::date = CURRENT_DATE
ORDER BY start_time DESC
LIMIT 1;
```

**Alert Conditions**:
- Job failed (status != 'succeeded')
- Job didn't run (no entry for today)
- Job took >5 minutes (performance issue)
- Deleted rows >1M (unexpected spike)

**Notification**:
```typescript
// Edge Function: /api/cron/purge-monitor
export async function GET() {
  const lastRun = await checkLastPurgeRun();
  
  if (!lastRun.success) {
    await sendAlert({
      to: 'admin@deepchat.app',
      subject: '[CRITICAL] Daily purge failed',
      body: `Purge job failed at ${lastRun.timestamp}. Error: ${lastRun.error}`,
    });
  }
  
  return Response.json({ status: 'ok' });
}
```

---

### Storage Growth Monitoring

**Query**:
```sql
-- Check database size
SELECT pg_database_size('postgres') / (1024*1024) AS size_mb;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_total_relation_size(schemaname||'.'||tablename) / (1024*1024) AS size_mb
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_mb DESC;
```

**Alert Threshold**:
- Database >400MB (approaching 500MB free tier limit)
- Single table >200MB (investigate purge effectiveness)

---

## USER COMMUNICATION

### Purge Confirmation Email

**Sent After PURGE_DATA**:

```
Subject: [DEEPCHAT] Data Purge Confirmed

Your data has been permanently deleted from Deepchat.

DELETED:
- All messages sent/received
- All room memberships
- All direct message threads
- All network node connections
- All AI conversation logs

RETAINED:
- Your UID: DW-XXXX-XXXX
- Password hash (for re-login)

You can still log in with your email and password. Your account will have a clean slate.

If you did not request this action, contact support immediately:
support@deepchat.app

---
Deepchat Privacy Team
https://deepchat.app/legal/privacy
```

---

### 30-Day Retention Notice

**Displayed on First Login**:

```
┌─────────────────────────────────────┐
│ [NOTICE] DATA_RETENTION_POLICY      │
│                                     │
│ All messages are automatically      │
│ deleted after 30 days.              │
│                                     │
│ This is permanent and cannot be     │
│ recovered. Do not use Deepchat for  │
│ critical or archival communication. │
│                                     │
│ Read full policy:                   │
│ /legal/privacy                      │
│                                     │
│ [I_UNDERSTAND]                      │
└─────────────────────────────────────┘
```

**Checkbox**: Required before first message send

---

## TESTING

### Test Auto-Purge (Staging)

```sql
-- Insert test message with past TTL
INSERT INTO messages (room_id, uid, body, created_at, ttl_at)
VALUES (
  'test-room-id',
  'DW-TEST-0001',
  'This should be purged',
  NOW() - INTERVAL '31 days',
  NOW() - INTERVAL '1 day'
);

-- Run purge manually
DELETE FROM messages WHERE ttl_at < NOW();

-- Verify deletion
SELECT * FROM messages WHERE uid = 'DW-TEST-0001'; -- Should return 0 rows
```

---

### Test Manual PURGE_DATA

```typescript
// Integration test
describe('PURGE_DATA', () => {
  it('deletes all user data', async () => {
    const testUID = 'DW-TEST-PURGE';
    
    // Create test data
    await createTestMessages(testUID);
    await createTestDMs(testUID);
    await createTestNodes(testUID);
    
    // Execute purge
    await supabase.rpc('purge_user_data', { target_uid: testUID });
    
    // Verify deletion
    const messages = await supabase.from('messages').select('*').eq('uid', testUID);
    expect(messages.data).toEqual([]);
    
    const dms = await supabase.from('dm_messages').select('*').eq('uid', testUID);
    expect(dms.data).toEqual([]);
    
    const nodes = await supabase.from('nodes').select('*').eq('owner_uid', testUID);
    expect(nodes.data).toEqual([]);
  });
});
```

---

## FUTURE ENHANCEMENTS

### Configurable Retention (Post-v1)

**User Preference**:
```typescript
interface RetentionSettings {
  message_ttl: 7 | 14 | 30 | 90; // days
  auto_purge_dms: boolean;
  export_before_purge: boolean;
}
```

**Implementation**: Store in `users.settings` JSONB column

---

### Export Before Purge

**Flow**:
1. User initiates PURGE_DATA
2. System generates JSON export of all data
3. User downloads export
4. After download confirmed, purge executes

**Format**:
```json
{
  "export_date": "2025-10-14T12:00:00Z",
  "uid": "DW-1A2B-3C4D",
  "messages": [...],
  "dms": [...],
  "nodes": [...]
}
```

---

### Scheduled Purge

**User Choice**: "Delete my account on [DATE]"

**Implementation**:
- Add `scheduled_deletion_at` column to `users`
- CRON job checks daily for users past deletion date
- Execute `purge_user_data()` + `delete_account()`




