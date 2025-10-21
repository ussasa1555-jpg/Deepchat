# 🚀 Deepchat Database Setup Instructions

## 📋 Overview

Bu setup 3 adımda yapılacak:
1. **STEP 1**: Tabloları oluştur (RLS KA PALI)
2. **TEST**: Her şeyin çalıştığını doğrula
3. **STEP 2**: RLS'yi aktif et

---

## ⚡ STEP 1: Tabloları Oluştur (RLS Kapalı)

### 1️⃣ Supabase Dashboard → SQL Editor

### 2️⃣ `CLEAN_SETUP_STEP1.sql` dosyasını aç ve **TÜM içeriğini** kopyala

### 3️⃣ SQL Editor'e yapıştır ve **RUN** butonuna tıkla

### 4️⃣ Bekle (~5-10 saniye)

### 5️⃣ Sonuçları Kontrol Et

En altta şunu görmelisin:
```
✅ STEP 1 COMPLETE: Tables created, RLS DISABLED
```

Ve bir tablo göreceksin:
```
tablename | rowsecurity
----------|------------
members   | false
messages  | false
rooms     | false
users     | false
```

**Hepsi `false` olmalı** - Bu doğru! RLS henüz kapalı.

---

## 🧪 TEST: Her Şey Çalışıyor mu?

### 1️⃣ Yeni bir SQL Editor sekmesi aç

### 2️⃣ `TEST_SCRIPT.sql` dosyasını aç

### 3️⃣ **HER TESTİ TEK TEK** çalıştır (hepsini birden değil!)

```sql
-- İlk önce TEST 1'i kopyala ve çalıştır
SELECT '=== TEST 1: Tables ===' as test;
SELECT tablename, rowsecurity as rls_enabled...
```

Sonuç OK ise, TEST 2'yi çalıştır, vs.

### 4️⃣ TEST 4, 5, 6'ya özel dikkat et

- **TEST 4**: User oluştur → OK olmalı
- **TEST 5**: Public room oluştur → OK olmalı  
- **TEST 6**: Private room oluştur → OK olmalı ✅

**Eğer TEST 6 BAŞARILI olursa → RLS kapalıyken çalışıyor demektir!**

---

## 🎯 APP'i Test Et (RLS Kapalı)

### 1️⃣ Tarayıcıyı TAMAMEN kapat (tüm sekmeler)

### 2️⃣ Yeni sekme aç, uygulamana git

### 3️⃣ Yeni bir hesap oluştur

### 4️⃣ Private room oluşturmayı dene

**SONUÇ:**
- ✅ **Çalıştı**: Mükemmel! Sorun RLS policy'lerindeydi. STEP 2'ye geç.
- ❌ **Hala hata var**: Console'daki (F12) tam hatayı bana gönder.

---

## 🔒 STEP 2: RLS'yi Aktif Et (Sadece APP çalışıyorsa!)

**⚠️ UYARI: APP'te private room oluşturma çalışmıyorsa STEP 2'yi ÇALIŞTIRMA!**

### 1️⃣ SQL Editor'de `CLEAN_SETUP_STEP2.sql` dosyasını aç

### 2️⃣ **TÜM içeriğini** kopyala ve çalıştır

### 3️⃣ Sonucu kontrol et

```
✅ STEP 2 COMPLETE: RLS ENABLED

tablename | rls_enabled | policy_count
----------|-------------|-------------
members   | true        | 4
messages  | true        | 3
rooms     | true        | 5
users     | true        | 1
```

Hepsi `true` olmalı!

### 4️⃣ Tekrar APP'i test et

- Tarayıcıyı kapat/aç
- Login ol
- Private room oluştur

**SONUÇ:**
- ✅ **Çalıştı**: Tebrikler! Her şey tamam! 🎉
- ❌ **Hata var**: RLS policy'lerinde problem var. Console hatasını gönder.

---

## 🆘 Sorun Giderme

### RLS Kapalıyken Çalışıyor, RLS Açıkken Çalışmıyor

Bu durumda policy'lerde sorun var. Bana şunu gönder:

```sql
-- Bu sorguyu çalıştır ve sonucu gönder
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'rooms' AND cmd = 'INSERT';
```

### RLS Kapalıyken de Çalışmıyor

Sorun RLS'de değil, başka bir yerde. Bana şunları gönder:

1. **Console hatasının tam metni** (F12 → Console)
2. **Hangi sayfada** hata oluyor? (registration, private room creation, etc.)
3. **TEST_SCRIPT.sql**'deki hangi test başarısız oluyor?

---

## 📊 Durum Kontrolü

Her zaman şu sorguyu çalıştırarak durumu görebilirsin:

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'rooms', 'members', 'messages')
ORDER BY tablename;
```

**İdeal durum:**
```
tablename | rls_enabled | policy_count
----------|-------------|-------------
members   | true        | 4
messages  | true        | 3
rooms     | true        | 5
users     | true        | 1
```

---

## ✅ Başarı Kriterleri

Her şey çalışıyor demek:

1. ✅ Yeni hesap oluşturabiliyorsun
2. ✅ Dashboard'da User ID ve Nickname görünüyor
3. ✅ Public room oluşturabiliyorsun
4. ✅ Private room oluşturabiliyorsun
5. ✅ Private room'da key görünüyor
6. ✅ Mesaj gönderebiliyorsun

Hepsi OK ise **TAMAMDIR!** 🎉

---

## 📝 Notlar

- SQL Editor'de `auth.uid()` her zaman NULL döner (service_role kullanır)
- Bu NORMAL ve sorun değildir
- App'ten gelen isteklerde `auth.uid()` doğru çalışır
- Her STEP sonrası tarayıcıyı kapat/aç yapmayı unutma














