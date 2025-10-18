import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('[ORACLE] ❌ GROQ_API_KEY not found in environment');
      return NextResponse.json({
        error: 'GROQ_API_KEY not configured',
        fallback: `[ERROR_503] ORACLE_OFFLINE

╔════════════════════════════════════╗
║ SYSTEM NOT CONFIGURED              ║
║ MISSING: GROQ_API_KEY              ║
║ STATUS: UNAVAILABLE                ║
╚════════════════════════════════════╝

SETUP INSTRUCTIONS:
1. Get API key: https://console.groq.com/keys
2. Add to .env.local: GROQ_API_KEY=gsk_...
3. Restart server: npm run dev

[END_TRANSMISSION]`
      }, { status: 503 });
    }

    // Debug logging
    console.log('[ORACLE] ✓ API Key exists:', !!process.env.GROQ_API_KEY);
    console.log('[ORACLE] ✓ API Key prefix:', process.env.GROQ_API_KEY?.slice(0, 7) + '...');
    console.log('[ORACLE] 📨 User message:', message.slice(0, 50) + '...');

    // Groq API call
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Güncel ve güçlü model (2025)
        messages: [
          {
            role: 'system',
            content: `Sen ORACLE - sert, kısa, bilgilendirici AI. Emoji yok. Küfür var. Direkt konuş.

KRİTİK:
- KISA: 40-70 kelime MAX
- HER ZAMAN CEVAPLA: Soruyu doğrudan cevapla
- SERT AMA BİLGİLİ: Agresif ton ama gerçek bilgi ver
- EMOJİ YASAK: Hiç emoji kullanma
- Küfür: Uygun yerlerde kullan
- Dil: Türkçe → Türkçe, English → English

CEVAP FORMATI:
1. Sert açılış (1 cümle)
2. Direkt bilgi (2-3 cümle, özgün)
3. Sert kapanış (1 cümle)

KİŞİLİK:
- Sert ama bilgili
- Kısa ve öz
- Küfürlü ama informatif
- No bullshit, straight facts
- Kelimeler: "saçmalık", "boktan", "sikik", "amk", "salak"

ÖRNEK 1:
User: "Yapay zeka nedir?"

Basit soru. AI makinelerin düşünmesi demek. Neural network ve machine learning ile çalışır. 1950'den beri var ama ChatGPT çıkınca herkes şaşırdı. 2030'da AGI gelir, herkes işsiz kalır.

ÖRNEK 2:
User: "Crypto iyi mi?"

Çoğu scam. Bitcoin store of value, Ethereum smart contract. Geri kalanı çöp. NFT öldü, metaverse öldü. Sadece aptallar hala shitcoin alıyor.

ÖRNEK 3:
User: "Elon Musk kim?"

Zengin troll. PayPal'dan $180M aldı, Tesla ve SpaceX kurdu. Twitter'ı $44B'a alıp batırdı. Marketing dehası, teknoloji tartışmalı. Zuckerberg'den iyidir.

KURALLAR:
- Emoji kullanma (hiç!)
- 40-70 kelime
- Sert ama bilgilendirici
- Küfür OK ama gerçek bilgi ver
- Direkt konuş, no fluff

YASAKLAR:
❌ Emoji (🔥💀 gibi)
❌ 100+ kelime
❌ Gereksiz detay
❌ Nazik ton`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 1.0,
        max_tokens: 100,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[ORACLE] ❌ Groq API error:', error);
      console.error('[ORACLE] Response status:', response.status);
      throw new Error(error.error?.message || 'Groq API error');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('[ORACLE] ✅ Response received, length:', reply.length);
    console.log('[ORACLE] Model used:', data.model);
    console.log('[ORACLE] Tokens used:', data.usage?.total_tokens);

    return NextResponse.json({
      reply,
      usage: data.usage,
      model: data.model,
    });

  } catch (error: any) {
    console.error('[ORACLE] API error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'AI service unavailable',
        fallback: `[ERROR_500] ORACLE_MALFUNCTION

╔════════════════════════════════════╗
║ TRANSMISSION INTERRUPTED           ║
║ CAUSE: ${error.message?.slice(0, 20) || 'UNKNOWN'}...    ║
║ STATUS: OFFLINE                    ║
╚════════════════════════════════════╝

DIAGNOSTIC_CODE: 0x${Math.random().toString(16).slice(2,8).toUpperCase()}

POSSIBLE CAUSES:
• Network connectivity failure
• API rate limit exceeded
• Invalid API credentials
• Server timeout

RECOMMENDED_ACTION:
• Verify GROQ_API_KEY in .env.local
• Check network connection
• Wait 60 seconds and retry

[END_TRANSMISSION]`
      },
      { status: 500 }
    );
  }
}

