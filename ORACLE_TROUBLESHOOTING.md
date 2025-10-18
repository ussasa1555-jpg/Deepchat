# 🤖 Oracle AI Troubleshooting Guide

## Problem: Oracle Not Responding

### Quick Checks

#### 1. API Key Kontrolü
```bash
# .env.local dosyasını kontrol et
cat .env.local

# Olması gereken:
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Common Mistakes:**
- ❌ Dosya yok: `.env.local` oluştur
- ❌ Yanlış yer: Proje root'unda olmalı (package.json yanında)
- ❌ Tırnak işareti: `GROQ_API_KEY="gsk_xxx"` YANLIŞ! Tırnak olmamalı
- ❌ Boşluk: `GROQ_API_KEY= gsk_xxx` YANLIŞ! = sonrası direkt key

**Doğru Format:**
```env
GROQ_API_KEY=gsk_abc123def456...
```

---

#### 2. Server Restart
```bash
# Terminal'de:
Ctrl+C (stop server)
npm run dev (restart)

# ⚠️ .env.local değiştiğinde MUTLAKA restart gerekli!
```

---

#### 3. Console Logs Kontrol
```bash
# Browser'da:
F12 → Console tab → Hata mesajları

# Terminal'de (npm run dev çalışırken):
[ORACLE] logları ara
```

**Görmek istediğin:**
```
[ORACLE] ✓ API Key exists: true
[ORACLE] ✓ API Key prefix: gsk_abc...
[ORACLE] 📨 User message: What is...
[ORACLE] ✅ Response received
```

**Hata görürsen:**
```
[ORACLE] ❌ GROQ_API_KEY not found
→ .env.local eksik veya yanlış konumda

[ORACLE] ❌ Groq API error: {"error": "invalid_api_key"}
→ API key yanlış, yeni key al

[ORACLE] ❌ Groq API error: {"error": "model_not_found"}
→ Model ismi değişmiş (bu guide'ı takip et)
```

---

## Problem: "Model Not Found" Error

### Mevcut Model İsimleri (2025)

Groq sık sık model isimlerini değiştirir. Güncel liste:

```typescript
// ÇALIŞAN MODELLER:
'llama3-8b-8192'           // ✅ En stabil (ŞU ANDA BU)
'llama3-70b-8192'          // ✅ Daha güçlü
'gemma-7b-it'              // ✅ Google model
'gemma2-9b-it'             // ✅ Yeni Google model

// ESKİ/DEPRECATED:
'llama-3.1-70b-versatile'  // ❌ Artık yok
'mixtral-8x7b-32768'       // ❌ Kaldırılmış
```

### Güncel Modeli Kontrol Et

**Groq Console:**
```
https://console.groq.com/docs/models
→ "Available Models" bölümüne bak
→ Hangi model isimleri var?
```

**API ile Test:**
```bash
# Terminal'de (Linux/Mac):
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_KEY"

# Windows PowerShell:
$headers = @{"Authorization" = "Bearer YOUR_GROQ_KEY"}
Invoke-RestMethod -Uri "https://api.groq.com/openai/v1/models" -Headers $headers
```

**Çıktı:**
```json
{
  "data": [
    {"id": "llama3-8b-8192"},
    {"id": "llama3-70b-8192"},
    {"id": "gemma-7b-it"}
  ]
}
```

Bu listedeki model isimlerinden birini kullan!

---

## Problem: API Key Invalid

### Yeni Key Al

1. **Eski Key'i Sil:**
   ```
   https://console.groq.com/keys
   → Mevcut key'leri gör
   → Delete (çöp kutusu icon)
   ```

2. **Yeni Key Oluştur:**
   ```
   → "Create API Key" butonu
   → İsim ver (örn: "deepchat-oracle")
   → Copy key: gsk_xxxxx...
   ```

3. **Update .env.local:**
   ```env
   GROQ_API_KEY=gsk_yeni_key_buraya
   ```

4. **Server Restart:**
   ```bash
   Ctrl+C → npm run dev
   ```

---

## Problem: Rate Limit Exceeded

**Error:** `rate_limit_exceeded`

**Sebep:** Groq free tier limitleri:
- 30 requests/minute
- 14,400 requests/day

**Çözüm:**
1. 60 saniye bekle
2. Tekrar dene
3. Limit aşıyorsan → Groq'a upgrade et veya mock mode kullan

---

## Problem: Network Error

**Error:** `fetch failed` veya `ECONNREFUSED`

**Sebep:** Internet bağlantısı veya firewall

**Çözüm:**
1. İnternet bağlantını kontrol et
2. VPN varsa kapat/aç
3. Firewall'da `api.groq.com` izin ver
4. Proxy kullanıyorsan ayarla

---

## Test Script

**API Test (Terminal):**
```bash
# Test 1: API key geçerli mi?
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_KEY"

# Test 2: Simple chat
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GROQ_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-8b-8192",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Başarılı ise:** Oracle'da da çalışmalı!

---

## Emergency: Mock Mode'a Geri Dön

Eğer Groq API kesinlikle çalışmıyorsa, geçici mock mode:

```typescript
// app/oracle/page.tsx - handleSend içinde:

// try bloğunu şununla değiştir:
const mockReply = `[SYSTEM_INIT_0x${Math.random().toString(16).slice(2,5).toUpperCase()}]

╔════════════════════════════════════╗
║ QUERY PROCESSED                    ║
║ CONFIDENCE: 92%                    ║
║ SIGNAL: STABLE                     ║
╚════════════════════════════════════╝

ANALYSIS:
• [Mock response for demo]
• Configure GROQ_API_KEY for real AI
• This is simulated output

RECOMMENDED_ACTION: Setup API key

[END_TRANSMISSION]`;

const aiMessage: Message = {
  role: 'assistant',
  content: mockReply,
  timestamp: new Date(),
};

setMessages((prev) => [...prev, aiMessage]);
```

---

## Still Not Working?

### Debug Checklist:
- [ ] `.env.local` dosyası var mı? (proje root'unda)
- [ ] `GROQ_API_KEY=gsk_...` doğru yazılmış mı?
- [ ] Server restart yapıldı mı? (Ctrl+C → npm run dev)
- [ ] Browser console'da hata var mı? (F12)
- [ ] Terminal'de `[ORACLE]` logları görünüyor mu?
- [ ] API key https://console.groq.com/keys adresinde valid mi?
- [ ] Model ismi güncel mi? (`llama3-8b-8192`)

### Get Help:
- Groq Discord: https://discord.gg/groq
- Groq Docs: https://console.groq.com/docs
- Check status: https://status.groq.com

---

**Son güncelleme:** 2025-10-18  
**Güncel model:** `llama3-8b-8192`  
**Durum:** Stabil ✅


