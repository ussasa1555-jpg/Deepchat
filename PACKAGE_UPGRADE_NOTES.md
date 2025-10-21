# Package Upgrade Notes

## ✅ Completed (v0.8.0)

### 1. Node.js Engine Version
- **Before:** `>=18.0.0` (auto-upgrade warning)
- **After:** `20.x` (fixed version)
- **Status:** ✅ FIXED
- **Impact:** No more auto-upgrade warnings on Vercel

### 2. Deprecated Indirect Dependencies
- **Added overrides:**
  - `rimraf`: `^5.0.5` (was v3.0.2)
  - `glob`: `^10.3.10` (was v7.1.7)
- **Status:** ✅ FIXED
- **Impact:** Reduced deprecation warnings

### 3. npm Configuration
- **Added:** `.npmrc` for cleaner installs
- **Status:** ✅ FIXED
- **Impact:** Faster, quieter deployments

---

## ⚠️ Pending (Requires Refactoring)

### 1. Supabase Auth Helpers (CRITICAL)
**Current:**
```json
"@supabase/auth-helpers-nextjs": "^0.8.7"
```

**Should be:**
```json
"@supabase/ssr": "^0.5.2"
```

**Why deprecated:** Supabase migrated to new SSR package for better Next.js App Router support.

**Impact:** 
- ❌ Current package is deprecated but still works
- ⚠️ Will eventually stop receiving security updates
- 🔄 Requires refactoring ALL auth code

**Files to update:**
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- All API routes using Supabase auth
- All pages using Supabase auth

**Migration Guide:**
https://supabase.com/docs/guides/auth/server-side/nextjs

**Estimated Time:** 4-6 hours

**Priority:** HIGH (but not urgent - works for now)

---

### 2. ESLint v8 → v9
**Current:**
```json
"eslint": "^8.56.0"
```

**Should be:**
```json
"eslint": "^9.0.0"
```

**Why deprecated:** ESLint v8 end-of-life

**Impact:**
- ⚠️ Depends on `eslint-config-next` compatibility
- 🔄 May require config file updates
- 📦 Next.js 14.0.4 officially supports ESLint 8

**Action:**
- Wait for Next.js update to v15+
- Or test ESLint 9 compatibility manually

**Estimated Time:** 1-2 hours

**Priority:** MEDIUM

---

### 3. Other Deprecated Dependencies (Low Priority)

These are indirect dependencies from other packages:
- `npmlog@5.0.1` - from npm itself
- `gauge@3.0.2` - from npm
- `are-we-there-yet@2.0.0` - from npm
- `inflight@1.0.6` - from glob (can't override)
- `@humanwhocodes/*` - from ESLint

**Action:** Will be automatically fixed when:
- npm updates its own dependencies
- ESLint v9 migration happens

**Priority:** LOW

---

## 🎯 Recommended Upgrade Path

### Phase 1: Safe Updates (Now) ✅ DONE
- [x] Fix Node.js engine version
- [x] Add package overrides
- [x] Create `.npmrc`

### Phase 2: Next.js Ecosystem (Next)
1. Update Next.js to v15.x (when stable)
2. Update ESLint to v9
3. Update TypeScript ESLint plugins

### Phase 3: Supabase Migration (Future)
1. Read Supabase SSR migration guide
2. Create new branch `refactor/supabase-ssr`
3. Update `@supabase/ssr`
4. Refactor auth code
5. Test thoroughly
6. Merge

---

## 📊 Current Deployment Status

**Vercel Build:** ✅ Working
**Deprecation Warnings:** Reduced (non-critical)
**Security:** ✅ No vulnerabilities
**Performance:** ✅ Optimal

---

## 🔗 Resources

- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [ESLint v9 Migration](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Vercel Node.js Versions](https://vercel.com/docs/functions/runtimes/node-js)

---

**Last Updated:** October 21, 2025
**Version:** 0.8.0

