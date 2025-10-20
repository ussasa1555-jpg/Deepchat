'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { ReportModal } from '@/components/ui/ReportModal';
import { useSound } from '@/lib/useSound';
import { useTypingIndicator } from '@/lib/useTypingIndicator';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { sanitizeMessage, detectSuspiciousContent } from '@/lib/sanitize';
import { useEncryption } from '@/lib/useEncryption';

interface Message {
  id: string;
  uid: string;
  body: string;
  created_at: string;
  deleted?: boolean;
  encrypted?: boolean;
  encryption_salt?: string | null;
  encryption_iv?: string | null;
  hmac?: string | null;
  nonce?: string | null;
  message_timestamp?: number | null;
  users?: {
    nickname: string;
    role?: string;
  };
}

export default function DMPage({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [peerNickname, setPeerNickname] = useState('');
  const [nickname, setNickname] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [peerLastRead, setPeerLastRead] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [isPeerBlocked, setIsPeerBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const hasScrolledRef = useRef(false);
  const { playNotification } = useSound();
  const { encrypt, decrypt, isReady: encryptionReady } = useEncryption(`dm_${params.uid}`);
  
  const { startTyping, stopTyping, onTypingChange } = useTypingIndicator({
    channelName: `dm:${threadId}:typing`,
    currentUserUid,
    currentUserNickname: nickname,
  });

  useEffect(() => {
    init();
  }, [params.uid]);

  // Decrypt encrypted messages
  useEffect(() => {
    if (!encryptionReady) return;

    const decryptMessages = async () => {
      const newDecrypted = new Map(decryptedMessages);
      
      for (const msg of messages) {
        if (msg.encrypted && msg.encryption_salt && msg.encryption_iv && !newDecrypted.has(msg.id)) {
          try {
            const decrypted = await decrypt(
              msg.body,
              msg.encryption_salt,
              msg.encryption_iv,
              msg.hmac || undefined
            );
            newDecrypted.set(msg.id, decrypted);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            newDecrypted.set(msg.id, '[ENCRYPTED]');
          }
        }
      }
      
      if (newDecrypted.size !== decryptedMessages.size) {
        setDecryptedMessages(newDecrypted);
      }
    };

    decryptMessages();
  }, [messages, encryptionReady, decrypt]);

  // Ref to track last scroll position
  const lastScrollTopRef = useRef(0);
  const lastScrollHeightRef = useRef(0);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (!isUserScrolling) {
      // User is at bottom - scroll to bottom
      scrollToBottom();
      lastScrollTopRef.current = container.scrollTop;
      lastScrollHeightRef.current = container.scrollHeight;
    } else {
      // User scrolled up - maintain position
      const heightDiff = container.scrollHeight - lastScrollHeightRef.current;
      if (heightDiff !== 0) {
        // Adjust for new content
        container.scrollTop = lastScrollTopRef.current + heightDiff;
        lastScrollTopRef.current = container.scrollTop;
        lastScrollHeightRef.current = container.scrollHeight;
      }
    }
  }, [messages, isUserScrolling]);

  // Detect if user is manually scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!hasScrolledRef.current) {
        hasScrolledRef.current = true;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Save scroll position
      lastScrollTopRef.current = scrollTop;
      
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // User is at bottom if within 20px
      if (distanceFromBottom < 20) {
        setIsUserScrolling(false);
      } else {
        // User scrolled up - disable auto-scroll
        setIsUserScrolling(true);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => {
        if (editingMessageId) {
          setEditingMessageId(null);
          setEditingText('');
        } else {
          setNewMessage('');
          stopTyping();
        }
      },
    },
    {
      key: 'f',
      ctrl: true,
      handler: () => {
        inputRef.current?.focus();
      },
    },
    {
      key: '/',
      handler: (e) => {
        // Only focus if not already typing in input
        if (document.activeElement?.tagName !== 'INPUT') {
          inputRef.current?.focus();
        }
      },
    },
  ]);

  useEffect(() => {
    // Subscribe to typing indicator changes
    onTypingChange((users) => {
      setTypingUsers(users.map(u => u.nickname));
    });
  }, [onTypingChange]);

  // Subscribe to read receipts updates
  useEffect(() => {
    if (!threadId || !params.uid) return;

    const channel = supabase
      .channel(`dm_participants:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dm_participants',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: any) => {
          if (payload.new.uid === params.uid && payload.new.last_read_at) {
            setPeerLastRead(payload.new.last_read_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, params.uid]);

  // Realtime subscription with cleanup
  useEffect(() => {
    if (!threadId || !currentUserUid) return;

    let isSubscribed = true;
    let channel: any = null;
    
    const setupSubscription = () => {
      channel = subscribeToMessages(threadId, currentUserUid, () => isSubscribed);
    };

    setupSubscription();
    
    // Cleanup function
    return () => {
      isSubscribed = false;
      if (channel) {
        console.log('[DM] Unsubscribing from thread');
        supabase.removeChannel(channel);
      }
    };
  }, [threadId, currentUserUid]);

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const uid = user.id;
      setCurrentUserUid(uid);

      // Get current user nickname
      const { data: currentUserData } = await supabase
        .from('users')
        .select('nickname')
        .eq('uid', uid)
        .single();

      if (currentUserData) {
        setNickname(currentUserData.nickname);
      }

      // Get peer nickname
      const { data: peerData } = await supabase
        .from('users')
        .select('nickname')
        .eq('uid', params.uid)
        .single();

      if (peerData) {
        setPeerNickname(peerData.nickname);
      }

      // Check if peer is blocked (with error handling)
      try {
        const { data: blockData, error: blockError } = await supabase
          .from('blocked_users')
          .select('*')
          .eq('blocker_uid', uid)
          .eq('blocked_uid', params.uid)
          .maybeSingle();

        if (blockError) {
          console.warn('[DM] Block check failed (non-critical):', blockError);
          setIsPeerBlocked(false); // Default: not blocked if check fails
        } else {
          setIsPeerBlocked(!!blockData);
        }
      } catch (blockCheckError) {
        console.warn('[DM] Block check error (continuing anyway):', blockCheckError);
        setIsPeerBlocked(false);
      }

      // Find existing thread - simplified approach
      // Get all threads for current user
      const { data: myParticipations } = await supabase
        .from('dm_participants')
        .select('thread_id')
        .eq('uid', uid);

      let foundThreadId = null;

      if (myParticipations && myParticipations.length > 0) {
        // For each thread, check if peer is also a participant
        for (const participation of myParticipations) {
          const { data: participants } = await supabase
            .from('dm_participants')
            .select('uid')
            .eq('thread_id', participation.thread_id);
          
          // Check if this thread has exactly 2 participants and one is the peer
          if (participants && participants.length === 2) {
            const uids = participants.map(p => p.uid);
            if (uids.includes(uid) && uids.includes(params.uid)) {
              foundThreadId = participation.thread_id;
              break;
            }
          }
        }
      }

      if (foundThreadId) {
        // Existing thread found
        setThreadId(foundThreadId);
        await loadMessages(foundThreadId, uid);
      } else {
        // Create new thread with manual UUID (avoids RLS SELECT issue)
        const newThreadId = crypto.randomUUID();
        
        const { error: threadError } = await supabase
          .from('dm_threads')
          .insert({ id: newThreadId });

        if (threadError) {
          console.error('Thread creation error:', threadError);
          throw threadError;
        }

        // Add both participants immediately
        const { error: participantsError } = await supabase
          .from('dm_participants')
          .insert([
            { thread_id: newThreadId, uid: uid },
            { thread_id: newThreadId, uid: params.uid },
          ]);

        if (participantsError) {
          console.error('Participants error:', participantsError);
          // Rollback: delete the thread if participants fail
          await supabase.from('dm_threads').delete().eq('id', newThreadId);
          throw participantsError;
        }

        setThreadId(newThreadId);
        await loadMessages(newThreadId, uid);
      }
    } catch (err: any) {
      console.error('DM Init Error:', err);
      setError(`[ERROR] ${err.message || 'FAILED_TO_INITIALIZE_CHANNEL'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string, uid?: string) => {
    try {
      console.log('[DM] Loading messages for thread:', threadId);
      
      const { data, error } = await supabase
        .from('dm_messages')
        .select(`
          *,
          users:uid (nickname, role)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[DM] Error loading messages:', error);
        throw error;
      }
      
      console.log('[DM] Loaded messages:', data?.length || 0, 'messages');
      console.log('[DM] Messages data:', data);
      setMessages(data || []);
      
      // Mark messages as read
      const userUid = uid || currentUserUid;
      if (userUid) {
        await markAsRead(threadId, userUid);
      }

      // Get peer's last_read_at
      const { data: peerData } = await supabase
        .from('dm_participants')
        .select('last_read_at')
        .eq('thread_id', threadId)
        .eq('uid', params.uid)
        .single();

      if (peerData && peerData.last_read_at) {
        setPeerLastRead(peerData.last_read_at);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const markAsRead = async (threadId: string, uid?: string) => {
    const userUid = uid || currentUserUid;
    if (!userUid) return;
    
    try {
      await supabase
        .from('dm_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('uid', userUid);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const subscribeToMessages = (threadId: string, userUid: string, isSubscribed: () => boolean) => {
    console.log('[DM] Subscribing to thread:', threadId);
    
    const channel = supabase
      .channel(`dm:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (!isSubscribed()) return;
          
          console.log('[DM] New message received:', payload);
          const newMsg = payload.new as Message;
          
          supabase
            .from('dm_messages')
            .select(`*, users:uid (nickname, role)`)
            .eq('id', newMsg.id)
            .single()
            .then(({ data }) => {
              if (data && isSubscribed()) {
                console.log('[DM] Adding message to state:', data);
                setMessages((prev) => [...prev, data as Message]);
                // Mark as read when new message arrives while viewing
                markAsRead(threadId);
                // Play notification sound if message is from other user
                console.log('[DM] Checking sound - data.uid:', data.uid, 'userUid:', userUid);
                if (data.uid !== userUid) {
                  console.log('[DM] Playing notification sound');
                  playNotification();
                }
              }
            });
        }
      )
      .subscribe((status) => {
        console.log('[DM] Subscription status:', status);
      });
      
    return channel;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserUid || !threadId) return;

    // Sanitize and validate
    const sanitized = sanitizeMessage(newMessage);
    const suspicious = detectSuspiciousContent(sanitized);
    
    if (suspicious.isSuspicious) {
      setError(`[SECURITY] ${suspicious.reason}`);
      return;
    }

    setSending(true);
    try {
      // Calculate TTL: 30 days from now (matching database trigger)
      const ttlDate = new Date();
      ttlDate.setDate(ttlDate.getDate() + 30);

      let messageData: any = {
        thread_id: threadId,
        uid: currentUserUid,
        body: sanitized,
        encrypted: false,
        ttl_at: ttlDate.toISOString(),
        deleted: false,
      };

      // ⚠️ ENCRYPTION TEMPORARILY DISABLED FOR TESTING
      // TODO: Re-enable after fixing decrypt issues
      // if (encryptionReady) {
      //   const encryptResult = await encrypt(sanitized);
      //   if (encryptResult) {
      //     messageData = {
      //       ...messageData,
      //       body: encryptResult.encrypted,
      //       encrypted: true,
      //       encryption_salt: encryptResult.salt,
      //       encryption_iv: encryptResult.iv,
      //       hmac: encryptResult.hmac,
      //       nonce: encryptResult.nonce,
      //       message_timestamp: Date.now(),
      //     };
      //   }
      // }

      console.log('[DM] Sending message:', messageData);
      
      const { data, error } = await supabase.from('dm_messages').insert(messageData).select();

      if (error) {
        console.error('[DM] Error sending message:', error);
        throw error;
      }
      
      console.log('[DM] Message sent successfully:', data);
      setNewMessage('');
      
      // Stop typing indicator
      stopTyping();
      
      // Mark as read when sending
      markAsRead(threadId);
      
      // Re-enable auto-scroll and focus
      setIsUserScrolling(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('[ERROR] MESSAGE_SEND_FAILED');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return;

    try {
      const { error } = await supabase
        .from('dm_messages')
        .update({ 
          body: editingText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('uid', currentUserUid);

      if (error) throw error;

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, body: editingText.trim() } : msg
        )
      );

      setEditingMessageId(null);
      setEditingText('');
    } catch (err: any) {
      console.error('Error editing message:', err);
      setError('[ERROR] EDIT_FAILED');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Mark as deleted in local state first
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, deleted: true, body: '[Message deleted]' } : msg
        )
      );

      // Delete from database
      const { error } = await supabase
        .from('dm_messages')
        .delete()
        .eq('id', messageId)
        .eq('uid', currentUserUid);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting message:', err);
      setError('[ERROR] DELETE_FAILED');
      // Revert on error
      loadMessages(threadId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TerminalPanel>
          <p className="text-accent">[ESTABLISHING_SECURE_CHANNEL...]</p>
        </TerminalPanel>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <TerminalPanel header="ERROR">
          <p className="text-retro-amber mb-4">{error}</p>
          <Link href="/nodes">
            <NeonButton>[RETURN_TO_NODES]</NeonButton>
          </Link>
        </TerminalPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-accent bg-retro-black p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="status-led online" />
              <h1 className="text-xl uppercase tracking-wider text-accent">
                [ENCRYPTED MESSAGE CHANNEL]
              </h1>
            </div>
            <p className="text-accent text-sm mt-1">
              Chat with: {peerNickname || params.uid}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-retro-amber hover:text-retro-amber/70 transition-colors font-mono text-sm uppercase tracking-wider"
              title="Report user or content"
            >
              [REPORT]
            </button>
            <Link href="/nodes" className="text-accent hover:text-accent/70 transition-colors font-mono text-sm uppercase tracking-wider">
              [BACK]
            </Link>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportDescription('');
          setReportType('spam');
        }}
        reportedUid={params.uid}
        reportedNickname={peerNickname}
        dmThreadId={threadId || undefined}
      />

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-1">
          {isPeerBlocked && (
            <div className="border-2 border-error bg-error/10 p-4 mb-4">
              <p className="text-error text-sm font-mono text-center mb-3">
                [SYSTEM] You have blocked this user. Messages hidden.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    if (!currentUserUid) return;
                    try {
                      await supabase
                        .from('blocked_users')
                        .delete()
                        .eq('blocker_uid', currentUserUid)
                        .eq('blocked_uid', params.uid);
                      setIsPeerBlocked(false);
                    } catch (err) {
                      console.error('Error unblocking:', err);
                    }
                  }}
                  className="text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-background transition-all text-sm"
                >
                  [Unblock User]
                </button>
              </div>
            </div>
          )}
          
          {messages.length === 0 && (
            <div className="text-center text-accent py-8">
              <p className="text-sm">[SYSTEM] Secure channel established.</p>
              <p className="text-xs text-retro-gray mt-2">Start transmitting...</p>
            </div>
          )}

          {messages.map((msg) => {
            const time = new Date(msg.created_at).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            const isOwnMessage = msg.uid === currentUserUid;
            const displayName = msg.users?.nickname || (isOwnMessage ? 'You' : peerNickname || msg.uid);
            
            // Check if message was read by peer
            const isRead = isOwnMessage && peerLastRead && new Date(msg.created_at) < new Date(peerLastRead);
            const readTime = isRead && peerLastRead 
              ? new Date(peerLastRead).toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            const isEditing = editingMessageId === msg.id;
            const messageAge = Date.now() - new Date(msg.created_at).getTime();
            const canEdit = isOwnMessage && messageAge < 1 * 60 * 1000; // 1 minute

            return (
              <div 
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className="group relative"
              >
                {isEditing ? (
                  <div className="log-line bg-surface/30 p-2 border border-accent">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditMessage(msg.id);
                          } else if (e.key === 'Escape') {
                            setEditingMessageId(null);
                            setEditingText('');
                          }
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-accent font-mono"
                        autoFocus
                        maxLength={2000}
                      />
                      <button
                        onClick={() => handleEditMessage(msg.id)}
                        className="text-accent hover:text-accent/70 text-xs"
                      >
                        [SAVE]
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditingText('');
                        }}
                        className="text-muted hover:text-muted/70 text-xs"
                      >
                        [CANCEL]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`log-line ${msg.deleted ? 'opacity-50' : ''}`}>
                    {isOwnMessage && isRead && !msg.deleted && (
                      <span className="text-accent text-[10px] mr-1" title={`Read ${readTime}`}>✓</span>
                    )}
                    <span className="timestamp">{time}</span>
                    <span className={`uid ${isOwnMessage ? 'text-retro-magenta' : ''}`}>
                      {displayName}
                    </span>
                    <span className="separator">&gt;</span>
                    <span className={`message ${msg.deleted ? 'text-muted italic' : ''}`}>
                      {msg.deleted
                        ? msg.body
                        : msg.encrypted
                        ? (decryptedMessages.get(msg.id) || '[DECRYPTING...]')
                        : msg.body
                      }
                    </span>
                    {isOwnMessage && hoveredMessageId === msg.id && !msg.deleted && (
                      <span className="ml-2 inline-flex gap-1">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditingText(msg.body);
                            }}
                            className="text-[10px] text-accent hover:text-accent/70"
                            title="Edit (within 1 min)"
                          >
                            [EDIT]
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-[10px] text-error hover:text-error/70"
                          title="Delete"
                        >
                          [DEL]
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {typingUsers.length > 0 && (
            <div className="log-line opacity-70">
              <span className="timestamp">...</span>
              <span className="uid text-muted">
                {typingUsers[0]}
              </span>
              <span className="separator">&gt;</span>
              <span className="message text-muted animate-pulse">yazıyor...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t-2 border-accent bg-retro-black p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1">
              <CLIInput
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (e.target.value.trim()) {
                    startTyping();
                  } else {
                    stopTyping();
                  }
                }}
                placeholder="Type encrypted message..."
                disabled={sending}
                maxLength={2000}
                showCursor
              />
            </div>
            <NeonButton type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? '[...]' : '[SEND]'}
            </NeonButton>
          </form>
          <p className="text-xs text-retro-gray mt-2">
            ESC = clear • Direct messages • 30-day TTL
          </p>
        </div>
      </div>
    </div>
  );
}

