# 🎯 BASE SETUP - 3 PARÇALI KURULUM

**01_BASE_SETUP.sql** çok büyük olduğu için (621 satır) **3 parçaya ayrıldı**.

---

## ⚠️ **ÖNEMLİ: SIRALAMA**

Bu dosyaları **TAM OLARAK BU SIRAYLA** çalıştır:

```
1️⃣ 01A_TABLES_AND_INDEXES.sql       (~150 satır, ~15 saniye)
2️⃣ 01B_FUNCTIONS_AND_TRIGGERS.sql   (~180 satır, ~10 saniye)
3️⃣ 01C_PERMISSIONS_RLS_REALTIME.sql (~300 satır, ~20 saniye)
```

**Toplam süre:** ~45-60 saniye

---

## 📋 **PART A: TABLES & INDEXES**

### **İçerik:**
- DROP (temizlik)
- CREATE TABLES (users, rooms, messages, dm_messages, nodes, etc.)
- CREATE INDEXES (performance)

### **Test:**
```sql
-- Tablolar oluşturuldu mu?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**✅ Beklenen:** 9 tablo (users, rooms, members, messages, dm_threads, dm_participants, dm_messages, nodes, ai_sessions, purge_logs)

---

## 📋 **PART B: FUNCTIONS & TRIGGERS**

### **İçerik:**
- CREATE FUNCTIONS (handle_new_user, set_ttl_30_days, check_room_member_limit, etc.)
- CREATE TRIGGERS (on_auth_user_created, add_creator_to_room, enforce_room_member_limit, etc.)

### **Test:**
```sql
-- Fonksiyonlar oluşturuldu mu?
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**✅ Beklenen:** 7 fonksiyon

```sql
-- Trigger'lar oluşturuldu mu?
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

**✅ Beklenen:** 7 trigger

---

## 📋 **PART C: PERMISSIONS, RLS & REALTIME**

### **İçerik:**
- CREATE VIEW (users_public)
- GRANT PERMISSIONS
- ENABLE RLS
- CREATE RLS POLICIES (~20 policy)
- ENABLE REALTIME
- SYNC EXISTING AUTH USERS

### **Test:**
```sql
-- RLS enabled mi?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**✅ Beklenen:** Tüm tablolarda `rowsecurity = true`

```sql
-- Policies oluşturuldu mu?
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**✅ Beklenen:** Her tabloda 2-5 policy

---

## 🧪 **FİNAL TEST (TÜM PARÇALAR TAMAMLANDIKTAN SONRA)**

### **1. Tablolar Kontrolü**
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

**✅ Beklenen:** 9+ tablo

---

### **2. Fonksiyonlar Kontrolü**
```sql
SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';
```

**✅ Beklenen:** 7+ fonksiyon

---

### **3. İlk Kayıt Dene**

```
http://localhost:3000/auth/register

Email: test@test.com
Şifre: Test1234!
```

**✅ Beklenen:** Kayıt başarılı, dashboard'a yönlendirilir

---

### **4. Kullanıcı Kontrol Et**
```sql
SELECT uid, email, nickname FROM users ORDER BY created_at DESC LIMIT 1;
```

**✅ Beklenen:** Yeni kayıt edilen kullanıcı görünür

---

## ❌ **SORUN GİDERME**

### **Hata: "relation does not exist"**

**Sebep:** Parçalar yanlış sırada çalıştırıldı.

**Çözüm:**
1. `00_DROP_AND_CLEAN.sql` çalıştır (temizle)
2. 01A → 01B → 01C sırasıyla tekrar çalıştır

---

### **Hata: "function already exists"**

**Sebep:** 01B tekrar çalıştırıldı.

**Çözüm:** Sorun yok, `CREATE OR REPLACE` kullanıyor, devam et.

---

### **Hata: "policy already exists"**

**Sebep:** 01C tekrar çalıştırıldı.

**Çözüm:**
```sql
-- Tüm policy'leri sil
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
-- (diğer policy'ler...)

-- 01C'yi tekrar çalıştır
```

---

## 🎉 **BAŞARILI KURULUM**

Eğer 3 parçayı da başarıyla çalıştırdıysan:

```
✅ 9+ tablo oluşturuldu
✅ 7+ fonksiyon oluşturuldu
✅ 7+ trigger oluşturuldu
✅ 20+ RLS policy oluşturuldu
✅ Realtime enabled
✅ Kayıt çalışıyor

🎯 SONRAKİ ADIM: 02_DM_SYSTEM.sql
```

---

**Not:** Eski `01_BASE_SETUP.sql` dosyası hala orada (yedek). Ama artık 01A, 01B, 01C kullan!



