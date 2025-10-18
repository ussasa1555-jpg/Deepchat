# 🤖 Groq AI Setup Guide - Oracle 7.0

## Quick Setup (5 minutes)

### Step 1: Get Groq API Key

1. Go to: https://console.groq.com/keys
2. Sign up with Google/GitHub (free)
3. Click **"Create API Key"**
4. Copy your key: `gsk_...`

**Free Tier Benefits:**
- ✅ 14,400 requests per day
- ✅ 30 requests per minute
- ✅ Llama 3.1 70B model (very fast!)
- ✅ No credit card required

---

### Step 2: Add to Environment Variables

Create `.env.local` file in project root:

```env
GROQ_API_KEY=gsk_your_actual_key_here
```

---

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

### Step 4: Test Oracle!

1. Go to: http://localhost:3000/oracle
2. Type a message: "What is the meaning of existence?"
3. ✅ Get real AI response!

---

## Troubleshooting

### "ORACLE_OFFLINE" Error

**Cause:** API key not configured

**Solution:**
1. Check `.env.local` exists
2. Verify `GROQ_API_KEY=gsk_...` is set
3. Restart server: `npm run dev`

---

### "Rate Limit Exceeded" Error

**Cause:** Too many requests (30/min limit)

**Solution:**
- Wait 60 seconds
- Free tier: 30 req/min, 14,400 req/day
- Upgrade: https://console.groq.com/settings/limits

---

### "Network Error"

**Cause:** Cannot reach Groq API

**Solution:**
1. Check internet connection
2. Verify firewall settings
3. Try again in 30 seconds

---

## API Route Details

**Endpoint:** `POST /api/oracle/chat`

**Request:**
```json
{
  "message": "Your question here"
}
```

**Response:**
```json
{
  "reply": "AI response in retro format",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  "model": "llama-3.1-70b-versatile"
}
```

---

## Model Options

Groq offers multiple models. To change:

**In:** `app/api/oracle/chat/route.ts`

```typescript
// Current (best for Oracle):
model: 'llama-3.1-70b-versatile'

// Alternatives:
model: 'llama-3.1-8b-instant'      // Faster, less powerful
model: 'mixtral-8x7b-32768'        // Good balance
model: 'gemma-7b-it'               // Lightweight
```

---

## Cost Comparison

| Service | Free Tier | Model | Speed |
|---------|-----------|-------|-------|
| **Groq** | ✅ 14.4k/day | Llama 3.1 70B | ⚡ 300 tok/s |
| OpenAI | ❌ $18 credit | GPT-4 | 🐢 50 tok/s |
| Anthropic | ❌ $5 credit | Claude 3 | 🐢 40 tok/s |
| Google | ✅ 60/min | Gemini Pro | 🚀 150 tok/s |

**Winner:** Groq (free + fastest!)

---

## Rate Limits

**Free Tier:**
- 30 requests per minute
- 14,400 requests per day
- No concurrent limit

**If you need more:**
- Contact: https://console.groq.com/settings/limits
- Consider caching responses
- Implement user-based rate limiting

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to Git
- API key is server-side only (safe)
- User auth checked before API call
- No API key exposed to frontend

---

## Alternative: OpenAI

If you prefer OpenAI instead of Groq:

1. Get key: https://platform.openai.com/api-keys
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
3. Update `app/api/oracle/chat/route.ts`:

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [/* same structure */],
  }),
});
```

---

## Production Deployment

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Add: `GROQ_API_KEY` = `gsk_...`
3. Redeploy

**Other Platforms:**
- Set environment variable in dashboard
- Ensure `.env.local` is in `.gitignore`

---

## Support

**Groq:**
- Docs: https://console.groq.com/docs
- Discord: https://discord.gg/groq
- Status: https://status.groq.com

**Deepchat:**
- Check console logs: Browser DevTools → Console
- API logs: Terminal where `npm run dev` is running

---

**Enjoy your AI-powered Oracle! 🤖✨**


