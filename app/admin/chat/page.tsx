'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import { RoleBadge } from '@/components/ui/RoleBadge';
import Link from 'next/link';

const ADMIN_ROOM_ID = '00000000-0000-0000-0000-000000000001';

interface Message {
  id: string;
  uid: string;
  body: string;
  created_at: string;
  users?: {
    nickname: string;
    role?: string;
  };
}

export default function AdminChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const init = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setCurrentUserUid(user.id);

      // Check role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('uid', user.id)
        .single();

      if (!userData || (userData.role !== 'admin' && userData.role !== 'management')) {
        router.push('/admin');
        return;
      }

      // Load messages
      await loadMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`admin-chat`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${ADMIN_ROOM_ID}`,
          },
          async (payload) => {
            console.log('[ADMIN_CHAT] New message:', payload);
            const newMsg = payload.new as Message;

            // Fetch with user details
            const { data } = await supabase
              .from('messages')
              .select(`*, users:uid (nickname, role)`)
              .eq('id', newMsg.id)
              .single();

            if (data) {
              setMessages((prev) => [...prev, data as Message]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('[ADMIN_CHAT] Init error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, users:uid (nickname, role)`)
        .eq('room_id', ADMIN_ROOM_ID)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('[ADMIN_CHAT] Load messages error:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserUid) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: ADMIN_ROOM_ID,
        uid: currentUserUid,
        body: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('[ADMIN_CHAT] Send error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen p-4 login-page">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-5xl mx-auto">
        <div className="terminal flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Header */}
          <div className="border-b-2 border-border pb-4 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl uppercase tracking-wider text-accent retro-title">Admin Command Center</h1>
                  <p className="text-accent/70 text-sm">Secure coordination for administrators</p>
                </div>
              </div>
              <Link href="/admin">
                <NeonButton variant="secondary">← Back</NeonButton>
              </Link>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4 mb-4 flex-shrink-0">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs text-accent/70">
                <p className="font-semibold text-accent mb-1">🛡️ SECURE ADMIN CHANNEL</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Only admins and management can access this room</li>
                  <li>All messages are logged and auditable</li>
                  <li>Use for coordination, announcements, and discussion</li>
                  <li>E2E encrypted like all Deeps Rooms chat rooms</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 bg-bg/30 border-2 border-border rounded-lg p-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-accent/50 py-8">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.uid === currentUserUid;
                  const isSystem = msg.uid === 'system';
                  const displayName = msg.users?.nickname || msg.uid;
                  const userRole = msg.users?.role || 'user';

                  return (
                    <div key={msg.id} className="log-line">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="timestamp text-xs">
                          {new Date(msg.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isSystem ? (
                          <span className="text-accent font-bold uppercase text-sm">[SYSTEM]</span>
                        ) : (
                          <>
                            <span
                              className={`uid font-semibold ${
                                isOwnMessage ? 'text-retro-magenta' : 'text-accent'
                              }`}
                            >
                              {displayName}
                            </span>
                            <RoleBadge role={userRole as any} short />
                          </>
                        )}
                        <span className="separator">&gt;</span>
                        <span className={`message ${isSystem ? 'text-accent/80 italic' : ''}`}>
                          {msg.body}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0">
            <div className="flex-1">
              <CLIInput
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type coordination message..."
                disabled={sending}
                maxLength={2000}
                showCursor
              />
            </div>
            <NeonButton type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? '[...]' : '[SEND]'}
            </NeonButton>
          </form>
          <p className="text-xs text-retro-gray mt-2 flex-shrink-0">
            ESC = clear • Admin-only channel • All messages logged
          </p>
        </div>
      </div>
    </div>
  );
}

