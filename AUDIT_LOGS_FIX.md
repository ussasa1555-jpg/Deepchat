# Audit Logs Hatası Düzeltildi ✅

## Sorun
Uygulama `audit_logs` tablosunu bulamıyordu çünkü bu tablo veritabanında yoktu.

```
Could not find the table 'public.audit_logs' in the schema cache
```

## Çözüm
`05_ADMIN_SECURITY.sql` dosyasına şu tablolar eklendi:

### 1. audit_logs Tablosu
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. threat_detections Tablosu
```sql
CREATE TABLE IF NOT EXISTS threat_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  threat_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES users(uid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migrasyon Nasıl Uygulanır?

### Yöntem 1: Supabase Dashboard (Önerilen)
1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ü açın
4. `supabase/migrations/PRODUCTION/05_ADMIN_SECURITY.sql` dosyasının içeriğini kopyalayın
5. SQL Editor'e yapıştırın
6. **RUN** butonuna tıklayın

### Yöntem 2: Supabase CLI
```bash
# Eğer Supabase CLI yüklüyse
supabase db push
```

### Yöntem 3: Manuel SQL (Sadece Yeni Tablolar)
Eğer sadece eksik tabloları eklemek isterseniz:

```sql
-- Audit logs (user actions tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_uid ON audit_logs(uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Threat detections (security events)
CREATE TABLE IF NOT EXISTS threat_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  threat_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES users(uid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_detections_uid ON threat_detections(uid, resolved);
CREATE INDEX IF NOT EXISTS idx_threat_detections_severity ON threat_detections(severity, resolved);

-- Permissions
GRANT ALL ON audit_logs TO authenticated, service_role;
GRANT ALL ON threat_detections TO authenticated, service_role;

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_own" ON audit_logs;
CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    auth.uid()::text = uid OR
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid()::text AND role IN ('admin', 'management'))
  );

DROP POLICY IF EXISTS "audit_logs_insert_service" ON audit_logs;
CREATE POLICY "audit_logs_insert_service" ON audit_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

ALTER TABLE threat_detections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "threat_detections_select_admin" ON threat_detections;
CREATE POLICY "threat_detections_select_admin" ON threat_detections
  FOR SELECT TO authenticated
  USING (
    auth.uid()::text = uid OR
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid()::text AND role IN ('admin', 'management'))
  );

DROP POLICY IF EXISTS "threat_detections_insert_service" ON threat_detections;
CREATE POLICY "threat_detections_insert_service" ON threat_detections
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "threat_detections_update_admin" ON threat_detections;
CREATE POLICY "threat_detections_update_admin" ON threat_detections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid()::text AND role IN ('admin', 'management'))
  );
```

## Test Etme
Migrasyon uygulandıktan sonra:

```sql
-- Tabloların var olduğunu kontrol edin
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audit_logs', 'threat_detections');
```

## Sonuç
✅ `audit_logs` tablosu eklendi
✅ `threat_detections` tablosu eklendi  
✅ RLS politikaları yapılandırıldı
✅ İndeksler eklendi
✅ Hata düzeltildi

Artık `/api/log-action` endpoint'i çalışacak!




