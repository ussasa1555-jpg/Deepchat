# 📊 DEEPS ROOMS - ORGANIZED DATABASE MIGRATIONS

Bu klasördeki SQL dosyaları, **kategorilere göre organize edilmiş** database migration'larıdır.

Eski `supabase/migrations/` klasöründeki 30+ migration dosyası, mantıklı kategorilere ayrılarak 10 ana dosyada birleştirilmiştir.

---

## 🎯 **KURULUM SIRASI (ÖNEMLİ!)**

Database'i kurmak için bu SQL dosyalarını **TAM OLARAK BU SIRAYLA** Supabase SQL Editor'da çalıştırın:

### **SIRA 1: Temizlik**
```sql
00_DROP_AND_CLEAN.sql
```
**⚠️ UYARI:** Tüm verileri siler! Sadece yeni kurulum veya tam reset için!

---

### **SIRA 2: Temel Kurulum (3 PARÇA)**

**⚠️ ÖNEMLİ:** 01_BASE_SETUP.sql çok büyük olduğu için 3 parçaya ayrıldı!

#### **SIRA 2A: Tables & Indexes**
```sql
01A_TABLES_AND_INDEXES.sql
```
**İçerik:** Core tablolar ve indexler
- users, rooms, members, messages
- dm_threads, dm_participants, dm_messages
- nodes (friends), ai_sessions, purge_logs
- 13 performance index

**⏰ Süre:** ~15-20 saniye

#### **SIRA 2B: Functions & Triggers**
```sql
01B_FUNCTIONS_AND_TRIGGERS.sql
```
**İçerik:** Fonksiyonlar ve trigger'lar
- handle_new_user(), update_user_last_login()
- add_room_creator_as_member(), check_room_member_limit()
- 7 fonksiyon, 7 trigger

**⏰ Süre:** ~10 saniye

#### **SIRA 2C: Permissions, RLS & Realtime**
```sql
01C_PERMISSIONS_RLS_REALTIME.sql
```
**İçerik:** İzinler, RLS policies, Realtime
- GRANT permissions
- 20+ RLS policy
- Realtime enabled
- Auth users sync

**⏰ Süre:** ~15-20 saniye

**📖 Detaylı bilgi:** `01_BASE_SETUP_README.md`

---

### **🔧 INSTANT FIX (Eğer kayıt hatası alıyorsan):**
```sql
FIX_AUDIT_LOGS_NOW.sql
```
**Ne zaman:** Kayıt sırasında "permission denied for table audit_logs" hatası alırsan

**İçerik:**
- audit_logs için GRANT permissions
- RLS policies düzeltmesi
- Kayıt sorununun anında çözümü

**⏰ Süre:** ~5 saniye

**📝 Not:** Bu dosya opsiyoneldir, sadece sorun yaşıyorsan çalıştır!

---

### **SIRA 3: DM Sistemi**
```sql
02_DM_SYSTEM.sql
```
**İçerik:**
- DM Notifications (unread counts)
- DM Recursion fix
- DM Reports support (reports tablosu varsa)

**⏰ Süre:** ~10 saniye

**⚠️ Not:** reports tablosu henüz yok, uyarı göreceksin (normal!)

---

### **SIRA 4: Mesaj Özellikleri**
```sql
03_MESSAGE_FEATURES.sql
```
**İçerik:**
- Message Edit/Delete (updated_at tracking)
- Message Reactions (+1, -1)
- Self-Destructing Messages

**⏰ Süre:** ~15 saniye

---

### **SIRA 5: Sosyal Özellikler**
```sql
04_SOCIAL_FEATURES.sql
```
**İçerik:**
- Block/Unblock Users
- Check if user is blocked

**⏰ Süre:** ~5 saniye

---

### **SIRA 6: Güvenlik & 2FA**
```sql
05_SECURITY_2FA.sql
```
**İçerik:**
- Two-Factor Authentication (2FA/TOTP)
- E2E Encryption support
- HMAC Authentication
- Audit Logging
- Threat Detection
- Session Security
- Encryption Key Management

**⏰ Süre:** ~20 saniye

---

### **SIRA 7: Admin Sistemi**
```sql
06_ADMIN_SYSTEM.sql
```
**İçerik:**
- 3-Tier Role System (user, admin, management)
- Admin Quotas & Rate Limiting
- Admin Timeouts (Suspensions)
- Admin Actions (Comprehensive logging)
- User Bans
- Reports System
- Management Alerts
- IP Whitelist/Bans
- System Announcements
- Admin Metrics

**⏰ Süre:** ~30 saniye

---

### **SIRA 8: Oda Özellikleri**
```sql
07_ROOM_FEATURES.sql
```
**İçerik:**
- Room Lock System (soft/temporary/permanent)
- Private Room Key Storage (Management recovery)
- Admin Chat Room (auto-add admins)

**⏰ Süre:** ~15 saniye

---

### **SIRA 9: Analitik**
```sql
08_ANALYTICS.sql
```
**İçerik:**
- User Analytics View
- Room Analytics View
- User IP History View
- System Statistics Function
- Activity Timeline
- Get User Details
- Get Room Details

**⏰ Süre:** ~20 saniye

---

### **SIRA 10: Düzeltmeler & RLS**
```sql
09_FIXES_AND_RLS.sql
```
**İçerik:**
- Reports RLS Policies (re-enable)
- Function search_path fixes (security)

**⏰ Süre:** ~5 saniye

---

### **SIRA 11: Final Optimizasyon**
```sql
10_FINAL_OPTIMIZATION.sql
```
**İçerik:**
- Performance Indexes
- Analyze Tables (query planner)

**⏰ Süre:** ~10 saniye

---

## ⏱️ **TOPLAM KURULUM SÜRESİ**

**~3-5 dakika** (tüm dosyalar sırayla çalıştırıldığında)

---

## 📝 **NASIL KULLANILIR?**

### **Yöntem 1: Supabase SQL Editor (TAVSİYE EDİLİR)**

1. https://supabase.com/dashboard → Projenizi seçin
2. Sol menüden "SQL Editor" tıklayın
3. Her SQL dosyasını **sırayla** açın, kopyalayın, yapıştırın, "Run" tıklayın
4. Her dosya tamamlandıktan sonra bir sonrakine geçin
5. Hata alırsanız, hata mesajını kontrol edin ve tekrar deneyin

### **Yöntem 2: Supabase CLI (İleri Seviye)**

```bash
# Her dosyayı sırayla çalıştır
supabase db push --include-migrations ORGANIZED/00_DROP_AND_CLEAN.sql
supabase db push --include-migrations ORGANIZED/01_BASE_SETUP.sql
supabase db push --include-migrations ORGANIZED/02_DM_SYSTEM.sql
# ... devamı
```

---

## ⚠️ **ÖNEMLİ NOTLAR**

### **1. SIRALAMA ÇOK ÖNEMLİ!**
Dosyaları **mutlaka belirtilen sırayla** çalıştırın. Sıra değişirse dependency hataları alırsınız!

### **2. 00_DROP_AND_CLEAN.sql**
Bu dosya **TÜM VERİLERİ SİLER**! Sadece yeni kurulum veya tam reset için kullanın.

### **3. 01_BASE_SETUP.sql**
En büyük dosya (~620 satır). 60-90 saniye bekleyin, timeout olmasın!

### **4. Function Search Path**
Yeni kurulum yapıyorsanız, tüm fonksiyonlar zaten `SET search_path = public` ile oluşturulur. Eski bir database'i güncelliyorsanız, `FIX_FUNCTION_SEARCH_PATH.sql` dosyasını ayrıca çalıştırmanız gerekebilir.

### **5. RLS Policies**
Tüm tablolar için RLS policies otomatik olarak oluşturulur. Manuel ayar gerekmez.

---

## 🔍 **KURULUM SONRASI KONTROL**

### **1. Tabloları Kontrol Et**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Görmeli sin:**
- users
- profiles
- rooms
- messages
- dm_messages
- dm_threads
- dm_participants
- nodes (friends)
- members
- reports
- admin_actions
- user_bans
- blocked_users
- message_reactions
- audit_logs
- threat_detections
- private_room_keys
- ve daha fazlası... (toplam ~25 tablo)

---

### **2. Fonksiyonları Kontrol Et**

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

**Görmeli sin:**
- handle_new_user
- mark_dm_thread_as_read
- get_unread_dm_count
- is_user_banned
- is_admin_suspended
- lock_room
- unlock_room
- get_system_stats
- ve daha fazlası... (toplam ~30+ fonksiyon)

---

### **3. İlk Kullanıcı Oluştur**

Local'de test et:
```
http://localhost:3000/auth/register
```

Email + Şifre ile kayıt ol.

**✅ Başarılı olursa:** Database kurulumu tamamdır!

---

## 🛠️ **SORUN GİDERME**

### **Hata: "relation does not exist"**

**Sebep:** Dosyalar yanlış sırada çalıştırılmış.

**Çözüm:** 
1. `00_DROP_AND_CLEAN.sql` çalıştır (temizle)
2. Tüm dosyaları baştan, doğru sırayla çalıştır

---

### **Hata: "policy already exists"**

**Sebep:** Aynı migration zaten çalıştırılmış.

**Çözüm:**
```sql
-- Önce mevcut policy'yi sil
DROP POLICY IF EXISTS policy_adı ON tablo_adı;

-- Sonra migration'ı tekrar çalıştır
```

---

### **Hata: "function already exists"**

**Sebep:** Fonksiyon zaten var.

**Çözüm:** Migration'lar zaten `CREATE OR REPLACE FUNCTION` kullanır, bu yüzden sorun olmamalı. Eğer hata alıyorsanız, migration'ı tekrar çalıştırmayı deneyin.

---

## 📚 **EK KAYNAKLAR**

- **FINAL_COMPLETE_SETUP.sql:** Eski, tek dosya versiyonu (yedek olarak saklanır)
- **FIX_FUNCTION_SEARCH_PATH.sql:** Eski database'ler için function güncelleme
- **Diğer migration dosyaları:** Referans için saklanır, artık kullanılmaz

---

## 🎉 **KURULUM TAMAMLANDI!**

Tüm migration'ları başarıyla çalıştırdıysanız, **Deeps Rooms** database'iniz hazır!

**Şimdi:**
1. ✅ Local'de kayıt ol (http://localhost:3000/auth/register)
2. ✅ İlk admin kullanıcısını SQL ile oluştur
3. ✅ Uygulamayı test et
4. ✅ Vercel'e deploy et
5. ✅ Kullanmaya başla!

---

**Hazırlayan:** Deeps Rooms Team  
**Versiyon:** v0.0.8 Beta  
**Tarih:** Ekim 2025

