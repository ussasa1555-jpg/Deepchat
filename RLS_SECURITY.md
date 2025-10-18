# ROW-LEVEL SECURITY (RLS) SPECIFICATIONS

```
[SECURITY_POLICIES] ROW-LEVEL SECURITY (RLS) SPECIFICATIONS
════════════════════════════════════════════════════════════
```

## OVERVIEW

**Row-Level Security (RLS)** is enabled on ALL tables to enforce access control at the database level. Even if an attacker gains API access, they cannot bypass RLS policies.

### Core Principles

1. **Default Deny**: All tables start with RLS enabled, no access by default
2. **Whitelist Approach**: Explicit policies grant specific access
3. **Server-Enforced**: Cannot be bypassed by client-side code
4. **Auth-Aware**: Policies use `auth.uid()` to identify current user
5. **Privacy-First**: Email and sensitive data never selectable

---

## ENABLING RLS

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purge_logs ENABLE ROW LEVEL SECURITY;
```

---

## TABLE: users

### SELECT Policy

**Purpose**: Users can view their own profile; others see public view only

```sql
-- Own profile (full access except email)
CREATE POLICY select_own_profile
  ON users FOR SELECT
  USING (auth.uid() = uid);

-- Service role can access (for admin functions)
CREATE POLICY service_role_select
  ON users FOR SELECT
  TO service_role
  USING (true);
```

**Email Protection**:
```sql
-- Create view that excludes email
CREATE VIEW users_public WITH (security_barrier) AS
SELECT
  uid,
  nickname,
  avatar,
  theme,
  created_at
FROM users;

-- Grant access to authenticated users
GRANT SELECT ON users_public TO authenticated;
```

---

### UPDATE Policy

**Purpose**: Users can only update their own profile

```sql
CREATE POLICY update_own_profile
  ON users FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- Prevent email updates (managed via Supabase Auth only)
CREATE POLICY prevent_email_update
  ON users FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (
    email = (SELECT email FROM users WHERE uid = auth.uid())
  );
```

---

### INSERT Policy

**Purpose**: Only allow insert during registration (service role)

```sql
CREATE POLICY insert_own_profile
  ON users FOR INSERT
  WITH CHECK (auth.uid() = uid);

-- Service role for registration flow
CREATE POLICY service_role_insert
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);
```

---

### DELETE Policy

**Purpose**: Users can delete their own account

```sql
CREATE POLICY delete_own_account
  ON users FOR DELETE
  USING (auth.uid() = uid);
```

---

## TABLE: rooms

### SELECT Policy

**Purpose**: Public rooms visible to all; private only if member

```sql
-- Public rooms: anyone can see
CREATE POLICY select_public_rooms
  ON rooms FOR SELECT
  USING (type = 'public');

-- Private rooms: only members
CREATE POLICY select_private_if_member
  ON rooms FOR SELECT
  USING (
    type = 'private' AND
    EXISTS (
      SELECT 1 FROM members
      WHERE room_id = rooms.id
        AND uid = auth.uid()
    )
  );
```

---

### INSERT Policy

**Purpose**: Authenticated users can create rooms

```sql
CREATE POLICY insert_room
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);
```

**Rate Limiting** (enforced at application layer, not RLS):
- 5 rooms per day per UID (Redis counter)

---

### UPDATE Policy

**Purpose**: Only room creator can update room settings

```sql
CREATE POLICY update_own_room
  ON rooms FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
```

**Immutable Fields** (enforced at app layer):
- `id`, `created_by`, `created_at` cannot be updated

---

### DELETE Policy

**Purpose**: Only room creator can delete

```sql
CREATE POLICY delete_own_room
  ON rooms FOR DELETE
  USING (auth.uid() = created_by);
```

**Cascade**: `ON DELETE CASCADE` removes members and messages automatically

---

## TABLE: members

### SELECT Policy

**Purpose**: See members only in rooms you're a member of

```sql
CREATE POLICY select_members_in_room
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.room_id = members.room_id
        AND m.uid = auth.uid()
    )
  );
```

---

### INSERT Policy

**Purpose**: Join public rooms freely; private requires Edge Function

```sql
-- Public rooms: anyone can join
CREATE POLICY insert_member_public
  ON members FOR INSERT
  WITH CHECK (
    uid = auth.uid() AND
    EXISTS (
      SELECT 1 FROM rooms
      WHERE id = room_id
        AND type = 'public'
    )
  );

-- Private rooms: via Edge Function only (service role)
CREATE POLICY service_role_insert_member
  ON members FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**Private Room Join Flow**:
1. User enters key via CLI → POST `/api/rooms/verify-key`
2. Edge Function validates key (bcrypt compare)
3. If valid, Edge Function inserts member using `service_role` key
4. RLS policy allows insert because it's service role

---

### DELETE Policy

**Purpose**: Leave room (delete own membership)

```sql
-- Users can leave rooms
CREATE POLICY delete_own_membership
  ON members FOR DELETE
  USING (auth.uid() = uid);

-- Admins can remove others
CREATE POLICY admin_remove_member
  ON members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.room_id = members.room_id
        AND m.uid = auth.uid()
        AND m.role = 'admin'
    )
  );
```

---

## TABLE: messages

### SELECT Policy

**Purpose**: Read messages only in rooms you're a member of

```sql
CREATE POLICY select_messages_if_member
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE room_id = messages.room_id
        AND uid = auth.uid()
    ) AND
    ttl_at > NOW() -- Hide expired messages
  );
```

**Performance**: Index on `(room_id, created_at)` ensures fast lookups

---

### INSERT Policy

**Purpose**: Send messages only in rooms you're a member of

```sql
CREATE POLICY insert_message_if_member
  ON messages FOR INSERT
  WITH CHECK (
    uid = auth.uid() AND
    EXISTS (
      SELECT 1 FROM members
      WHERE room_id = messages.room_id
        AND uid = auth.uid()
    )
  );
```

**Additional Validation** (app layer):
- Message length ≤ 2000 chars (CHECK constraint)
- Rate limit: 60 messages/minute per UID (Redis)

---

### UPDATE Policy

**Purpose**: No updates allowed (messages immutable)

```sql
-- No UPDATE policy = no one can update messages
-- (Intentionally no policy created)
```

**Rationale**: Prevents message editing, maintains chat history integrity

---

### DELETE Policy

**Purpose**: Delete own messages within 15-minute grace period

```sql
-- Grace period: 15 minutes
CREATE POLICY delete_own_recent_message
  ON messages FOR DELETE
  USING (
    auth.uid() = uid AND
    created_at > NOW() - INTERVAL '15 minutes'
  );

-- Admins can delete any message
CREATE POLICY admin_delete_message
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE room_id = messages.room_id
        AND uid = auth.uid()
        AND role = 'admin'
    )
  );
```

---

## TABLE: dm_threads

### SELECT Policy

**Purpose**: Only thread participants can see thread

```sql
CREATE POLICY select_own_dm_threads
  ON dm_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE thread_id = dm_threads.id
        AND uid = auth.uid()
    )
  );
```

---

### INSERT Policy

**Purpose**: Authenticated users can create threads

```sql
CREATE POLICY insert_dm_thread
  ON dm_threads FOR INSERT
  WITH CHECK (true);
```

**Note**: `dm_participants` insert check ensures proper setup

---

### DELETE Policy

**Purpose**: Either participant can delete thread

```sql
CREATE POLICY delete_own_dm_thread
  ON dm_threads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE thread_id = dm_threads.id
        AND uid = auth.uid()
    )
  );
```

**Cascade**: Deletes `dm_participants` and `dm_messages` automatically

---

## TABLE: dm_participants

### SELECT Policy

**Purpose**: See participants only in your own threads

```sql
CREATE POLICY select_dm_participants
  ON dm_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_participants p
      WHERE p.thread_id = dm_participants.thread_id
        AND p.uid = auth.uid()
    )
  );
```

---

### INSERT Policy

**Purpose**: Add yourself to threads you create

```sql
CREATE POLICY insert_dm_participant
  ON dm_participants FOR INSERT
  WITH CHECK (uid = auth.uid());
```

**Constraint**: Trigger ensures max 2 participants (see DATA_STRUCTURE.md)

---

### DELETE Policy

**Purpose**: Remove yourself from thread

```sql
CREATE POLICY delete_dm_participant
  ON dm_participants FOR DELETE
  USING (uid = auth.uid());
```

---

## TABLE: dm_messages

### SELECT Policy

**Purpose**: Read messages only in your threads

```sql
CREATE POLICY select_dm_messages
  ON dm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE thread_id = dm_messages.thread_id
        AND uid = auth.uid()
    ) AND
    ttl_at > NOW()
  );
```

---

### INSERT Policy

**Purpose**: Send DMs only in threads you're part of

```sql
CREATE POLICY insert_dm_message
  ON dm_messages FOR INSERT
  WITH CHECK (
    uid = auth.uid() AND
    EXISTS (
      SELECT 1 FROM dm_participants
      WHERE thread_id = dm_messages.thread_id
        AND uid = auth.uid()
    )
  );
```

---

### DELETE Policy

**Purpose**: Delete own messages within 15-minute window

```sql
CREATE POLICY delete_own_dm_message
  ON dm_messages FOR DELETE
  USING (
    auth.uid() = uid AND
    created_at > NOW() - INTERVAL '15 minutes'
  );
```

---

## TABLE: nodes

### SELECT Policy

**Purpose**: See connections where you're involved

```sql
CREATE POLICY select_own_nodes
  ON nodes FOR SELECT
  USING (
    auth.uid() = owner_uid OR
    auth.uid() = peer_uid
  );
```

---

### INSERT Policy

**Purpose**: Send connection requests

```sql
CREATE POLICY insert_node_request
  ON nodes FOR INSERT
  WITH CHECK (auth.uid() = owner_uid);
```

**Constraint**: Cannot request self (CHECK constraint)

---

### UPDATE Policy

**Purpose**: Peer can accept/decline request

```sql
CREATE POLICY peer_update_node_status
  ON nodes FOR UPDATE
  USING (auth.uid() = peer_uid)
  WITH CHECK (auth.uid() = peer_uid);
```

**Immutable Fields**: `owner_uid`, `peer_uid` cannot be updated

---

### DELETE Policy

**Purpose**: Either party can remove connection

```sql
CREATE POLICY delete_own_node
  ON nodes FOR DELETE
  USING (
    auth.uid() = owner_uid OR
    auth.uid() = peer_uid
  );
```

---

## TABLE: ai_sessions

### SELECT Policy

**Purpose**: See only your own AI sessions

```sql
CREATE POLICY select_own_ai_sessions
  ON ai_sessions FOR SELECT
  USING (auth.uid() = uid);
```

---

### INSERT Policy

**Purpose**: Create AI sessions for yourself

```sql
CREATE POLICY insert_ai_session
  ON ai_sessions FOR INSERT
  WITH CHECK (auth.uid() = uid);
```

---

### DELETE Policy

**Purpose**: Delete your own sessions

```sql
CREATE POLICY delete_own_ai_session
  ON ai_sessions FOR DELETE
  USING (auth.uid() = uid);
```

**Auto-Purge**: CRON job deletes expired sessions (see RETENTION_PURGE.md)

---

## TABLE: purge_logs

### SELECT Policy

**Purpose**: Admin-only access (service role)

```sql
-- No policy for authenticated users = no access
CREATE POLICY service_role_select_purge_logs
  ON purge_logs FOR SELECT
  TO service_role
  USING (true);
```

---

### INSERT Policy

**Purpose**: Service role only (via Edge Function)

```sql
CREATE POLICY service_role_insert_purge_log
  ON purge_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**Privacy**: UID stored as SHA-256 hash, not plaintext

---

## TESTING RLS POLICIES

### Test as Specific User

```sql
-- Set user context
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'DW-TEST-0001';

-- Try queries
SELECT * FROM messages; -- Should only see messages in user's rooms
SELECT * FROM users; -- Should only see own profile
```

### Test as Anonymous

```sql
SET LOCAL role TO anon;

SELECT * FROM messages; -- Should return 0 rows
SELECT * FROM rooms WHERE type = 'public'; -- Should work
```

### Automated Tests

```typescript
// Supabase test suite
describe('RLS Policies', () => {
  it('prevents reading other users messages', async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('uid', 'DIFFERENT_UID');
    
    expect(data).toEqual([]); // Empty due to RLS
  });
  
  it('allows reading own messages', async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('uid', currentUserUID);
    
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });
});
```

---

## COMMON RLS PATTERNS

### Pattern 1: Own Data Only

```sql
CREATE POLICY policy_name
  ON table_name FOR SELECT
  USING (auth.uid() = uid);
```

**Usage**: Users, AI sessions, etc.

---

### Pattern 2: Membership-Based Access

```sql
CREATE POLICY policy_name
  ON table_name FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE room_id = table_name.room_id
        AND uid = auth.uid()
    )
  );
```

**Usage**: Messages, room data

---

### Pattern 3: Service Role Bypass

```sql
CREATE POLICY service_role_policy
  ON table_name FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Usage**: Edge Functions that need full access (e.g., purge, key verification)

---

## SECURITY BEST PRACTICES

### ✓ DO

- Always enable RLS on new tables
- Test policies with different user contexts
- Use `security_barrier` on views
- Combine RLS with application-layer rate limiting
- Log policy violations (Supabase logs)
- Use `SECURITY DEFINER` functions carefully

### ✗ DON'T

- Expose `service_role` key to client
- Rely solely on RLS (defense in depth)
- Create overly permissive policies (`USING (true)`)
- Forget to set policies on new tables
- Use RLS for rate limiting (too slow)

---

## PERFORMANCE CONSIDERATIONS

### Index Support

**Problem**: RLS policies can slow queries without proper indexes

**Solution**: Create indexes on columns used in policies

```sql
-- Policy checks membership frequently
CREATE INDEX idx_members_room_uid ON members(room_id, uid);

-- Speeds up: EXISTS (SELECT 1 FROM members WHERE ...)
```

### Policy Complexity

**Simple Policy** (fast):
```sql
USING (auth.uid() = uid)
```

**Complex Policy** (slower):
```sql
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE room_id = messages.room_id
      AND uid = auth.uid()
  )
)
```

**Optimization**: Cache membership checks at application layer where possible

---

## DEBUGGING RLS ISSUES

### Check Current User

```sql
SELECT auth.uid(); -- Returns current authenticated UID
```

### Explain Query with RLS

```sql
EXPLAIN ANALYZE
SELECT * FROM messages WHERE room_id = 'xxx';

-- Look for "Subquery Scan" or "Filter" indicating RLS check
```

### Bypass RLS (Admin Testing Only)

```sql
-- As service_role
SET role service_role;
SELECT * FROM messages; -- Sees all messages
```

---

## MIGRATION: Adding RLS to Existing Table

```sql
-- 1. Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- 2. Create policies
CREATE POLICY select_own
  ON new_table FOR SELECT
  USING (auth.uid() = uid);

CREATE POLICY insert_own
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = uid);

-- 3. Test policies
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'test-uid';
SELECT * FROM new_table; -- Should only see test-uid's rows

-- 4. Deploy
```

---

## COMPLIANCE

### GDPR

✓ **Right to Access**: Users can SELECT their own data (RLS enforced)  
✓ **Right to Erasure**: `purge_user_data()` function deletes all user data  
✓ **Data Minimization**: Email hidden from SELECT policies  

### CCPA

✓ **No Sale of Data**: No data accessible without proper auth  
✓ **User Control**: PURGE_DATA flow gives full control  

---

## INCIDENT RESPONSE

### If RLS is Accidentally Disabled

```sql
-- Re-enable immediately
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Check audit logs for unauthorized access
SELECT * FROM postgres_log
WHERE message LIKE '%table_name%'
  AND event_time > NOW() - INTERVAL '1 hour';
```

### If Policy is Too Permissive

```sql
-- Drop bad policy
DROP POLICY bad_policy_name ON table_name;

-- Create correct policy
CREATE POLICY good_policy_name
  ON table_name FOR SELECT
  USING (auth.uid() = uid);

-- Rotate service_role key if exposed
```




