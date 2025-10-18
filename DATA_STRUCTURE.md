# DATABASE SCHEMA & STRUCTURE

```
[DATA_SCHEMA] DEEPCHAT DATABASE STRUCTURE v1.0
════════════════════════════════════════════════════════════
```

## OVERVIEW

**Database**: PostgreSQL 15+ (Supabase)  
**Schema**: `public` (default)  
**Extensions**: `uuid-ossp`, `pgcrypto`

---

## TABLES

### 1. users

**Purpose**: Core user profiles (UID-based identity)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uid` | TEXT | PRIMARY KEY | Format: DW-XXXX-XXXX (generated) |
| `email` | TEXT | UNIQUE, NOT NULL | Hidden from SELECT (RLS) |
| `nickname` | TEXT | UNIQUE, NOT NULL | 3-16 chars, public identifier |
| `avatar` | TEXT | NULL | Pixel/ASCII art URL or data URI |
| `theme` | TEXT | DEFAULT 'classic_green' | UI theme preference |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |
| `last_login_at` | TIMESTAMPTZ | NULL | Updated on each login |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_users_uid ON users(uid);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
```

**Triggers**:
```sql
-- Auto-generate UID on insert
CREATE TRIGGER set_uid_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  WHEN (NEW.uid IS NULL)
  EXECUTE FUNCTION set_uid();

-- Update last_login_at on auth
CREATE TRIGGER update_last_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_user_last_login();
```

**Privacy Notes**:
- `email` never returned in `SELECT` queries (RLS enforced)
- Use `users_public` view for safe queries

---

### 2. rooms

**Purpose**: Chat rooms (public and private)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `type` | TEXT | CHECK IN ('public', 'private') | Room visibility |
| `name` | TEXT | NOT NULL | 3-50 chars |
| `description` | TEXT | NULL | Max 200 chars |
| `created_by` | TEXT | FK → users(uid) | Room creator UID |
| `key_hash` | TEXT | NULL | bcrypt hash (private rooms only) |
| `last_activity_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated on message send |
| `ttl_at` | TIMESTAMPTZ | NULL | Auto-delete after inactivity (10 days) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Room creation timestamp |

**Indexes**:
```sql
CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
CREATE INDEX idx_rooms_last_activity ON rooms(last_activity_at);
```

**Triggers**:
```sql
-- Set TTL for private rooms (10 days from creation)
CREATE TRIGGER set_private_room_ttl
  BEFORE INSERT ON rooms
  FOR EACH ROW
  WHEN (NEW.type = 'private')
  EXECUTE FUNCTION set_room_ttl();

-- Update last_activity_at on message insert
CREATE TRIGGER update_room_activity
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_room_last_activity();
```

**Constraints**:
```sql
ALTER TABLE rooms
  ADD CONSTRAINT check_private_has_key
  CHECK (type = 'public' OR (type = 'private' AND key_hash IS NOT NULL));
```

---

### 3. members

**Purpose**: Room membership (many-to-many: users ↔ rooms)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `room_id` | UUID | FK → rooms(id) ON DELETE CASCADE | Room reference |
| `uid` | TEXT | FK → users(uid) ON DELETE CASCADE | User reference |
| `role` | TEXT | CHECK IN ('admin', 'member') | Admin = creator or promoted |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Membership start time |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_members_unique ON members(room_id, uid);
CREATE INDEX idx_members_room ON members(room_id);
CREATE INDEX idx_members_uid ON members(uid);
```

**Constraints**:
```sql
-- Room creator is automatically admin
ALTER TABLE members
  ADD CONSTRAINT creator_is_admin
  CHECK (
    role = 'admin' OR
    NOT EXISTS (
      SELECT 1 FROM rooms
      WHERE id = room_id AND created_by = uid
    )
  );
```

---

### 4. messages

**Purpose**: Room chat messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `room_id` | UUID | FK → rooms(id) ON DELETE CASCADE | Room reference |
| `uid` | TEXT | FK → users(uid) ON DELETE SET NULL | Author UID (nullable for deleted users) |
| `body` | TEXT | NOT NULL, CHECK(length(body) <= 2000) | Message content (max 2000 chars) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |
| `ttl_at` | TIMESTAMPTZ | NOT NULL | Auto-delete after 30 days |

**Indexes**:
```sql
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_ttl ON messages(ttl_at);
CREATE INDEX idx_messages_uid ON messages(uid);
```

**Triggers**:
```sql
-- Auto-set TTL (30 days from creation)
CREATE TRIGGER set_message_ttl
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_ttl_30_days();

CREATE FUNCTION set_ttl_30_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ttl_at := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Realtime Configuration**:
```sql
-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

### 5. dm_threads

**Purpose**: Direct message threads (1-on-1 conversations)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thread creation time |

**Indexes**:
```sql
CREATE INDEX idx_dm_threads_created ON dm_threads(created_at DESC);
```

---

### 6. dm_participants

**Purpose**: Thread participants (exactly 2 per thread)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `thread_id` | UUID | FK → dm_threads(id) ON DELETE CASCADE | Thread reference |
| `uid` | TEXT | FK → users(uid) ON DELETE CASCADE | Participant UID |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_dm_participants_unique ON dm_participants(thread_id, uid);
CREATE INDEX idx_dm_participants_uid ON dm_participants(uid);
```

**Constraints**:
```sql
-- Exactly 2 participants per thread
CREATE FUNCTION check_dm_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM dm_participants WHERE thread_id = NEW.thread_id) >= 2 THEN
    RAISE EXCEPTION 'DM thread cannot have more than 2 participants';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_two_participants
  BEFORE INSERT ON dm_participants
  FOR EACH ROW
  EXECUTE FUNCTION check_dm_participant_count();
```

---

### 7. dm_messages

**Purpose**: Direct messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `thread_id` | UUID | FK → dm_threads(id) ON DELETE CASCADE | Thread reference |
| `uid` | TEXT | FK → users(uid) ON DELETE SET NULL | Author UID |
| `body` | TEXT | NOT NULL, CHECK(length(body) <= 2000) | Message content |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |
| `ttl_at` | TIMESTAMPTZ | NOT NULL | Auto-delete after 30 days |

**Indexes**:
```sql
CREATE INDEX idx_dm_messages_thread_created ON dm_messages(thread_id, created_at DESC);
CREATE INDEX idx_dm_messages_ttl ON dm_messages(ttl_at);
```

**Triggers**:
```sql
-- Same TTL trigger as messages
CREATE TRIGGER set_dm_message_ttl
  BEFORE INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_ttl_30_days();
```

**Realtime**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
```

---

### 8. nodes

**Purpose**: Network connections (friend requests/contacts)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `owner_uid` | TEXT | FK → users(uid) ON DELETE CASCADE | Request sender |
| `peer_uid` | TEXT | FK → users(uid) ON DELETE CASCADE | Request receiver |
| `status` | TEXT | CHECK IN ('pending', 'accepted', 'blocked') | Connection state |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Request timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Status change timestamp |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_nodes_unique ON nodes(owner_uid, peer_uid);
CREATE INDEX idx_nodes_peer ON nodes(peer_uid);
CREATE INDEX idx_nodes_status ON nodes(status);
```

**Constraints**:
```sql
-- Cannot request self
ALTER TABLE nodes
  ADD CONSTRAINT no_self_connection
  CHECK (owner_uid != peer_uid);
```

**Triggers**:
```sql
-- Auto-delete pending requests after 72 hours
CREATE FUNCTION cleanup_pending_requests()
RETURNS VOID AS $$
BEGIN
  DELETE FROM nodes
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '72 hours';
END;
$$ LANGUAGE plpgsql;

-- Called by CRON job (see RETENTION_PURGE.md)
```

---

### 9. ai_sessions

**Purpose**: AI conversation session tracking (metadata only, no content)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Session ID (client-generated) |
| `uid` | TEXT | FK → users(uid) ON DELETE CASCADE | User UID |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | Session start |
| `ttl_at` | TIMESTAMPTZ | NOT NULL | Auto-delete after 1 hour |

**Indexes**:
```sql
CREATE INDEX idx_ai_sessions_uid ON ai_sessions(uid);
CREATE INDEX idx_ai_sessions_ttl ON ai_sessions(ttl_at);
```

**Notes**:
- **No conversation content stored in DB** (Redis only)
- This table tracks session existence for rate limiting
- Auto-purged after 1 hour

---

### 10. purge_logs

**Purpose**: Audit trail for data purge actions (minimal, hashed)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Log entry ID |
| `uid_hash` | TEXT | NOT NULL | SHA-256 hash of UID (irreversible) |
| `action` | TEXT | CHECK IN ('purge_data', 'delete_account') | Action type |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |

**Indexes**:
```sql
CREATE INDEX idx_purge_logs_timestamp ON purge_logs(timestamp DESC);
```

**Privacy**:
- UID stored as SHA-256 hash (cannot reverse to identify user)
- Used for abuse detection, not user tracking
- Auto-purged after 30 days

---

## VIEWS

### users_public

**Purpose**: Safe user query view (no email exposure)

```sql
CREATE VIEW users_public AS
SELECT
  uid,
  nickname,
  avatar,
  theme,
  created_at
FROM users;
```

**Usage**: All client-side queries should use this view, never `users` directly

---

## FUNCTIONS

### generate_uid()

```sql
CREATE OR REPLACE FUNCTION generate_uid()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- 34 chars (no I, O for clarity)
  result TEXT := 'DW-';
  random_char TEXT;
BEGIN
  FOR i IN 1..8 LOOP
    IF i = 5 THEN
      result := result || '-';
    END IF;
    random_char := substr(chars, floor(random() * length(chars))::int + 1, 1);
    result := result || random_char;
  END LOOP;
  
  -- Collision check
  IF EXISTS (SELECT 1 FROM users WHERE uid = result) THEN
    RETURN generate_uid(); -- Recursive retry
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

### purge_user_data(target_uid TEXT)

```sql
CREATE OR REPLACE FUNCTION purge_user_data(target_uid TEXT)
RETURNS VOID AS $$
BEGIN
  -- Delete messages
  DELETE FROM messages WHERE uid = target_uid;
  
  -- Delete DMs
  DELETE FROM dm_messages WHERE uid = target_uid;
  
  -- Remove DM thread participation
  DELETE FROM dm_participants WHERE uid = target_uid;
  
  -- Delete orphaned threads (no participants left)
  DELETE FROM dm_threads
  WHERE id NOT IN (SELECT DISTINCT thread_id FROM dm_participants);
  
  -- Leave rooms
  DELETE FROM members WHERE uid = target_uid;
  
  -- Remove network nodes
  DELETE FROM nodes WHERE owner_uid = target_uid OR peer_uid = target_uid;
  
  -- Delete AI session records (content in Redis auto-expires)
  DELETE FROM ai_sessions WHERE uid = target_uid;
  
  -- Update user profile to "clean slate" (keep UID + auth)
  UPDATE users
  SET
    nickname = 'PURGED_' || substring(target_uid from 4),
    avatar = NULL
  WHERE uid = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## RELATIONSHIPS DIAGRAM

```
users (uid)
  ↓
  ├─→ rooms (created_by) [1:many]
  ├─→ members (uid) [many:many via rooms]
  ├─→ messages (uid) [1:many]
  ├─→ dm_participants (uid) [many:many via dm_threads]
  ├─→ dm_messages (uid) [1:many]
  ├─→ nodes (owner_uid, peer_uid) [many:many self-join]
  └─→ ai_sessions (uid) [1:many]

rooms (id)
  ↓
  ├─→ members (room_id) [many:many via users]
  └─→ messages (room_id) [1:many]

dm_threads (id)
  ↓
  ├─→ dm_participants (thread_id) [1:2 exactly]
  └─→ dm_messages (thread_id) [1:many]
```

---

## STORAGE ESTIMATES

**Assumptions**: 10,000 active users, 100 public rooms, 1,000 private rooms

| Table | Rows | Avg Size | Total Size |
|-------|------|----------|------------|
| users | 10,000 | 500 bytes | ~5 MB |
| rooms | 1,100 | 300 bytes | ~330 KB |
| members | 50,000 | 100 bytes | ~5 MB |
| messages (30-day) | 1,000,000 | 500 bytes | ~500 MB |
| dm_threads | 5,000 | 50 bytes | ~250 KB |
| dm_participants | 10,000 | 50 bytes | ~500 KB |
| dm_messages (30-day) | 200,000 | 500 bytes | ~100 MB |
| nodes | 20,000 | 100 bytes | ~2 MB |
| ai_sessions | 100 (1h window) | 100 bytes | ~10 KB |
| purge_logs (30-day) | 500 | 150 bytes | ~75 KB |

**Total**: ~612 MB (fits comfortably in Supabase Free tier's 500MB with purging)

---

## MIGRATION STRATEGY

### Initial Schema

**File**: `supabase/migrations/00001_initial_schema.sql`

```sql
-- Create tables in dependency order
CREATE TABLE users (...);
CREATE TABLE rooms (...);
CREATE TABLE members (...);
CREATE TABLE messages (...);
CREATE TABLE dm_threads (...);
CREATE TABLE dm_participants (...);
CREATE TABLE dm_messages (...);
CREATE TABLE nodes (...);
CREATE TABLE ai_sessions (...);
CREATE TABLE purge_logs (...);

-- Create indexes
-- Create triggers
-- Create functions
-- Create views
-- Set up RLS policies (see RLS_SECURITY.md)
```

### Future Migrations

**Example**: `00002_add_room_tags.sql`

```sql
ALTER TABLE rooms ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_rooms_tags ON rooms USING GIN(tags);
```

**Rollback**: Always include rollback SQL in comments

```sql
-- ROLLBACK:
-- ALTER TABLE rooms DROP COLUMN tags;
```

---

## BACKUP & RESTORE

### Automated Backups (Supabase Pro)

- **Frequency**: Daily
- **Retention**: 7 days (Pro tier)
- **Format**: pg_dump
- **Encryption**: At rest (AES-256)

### Manual Backup

```bash
# Export schema + data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres \
  --clean --if-exists --no-owner --no-acl \
  > deepchat_backup_$(date +%Y%m%d).sql

# Compress
gzip deepchat_backup_$(date +%Y%m%d).sql

# Upload to S3 (encrypted)
aws s3 cp deepchat_backup_$(date +%Y%m%d).sql.gz \
  s3://deepchat-backups/ \
  --sse AES256
```

### Restore

```bash
# Download from S3
aws s3 cp s3://deepchat-backups/deepchat_backup_20251014.sql.gz .

# Decompress
gunzip deepchat_backup_20251014.sql.gz

# Restore (WARNING: Drops existing data)
psql -h db.xxx.supabase.co -U postgres -d postgres \
  < deepchat_backup_20251014.sql
```

---

## PERFORMANCE OPTIMIZATION

### Query Optimization

**Slow Query Example** (fetch room messages):
```sql
-- BAD (no index on created_at)
SELECT * FROM messages
WHERE room_id = 'xxx'
ORDER BY created_at DESC
LIMIT 50;
```

**Optimized** (composite index):
```sql
-- Index already created: idx_messages_room_created
-- Postgres uses: Index Scan Backward on idx_messages_room_created
```

### Connection Pooling

**Supabase default**: PgBouncer (transaction mode)
- Max connections: 15 (Free tier)
- Pooled connections: 200

**Client-side**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit Realtime events
    },
  },
});
```

### Partitioning (Future, if >10M messages)

```sql
-- Partition messages by month
CREATE TABLE messages_2025_10 PARTITION OF messages
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE messages_2025_11 PARTITION OF messages
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Auto-create partitions via cron
```

---

## DATA INTEGRITY CHECKS

### Orphaned Records

```sql
-- Check for messages in deleted rooms
SELECT COUNT(*) FROM messages m
WHERE NOT EXISTS (SELECT 1 FROM rooms r WHERE r.id = m.room_id);

-- Cleanup (should never happen due to ON DELETE CASCADE)
DELETE FROM messages m
WHERE NOT EXISTS (SELECT 1 FROM rooms r WHERE r.id = m.room_id);
```

### Constraint Violations

```sql
-- Check DM threads with != 2 participants
SELECT thread_id, COUNT(*) as participant_count
FROM dm_participants
GROUP BY thread_id
HAVING COUNT(*) != 2;
```

---

## TESTING

### Seed Data (Development)

```sql
-- Insert test users
INSERT INTO users (uid, email, nickname) VALUES
  ('DW-TEST-0001', 'alice@example.com', 'Alice'),
  ('DW-TEST-0002', 'bob@example.com', 'Bob'),
  ('DW-TEST-0003', 'charlie@example.com', 'Charlie');

-- Create test room
INSERT INTO rooms (id, type, name, created_by) VALUES
  (gen_random_uuid(), 'public', 'Test Lounge', 'DW-TEST-0001');

-- Add members
INSERT INTO members (room_id, uid, role)
SELECT id, 'DW-TEST-0001', 'admin' FROM rooms WHERE name = 'Test Lounge'
UNION ALL
SELECT id, 'DW-TEST-0002', 'member' FROM rooms WHERE name = 'Test Lounge';
```

### Truncate (Reset Dev DB)

```sql
TRUNCATE TABLE
  users,
  rooms,
  members,
  messages,
  dm_threads,
  dm_participants,
  dm_messages,
  nodes,
  ai_sessions,
  purge_logs
CASCADE;
```




