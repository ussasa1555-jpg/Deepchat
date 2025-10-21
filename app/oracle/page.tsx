'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuotaInfo {
  used_seconds: number;
  remaining_seconds: number;
  limit_reached: boolean;
}

export default function OraclePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  
  // Fix: Client-only state to prevent hydration mismatch
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize client-only values after mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setSessionStart(new Date());
    setMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Real Groq API call
      const response = await fetch('/api/oracle/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use fallback message if provided, otherwise throw error
        if (data.fallback) {
          const aiMessage: Message = {
            role: 'assistant',
            content: data.fallback,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          return;
        }
        throw new Error(data.error || 'API request failed');
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // Update quota info
      if (data.quota) {
        setQuota(data.quota);
      }
    } catch (err: any) {
      console.error('[ORACLE] Error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: `[ERROR_500] CONNECTION_FAILED

╔════════════════════════════════════╗
║ ORACLE UNAVAILABLE                 ║
║ REASON: ${err.message?.slice(0, 22) || 'UNKNOWN'}... ║
╚════════════════════════════════════╝

POSSIBLE CAUSES:
• Network connection failure
• API key not configured
• Server not running

SETUP:
1. Get Groq API key: https://console.groq.com/keys
2. Add to .env.local: GROQ_API_KEY=gsk_...
3. Restart server: npm run dev

[END_TRANSMISSION]`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const sessionDuration = sessionStart 
    ? Math.floor((new Date().getTime() - sessionStart.getTime()) / 1000 / 60)
    : 0;

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center login-page">
        <div className="particles-container">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div className="text-center relative z-10">
          <p className="text-accent text-lg font-mono animate-pulse">[INITIALIZING_ORACLE_0.0.8...]</p>
          <p className="text-retro-gray text-sm font-mono mt-2">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      {/* Header */}
      <div className="border-b-2 border-accent bg-retro-black/80 backdrop-blur-sm p-6 relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center animate-pulse">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-accent">
                ORACLE
              </h1>
              <p className="text-accent/70 text-sm">
                Oracle Beta • Powered by Deeps Rooms
              </p>
            </div>
          </div>
          <Link href="/dashboard">
            <NeonButton variant="secondary">
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Dashboard</span>
              </span>
            </NeonButton>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Initial Message */}
          {messages.length === 0 && (
            <div className="border-2 border-retro-cyan p-4 bg-retro-dark-cyan/20">
              <p className="text-accent text-sm mb-2">[SYSTEM] Ephemeral session initiated</p>
              <p className="text-xs text-retro-gray">
                Session ID: {sessionId.slice(0, 8)}...
              </p>
              <p className="text-xs text-retro-gray mt-1">
                All conversations auto-purged after 1 hour.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role === 'user' ? '' : 'pl-4 border-l-2 border-retro-cyan'}>
              <div className="space-y-2">
                <p className="text-xs text-retro-gray">
                  {msg.timestamp.toLocaleTimeString()} • {msg.role === 'user' ? 'YOU' : 'ORACLE_0.0.8'}
                </p>
                <pre className="text-sm text-accent font-mono whitespace-pre-wrap">
                  {msg.content}
                </pre>
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="pl-4 border-l-2 border-retro-cyan">
              <p className="text-accent text-sm animate-pulse">
                [PROCESSING_QUERY...]
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t-2 border-accent bg-retro-black p-4">
        <div className="max-w-4xl mx-auto">
          {/* Quota Warning */}
          {quota && quota.remaining_seconds < 120 && (
            <div className="mb-3 p-2 border-2 border-retro-amber bg-retro-amber/10">
              <p className="text-retro-amber text-xs font-mono">
                ⚠️ LOW QUOTA: {Math.floor(quota.remaining_seconds / 60)}m {quota.remaining_seconds % 60}s remaining today
              </p>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1">
              <CLIInput
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  quota 
                    ? `${Math.floor(quota.remaining_seconds / 60)}m ${quota.remaining_seconds % 60}s remaining today...`
                    : "Enter query... (10 min daily limit)"
                }
                disabled={loading || (quota?.limit_reached ?? false)}
                maxLength={500}
                showCursor
              />
            </div>
            <NeonButton type="submit" disabled={loading || !input.trim() || (quota?.limit_reached ?? false)}>
              {loading ? '[...]' : '[QUERY]'}
            </NeonButton>
          </form>
        </div>
      </div>
    </div>
  );
}

