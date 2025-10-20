# Database Migrations

All database migrations for Deepchat project, organized chronologically.

## Migration Order

Run these migrations in order in Supabase SQL Editor:

### Initial Setup
```sql
1. FINAL_COMPLETE_SETUP.sql          -- Core database schema (users, rooms, messages, etc.)
```

### Feature Additions (October 2025)
```sql
2. 20251015000001_dm_notifications.sql    -- DM notification system with unread counts
3. 20251015000002_fix_dm_recursion.sql    -- Fix infinite recursion in dm_participants policy
4. 20251015000003_message_edit_delete.sql -- Add updated_at columns and UPDATE policies
5. 20251015000004_message_reactions.sql   -- Message reactions (+1, -1, ?, !, fire)
6. 20251015000005_block_system.sql        -- Block/unblock user functionality
7. 20251015000006_self_destruct.sql       -- Self-destructing messages (5s-1h)
8. 20251015000007_performance.sql         -- Database indexes and optimization
```

## Quick Run (All at Once)

If starting fresh, you can run all migrations at once:

```bash
# Using Supabase CLI (if installed)
supabase db reset
```

Or manually in Supabase Dashboard SQL Editor:
1. Copy each file's contents
2. Paste and run in order
3. Check for success messages

## Features Per Migration

| Migration | Features Added |
|-----------|----------------|
| `FINAL_COMPLETE_SETUP.sql` | Users, Rooms, Messages, DMs, Nodes, RLS policies |
| `dm_notifications` | Unread count view, read receipts |
| `fix_dm_recursion` | Policy optimization |
| `message_edit_delete` | Edit messages (1 min window) |
| `message_reactions` | +1, -1, ?, !, 🔥 reactions |
| `block_system` | Block/unblock users |
| `self_destruct` | Timed message deletion |
| `performance` | 15+ indexes for speed |

## Rollback

To rollback a specific migration, drop the tables/functions it created.

Example for reactions:
```sql
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS dm_message_reactions CASCADE;
```

## Notes

- All migrations use `IF NOT EXISTS` for idempotency
- Can be run multiple times safely
- RLS is enabled on all tables
- Indexes improve query performance significantly

Last updated: October 15, 2025









