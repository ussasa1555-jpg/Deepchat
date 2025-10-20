'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import { useSound } from '@/lib/useSound';
import { useTypingIndicator } from '@/lib/useTypingIndicator';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { UserProfileModal } from '@/components/ui/UserProfileModal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { formatMessage } from '@/lib/formatMessage';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { MessageSkeleton } from '@/components/ui/Skeleton';
import { sanitizeMessage, detectSuspiciousContent } from '@/lib/sanitize';
import { checkSpam, checkFloodProtection } from '@/lib/spamDetection';
import { useEncryption } from '@/lib/useEncryption';

interface Message {
  id: string;
  uid: string;
  body: string;
  created_at: string;
  self_destruct_at?: string | null;
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
  reactions?: Reaction[];
}

interface Reaction {
  id: string;
  message_id: string;
  uid: string;
  reaction: string;
  created_at: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  description: string | null;
  created_by: string;
  locked?: boolean;
  locked_reason?: string;
  locked_by?: string;
  locked_at?: string;
  lock_type?: string;
}

interface Member {
  uid: string;
  role: string;
  joined_at: string;
  users: {
    nickname: string;
  };
}

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
  const [selfDestructTime, setSelfDestructTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [showBannedUsers, setShowBannedUsers] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const hasScrolledRef = useRef(false);
  const { playNotification } = useSound();
  const toast = useToast();
  const { encrypt, decrypt, isReady: encryptionReady } = useEncryption(params.id);
  
  const { startTyping, stopTyping, onTypingChange } = useTypingIndicator({
    channelName: `room:${params.id}:typing`,
    currentUserUid,
    currentUserNickname: nickname,
  });

  useEffect(() => {
    init();
  }, [params.id]);

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
  }, [messages, isUserScrolling, currentTime]);

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

  // Update current time for countdown display
  useEffect(() => {
    // Only update if there are self-destruct messages
    const hasSelfDestruct = messages.some((m) => m.self_destruct_at && !m.deleted);
    if (!hasSelfDestruct) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Update time for countdown
      setCurrentTime(now);
      
      // Check and delete expired messages
      setMessages((prev) => {
        let hasChanges = false;
        
        const updated = prev.map((msg) => {
          if (msg.self_destruct_at && !msg.deleted) {
            const destructTime = new Date(msg.self_destruct_at).getTime();
            if (now >= destructTime) {
              hasChanges = true;
              return { ...msg, deleted: true, body: '[Message self-destructed]' };
            }
          }
          return msg;
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        } else if (editingMessageId) {
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
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      },
    },
    {
      key: '/',
      handler: (e) => {
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

  // Realtime subscription with proper cleanup
  useEffect(() => {
    if (!params.id) return;

    let isSubscribed = true;
    let channel: any = null;

    const setupSubscription = async () => {
      console.log('[ROOM] Subscribing to room:', params.id);

      channel = supabase
        .channel(`room:${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${params.id}`,
          },
          (payload) => {
            if (!isSubscribed) return;
            
            console.log('[ROOM] New message received:', payload);
            const newMsg = payload.new as Message;
            
            supabase
              .from('messages')
              .select(`*, users:uid (nickname, role)`)
              .eq('id', newMsg.id)
              .single()
              .then(({ data }) => {
                if (data && isSubscribed) {
                  console.log('[ROOM] Adding message to state:', data);
                  setMessages((prev) => {
                    // Prevent duplicate messages
                    if (prev.some(msg => msg.id === data.id)) {
                      console.log('[ROOM] Message already exists, skipping:', data.id);
                      return prev;
                    }
                    return [...prev, data as Message];
                  });
                  // Play notification sound if message is from other user
                  if (data.uid !== currentUserUid) {
                    playNotification();
                  }
                }
              });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${params.id}`,
          },
          (payload) => {
            if (!isSubscribed) return;
            
            console.log('[ROOM] Message updated:', payload);
            const updatedMsg = payload.new as Message;
            
            // Fetch full message with user data
            supabase
              .from('messages')
              .select(`*, users:uid (nickname, role)`)
              .eq('id', updatedMsg.id)
              .single()
              .then(({ data }) => {
                if (data && isSubscribed) {
                  setMessages((prev) => {
                    const exists = prev.some(msg => msg.id === data.id);
                    if (!exists) {
                      console.log('[ROOM] Updated message not found, adding it:', data.id);
                      return [...prev, data as Message];
                    }
                    return prev.map((msg) =>
                      msg.id === data.id ? { ...msg, ...data } : msg
                    );
                  });
                }
              });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${params.id}`,
          },
          (payload) => {
            if (!isSubscribed) return;
            
            console.log('[ROOM] Message deleted:', payload);
            const deletedId = payload.old.id;
            
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== deletedId)
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${params.id}`,
          },
          (payload) => {
            if (!isSubscribed) return;
            
            console.log('[ROOM] Room updated:', payload.new);
            const updatedRoom = payload.new as Room;
            const wasLocked = room?.locked;
            
            setRoom(updatedRoom);
            
            // Show toast notification if lock status changed
            if (updatedRoom.locked && !wasLocked) {
              toast.error(`🔒 Room locked: ${updatedRoom.locked_reason || 'by management'}`);
            } else if (!updatedRoom.locked && wasLocked) {
              toast.success('🔓 Room unlocked - you can now send messages');
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'members',
            filter: `room_id=eq.${params.id}`,
          },
          () => {
            if (!isSubscribed) return;
            console.log('[ROOM] Member joined');
            loadMembers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'members',
            filter: `room_id=eq.${params.id}`,
          },
          () => {
            if (!isSubscribed) return;
            console.log('[ROOM] Member left');
            loadMembers();
          }
        )
        .subscribe((status) => {
          console.log('[ROOM] Subscription status:', status);
        });
    };

    setupSubscription();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (channel) {
        console.log('[ROOM] Unsubscribing from room');
        supabase.removeChannel(channel);
      }
    };
  }, [params.id]);

  const init = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // user.id is now the UID (after our changes)
      const uid = user.id;
      setCurrentUserUid(uid);

      // Get current user nickname
      const { data: userData } = await supabase
        .from('users')
        .select('nickname')
        .eq('uid', uid)
        .single();

      if (userData) {
        setNickname(userData.nickname);
      }

      // Load room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', params.id)
        .single();

      if (roomError) {
        setError('[ERROR_404] ROOM_NOT_FOUND');
        return;
      }

      setRoom(roomData);

      // Check if user is banned from this room
      const { data: banCheck } = await supabase
        .from('room_bans')
        .select('reason')
        .eq('room_id', params.id)
        .eq('banned_uid', uid)
        .maybeSingle();

      if (banCheck) {
        setError(`[ERROR_403] BANNED_FROM_ROOM\n\nYou have been banned from this room.\nReason: ${banCheck.reason || 'No reason provided'}`);
        setLoading(false);
        return;
      }

      // Check membership or auto-join public room
      const { data: membership } = await supabase
        .from('members')
        .select('*')
        .eq('room_id', params.id)
        .eq('uid', uid)
        .single();

      if (!membership && roomData.type === 'public') {
        // Auto-join public room
        await supabase.from('members').insert({
          room_id: params.id,
          uid: uid,
          role: 'member',
        });
      }

      // Load messages, members, and banned users
      loadMessages();
      loadMembers();
      if (room?.created_by === uid) {
        loadBannedUsers(); // Only owner needs to see banned users
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('[ERROR] INITIALIZATION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users:uid (nickname, role)
        `)
        .eq('room_id', params.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Load reactions for messages
      if (data && data.length > 0) {
        const messageIds = data.map((m) => m.id);
        const { data: reactions } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds);

        // Merge reactions into messages
        const messagesWithReactions = data.map((msg) => ({
          ...msg,
          reactions: reactions?.filter((r) => r.message_id === msg.id) || [],
        }));

        setMessages(messagesWithReactions);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          uid,
          role,
          joined_at,
          users:uid (nickname)
        `)
        .eq('room_id', params.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
      setMemberCount(data?.length || 0);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const loadBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('room_bans')
        .select(`
          id,
          banned_uid,
          reason,
          created_at,
          users:banned_uid (nickname)
        `)
        .eq('room_id', params.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (err) {
      console.error('Error loading banned users:', err);
    }
  };

  const handleBanUser = async (uid: string, nickname: string) => {
    if (!currentUserUid || room?.created_by !== currentUserUid) {
      toast.error('[ERROR] Only owner can ban users');
      return;
    }

    const reason = prompt(`Ban ${nickname} from this room?\nReason (optional):`);
    if (reason === null) return; // Cancelled

    try {
      // Add ban
      await supabase.from('room_bans').insert({
        room_id: params.id,
        banned_uid: uid,
        banned_by: currentUserUid,
        reason: reason || 'No reason provided',
      });

      // Kick user from room
      await supabase.from('members').delete()
        .eq('room_id', params.id)
        .eq('uid', uid);

      toast.success(`[SUCCESS] ${nickname} banned from room`);
      loadMembers();
      loadBannedUsers();
    } catch (err: any) {
      console.error('Error banning user:', err);
      toast.error('[ERROR] BAN_FAILED');
    }
  };

  const handleUnbanUser = async (banId: string, nickname: string) => {
    try {
      await supabase.from('room_bans').delete().eq('id', banId);
      toast.success(`[SUCCESS] ${nickname} unbanned`);
      loadBannedUsers();
    } catch (err: any) {
      console.error('Error unbanning user:', err);
      toast.error('[ERROR] UNBAN_FAILED');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserUid) return;

    // Sanitize and validate message
    const sanitized = sanitizeMessage(newMessage);
    const suspicious = detectSuspiciousContent(sanitized);
    
    if (suspicious.isSuspicious) {
      toast.error(`[SECURITY] ${suspicious.reason}`);
      return;
    }

    // Spam detection
    const recentMessages = messages.slice(-10).map(m => m.body);
    const spamCheck = checkSpam(sanitized, recentMessages);
    
    if (spamCheck.isSpam) {
      toast.error(`[SPAM] ${spamCheck.reason}`);
      return;
    }

    // Flood protection
    const floodCheck = checkFloodProtection(currentUserUid);
    if (!floodCheck.allowed) {
      toast.error(`[FLOOD] ${floodCheck.reason}`);
      return;
    }

    setSending(true);
    try {
      let messageData: any = {
        room_id: params.id,
        uid: currentUserUid,
        body: sanitized,
        encrypted: false,
      };

      // Encrypt message ONLY for private rooms
      if (room?.type === 'private' && encryptionReady) {
        const encryptResult = await encrypt(sanitized);
        if (encryptResult) {
          messageData = {
            ...messageData,
            body: encryptResult.encrypted,
            encrypted: true,
            encryption_salt: encryptResult.salt,
            encryption_iv: encryptResult.iv,
            hmac: encryptResult.hmac,
            nonce: encryptResult.nonce,
            message_timestamp: Date.now(),
          };
        }
      }

      // Add self-destruct time if selected
      if (selfDestructTime) {
        const destructAt = new Date(Date.now() + selfDestructTime);
        messageData.self_destruct_at = destructAt.toISOString();
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          users:uid (nickname, role)
        `)
        .single();

      if (error) throw error;
      
      // Immediately add message to local state
      if (data) {
        console.log('[ROOM] ✅ Message sent, adding to state:', data.id);
        setMessages((prev) => {
          // Check for duplicate
          if (prev.some(msg => msg.id === data.id)) {
            console.log('[ROOM] ⚠️ Message already in state');
            return prev;
          }
          return [...prev, data as Message];
        });
      }
      
      setNewMessage('');
      setSelfDestructTime(null);
      
      // Stop typing indicator
      stopTyping();
      
      // Re-enable auto-scroll when user sends message
      setIsUserScrolling(false);
      
      // Focus back to input
      setTimeout(() => inputRef.current?.focus(), 100);
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
        .from('messages')
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
      toast.success('[SUCCESS] Message updated');
    } catch (err: any) {
      console.error('Error editing message:', err);
      toast.error('[ERROR] EDIT_FAILED');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Mark as deleted in local state first for instant feedback
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, deleted: true, body: '[Message deleted]' } : msg
        )
      );

      // Delete from database
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('uid', currentUserUid);

      if (error) throw error;
      toast.success('[SUCCESS] Message deleted');
    } catch (err: any) {
      console.error('Error deleting message:', err);
      toast.error('[ERROR] DELETE_FAILED');
      // Revert on error
      loadMessages();
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    if (!currentUserUid) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('uid', currentUserUid)
        .eq('reaction', reaction)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            uid: currentUserUid,
            reaction,
          });
      }

      // Reload messages to get updated reactions
      loadMessages();
    } catch (err: any) {
      console.error('Error adding reaction:', err);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentUserUid) return;
    
    try {
      await supabase
        .from('members')
        .delete()
        .eq('room_id', params.id)
        .eq('uid', currentUserUid);

      router.push('/rooms/public');
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  };

  const handleReportRoom = async () => {
    if (!currentUserUid || !room || !reportDescription.trim() || reportDescription.length < 10) {
      toast.error('⚠️ Description must be at least 10 characters');
      return;
    }
    
    setReporting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_uid: currentUserUid,
        reported_uid: null,
        room_id: params.id,
        message_id: null,
        dm_thread_id: null,
        report_type: reportType,
        description: reportDescription.trim(),
        status: 'pending',
      });

      if (error) throw error;
      
      toast.success('✅ Room reported successfully! Admins will review it.');
      setShowReportModal(false);
      setReportDescription('');
      setReportType('spam');
    } catch (err) {
      console.error('Error reporting room:', err);
      toast.error('❌ Failed to submit report');
    } finally {
      setReporting(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!currentUserUid || !room) return;
    
    // Check if room name matches
    if (deleteConfirmInput !== room.name) {
      setError('[ERROR] Room name does not match');
      return;
    }
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', params.id)
        .eq('created_by', currentUserUid);

      if (error) throw error;
      
      router.push('/rooms/public');
    } catch (err: any) {
      console.error('Error deleting room:', err);
      setError(`[ERROR] ${err.message || 'Failed to delete room'}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmInput('');
    }
  };

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) =>
        msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.users?.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b-2 border-accent bg-retro-black p-4">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 w-48 bg-surface/30 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">
            <MessageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <TerminalPanel header="ERROR">
          <p className="text-retro-amber mb-4">{error}</p>
          <NeonButton onClick={() => router.push('/rooms/public')}>
            [RETURN_TO_ROOMS]
          </NeonButton>
        </TerminalPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-accent bg-retro-black p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="status-led online" />
              <h1 className="text-xl uppercase tracking-wider text-accent">
                {room?.type === 'private' ? 'Private Room' : 'Public Room'}
              </h1>
            </div>
            <p className="text-accent text-sm mt-1">{room?.name}</p>
          </div>
          <div className="flex gap-4">
            <NeonButton variant="secondary" onClick={() => router.push('/rooms/public')}>
              [Back]
            </NeonButton>
            {room?.created_by === currentUserUid ? (
              <NeonButton onClick={() => setShowSettings(!showSettings)}>
                {showSettings ? '[Close Settings]' : '[Room Settings]'}
              </NeonButton>
            ) : (
              <>
                <NeonButton onClick={() => setShowReportModal(true)}>
                  [Report Room]
                </NeonButton>
                <NeonButton variant="danger" onClick={handleLeaveRoom}>
                  [Leave]
                </NeonButton>
              </>
            )}
          </div>
        </div>
        {/* Search Box */}
        {showSearch && (
          <div className="max-w-6xl mx-auto mt-4">
            <div className="flex items-center gap-2 border-2 border-accent p-3 bg-surface/30">
              <span className="text-accent text-sm">SEARCH:</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent border-none outline-none text-accent font-mono"
              />
              <span className="text-muted text-xs">
                {searchQuery ? `${filteredMessages.length} / ${messages.length}` : ''}
              </span>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-muted hover:text-accent text-xs"
              >
                [ESC]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Room Settings Panel */}
      {showSettings && (
        <div className="border-b-2 border-accent bg-retro-black p-4">
          <div className="max-w-6xl mx-auto">
            <TerminalPanel header="ROOM SETTINGS">
              <div className="space-y-6">
                {/* Room Info */}
                <div>
                  <h3 className="text-accent text-sm uppercase mb-2">Room Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-retro-gray">
                      <span className="text-accent">Name:</span> {room?.name}
                    </p>
                    <p className="text-retro-gray">
                      <span className="text-accent">Type:</span> {room?.type}
                    </p>
                    {room?.description && (
                      <p className="text-retro-gray">
                        <span className="text-accent">Description:</span> {room.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Member Stats */}
                <div>
                  <h3 className="text-accent text-sm uppercase mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-retro-gray">
                      <span className="text-accent">Total Members:</span> {memberCount}
                    </p>
                    <p className="text-retro-gray">
                      <span className="text-accent">Message Rate Limit:</span> 2000 chars/message, No cooldown
                    </p>
                    <p className="text-retro-gray">
                      <span className="text-accent">Auto-purge:</span> 30 days
                    </p>
                  </div>
                </div>

                {/* Members List */}
                <div>
                  <h3 className="text-accent text-sm uppercase mb-2">
                    Members ({memberCount})
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {members.map((member) => {
                      const isOwner = room?.created_by === member.uid;
                      const isCurrentUser = member.uid === currentUserUid;
                      const canBan = room?.created_by === currentUserUid && !isOwner && !isCurrentUser;
                      
                      return (
                        <div
                          key={member.uid}
                          className="flex items-center justify-between text-sm py-1 border-b border-gray-700"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="status-led online" />
                            <span className="text-accent">
                              {member.users?.nickname || member.uid}
                            </span>
                            {isOwner && (
                              <span className="text-xs text-yellow-400 font-bold">[OWNER]</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-retro-gray">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </span>
                            {canBan && (
                              <button
                                onClick={() => handleBanUser(member.uid, member.users?.nickname || member.uid)}
                                className="text-xs text-error hover:text-red-400 transition-colors px-2 py-1 border border-error hover:bg-error/10"
                              >
                                [BAN]
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Banned Users (Owner Only) */}
                {room?.created_by === currentUserUid && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-error text-sm uppercase">
                        Banned Users ({bannedUsers.length})
                      </h3>
                      <button
                        onClick={() => setShowBannedUsers(!showBannedUsers)}
                        className="text-xs text-accent hover:text-white transition-colors"
                      >
                        [{showBannedUsers ? 'Hide' : 'Show'}]
                      </button>
                    </div>
                    {showBannedUsers && (
                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {bannedUsers.length === 0 ? (
                          <p className="text-xs text-dim italic">No banned users</p>
                        ) : (
                          bannedUsers.map((ban) => (
                            <div
                              key={ban.id}
                              className="flex items-center justify-between text-sm py-1 border-b border-gray-700"
                            >
                              <div className="flex-1">
                                <span className="text-error">
                                  {ban.users?.nickname || ban.banned_uid}
                                </span>
                                {ban.reason && (
                                  <p className="text-xs text-dim italic mt-0.5">
                                    "{ban.reason}"
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleUnbanUser(ban.id, ban.users?.nickname || ban.banned_uid)}
                                className="text-xs text-accent hover:text-green-400 transition-colors px-2 py-1 border border-accent hover:bg-accent/10"
                              >
                                [UNBAN]
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Danger Zone */}
                <div className="border-t border-error pt-4">
                  <h3 className="text-error text-sm uppercase mb-2">Danger Zone</h3>
                  <p className="text-xs text-retro-gray mb-3">
                    Permanently delete this room and all messages. This cannot be undone.
                  </p>
                  <NeonButton
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full"
                  >
                    Delete Room
                  </NeonButton>
                </div>
              </div>
            </TerminalPanel>
          </div>
        </div>
      )}

      {/* Messages - Hidden when settings are open */}
      {!showSettings && (
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-1">
          {messages.length === 0 && (
            <div className="text-center text-accent py-8">
              <p className="text-sm">No messages yet. Start chatting!</p>
            </div>
          )}

          {filteredMessages.map((msg) => {
            const time = new Date(msg.created_at).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            const isOwnMessage = msg.uid === currentUserUid;
            const displayName = msg.users?.nickname || msg.uid;
            const userRole = msg.users?.role || 'user';
            const isEditing = editingMessageId === msg.id;
            const messageAge = Date.now() - new Date(msg.created_at).getTime();
            const canEdit = isOwnMessage && messageAge < 1 * 60 * 1000; // 1 minute
            
            // Check if message matches search
            const matchesSearch = !searchQuery.trim() || 
              msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
              msg.users?.nickname.toLowerCase().includes(searchQuery.toLowerCase());

            // Calculate self-destruct countdown using currentTime
            let selfDestructCountdown = '';
            if (msg.self_destruct_at && !msg.deleted) {
              const remaining = new Date(msg.self_destruct_at).getTime() - currentTime;
              if (remaining > 0) {
                const seconds = Math.floor(remaining / 1000);
                if (seconds < 60) {
                  selfDestructCountdown = ` [${seconds}s]`;
                } else {
                  const minutes = Math.floor(seconds / 60);
                  selfDestructCountdown = ` [${minutes}m]`;
                }
              }
            }

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
                  <div className={`log-line ${searchQuery.trim() && matchesSearch ? 'border-l-2 border-accent pl-2' : ''} ${msg.deleted ? 'opacity-50' : ''}`}>
                    <span className="timestamp">
                      {time}
                      {selfDestructCountdown && (
                        <span className="text-error text-[10px]">{selfDestructCountdown}</span>
                      )}
                    </span>
                    <span 
                      className={`uid ${isOwnMessage ? 'text-retro-magenta' : ''} ${!isOwnMessage && !msg.deleted ? 'cursor-pointer hover:text-accent/70' : ''}`}
                      onClick={() => !isOwnMessage && !msg.deleted && setSelectedUserUid(msg.uid)}
                      title={!isOwnMessage && !msg.deleted ? 'View profile' : ''}
                    >
                      {displayName}
                    </span>
                    {userRole && <RoleBadge role={userRole as any} short />}
                    <span className="separator">&gt;</span>
                    <span className={`message ${msg.deleted ? 'text-muted italic' : ''}`}>
                      {msg.deleted 
                        ? msg.body 
                        : msg.encrypted 
                        ? formatMessage(decryptedMessages.get(msg.id) || '[DECRYPTING...]')
                        : formatMessage(msg.body)
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
                {typingUsers.length === 1 
                  ? typingUsers[0]
                  : `${typingUsers.length} users`
                }
              </span>
              <span className="separator">&gt;</span>
              <span className="message text-muted animate-pulse">yazıyor...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      )}

      {/* Input - Hidden when settings are open */}
      {!showSettings && (
        <div className="border-t-2 border-accent bg-retro-black p-4">
        <div className="max-w-6xl mx-auto">
          {room?.locked ? (
            // Room is locked - show warning
            <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl text-red-500 font-bold uppercase mb-2">
                [ROOM_LOCKED]
              </h3>
              <p className="text-red-400 text-sm mb-3">
                {room.locked_reason || 'This room has been locked by management.'}
              </p>
              <div className="bg-red-500/5 border border-red-500/50 rounded p-3 text-xs text-red-400">
                <p className="font-mono">
                  • Messages are READ-ONLY<br/>
                  • Cannot send new messages<br/>
                  • Contact management for appeals
                </p>
              </div>
              {room.locked_at && (
                <p className="text-xs text-red-400/70 mt-3">
                  Locked: {new Date(room.locked_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            // Room is unlocked - normal input
            <>
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
                    placeholder="Type message... (max 2000 chars)"
                    disabled={sending}
                    maxLength={2000}
                    showCursor
                  />
                </div>
                <select
                  value={selfDestructTime || ''}
                  onChange={(e) => setSelfDestructTime(e.target.value ? Number(e.target.value) : null)}
                  className="bg-surface border-2 border-border text-accent px-3 py-2 text-sm font-mono hover:border-accent transition-all"
                  title="Self-destruct timer"
                >
                  <option value="">∞</option>
                  <option value="5000">5s</option>
                  <option value="60000">1m</option>
                  <option value="300000">5m</option>
                  <option value="3600000">1h</option>
                </select>
                <NeonButton type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? '[...]' : '[SEND]'}
                </NeonButton>
              </form>
              <p className="text-xs text-retro-gray mt-2">
                ESC = clear • {selfDestructTime ? `Self-destruct: ${selfDestructTime < 60000 ? `${selfDestructTime / 1000}s` : selfDestructTime < 3600000 ? `${selfDestructTime / 60000}m` : `${selfDestructTime / 3600000}h`}` : 'Messages auto-purge after 30 days'}
              </p>
            </>
          )}
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <TerminalPanel className="max-w-md w-full">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl uppercase text-error mb-2">[DELETE_ROOM_CONFIRMATION]</h2>
                <p className="text-accent text-sm">
                  Are you sure you want to permanently delete this room?
                </p>
                <p className="text-retro-gray text-xs mt-2">
                  This will delete all messages and remove all members. This action cannot be undone.
                </p>
              </div>

              <div className="border border-error p-3 bg-error/10">
                <p className="text-error text-sm font-mono">
                  Room: {room?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm mb-2 text-accent uppercase">
                  Type room name to confirm: "{room?.name}"
                </label>
                <CLIInput
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder="Enter room name"
                  disabled={deleting}
                />
                {deleteConfirmInput && deleteConfirmInput !== room?.name && (
                  <p className="text-error text-xs mt-1">
                    Room name does not match
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <NeonButton
                  variant="danger"
                  onClick={handleDeleteRoom}
                  disabled={deleting || deleteConfirmInput !== room?.name}
                  className="flex-1"
                >
                  {deleting ? '[DELETING...]' : '[CONFIRM_DELETE]'}
                </NeonButton>
                <NeonButton
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmInput('');
                  }}
                  disabled={deleting}
                  className="flex-1"
                >
                  [CANCEL]
                </NeonButton>
              </div>
            </div>
          </TerminalPanel>
        </div>
      )}

      {/* Report Room Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="terminal max-w-lg w-full">
            {/* Header */}
            <div className="border-b-2 border-border pb-4 mb-4">
              <h2 className="text-xl text-accent uppercase tracking-wider font-mono">
                [REPORT_ROOM]
              </h2>
              <p className="text-accent/70 text-sm font-mono mt-1">
                &gt; Submit moderation report
              </p>
            </div>

            <div className="space-y-4">
              {/* Room Info */}
              <div className="border-2 border-retro-amber/50 bg-retro-amber/5 p-3">
                <p className="text-retro-amber font-mono text-xs uppercase mb-1">TARGET_ROOM:</p>
                <p className="text-accent font-bold font-mono">{room?.name}</p>
                <p className="text-accent/70 text-xs font-mono mt-1">
                  TYPE: {room?.type} | MEMBERS: {memberCount}
                </p>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm text-accent mb-2 uppercase tracking-wider">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
                  required
                >
                  <option value="spam">SPAM / FLOODING</option>
                  <option value="abuse">ABUSE / BULLYING</option>
                  <option value="harassment">HARASSMENT</option>
                  <option value="inappropriate">INAPPROPRIATE CONTENT</option>
                  <option value="technical">TECHNICAL ISSUE</option>
                  <option value="other">OTHER</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-accent mb-2 uppercase tracking-wider">
                  Description (min 10 chars) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
                  rows={4}
                  placeholder="Please describe the issue in detail..."
                  required
                  minLength={10}
                  maxLength={500}
                  disabled={reporting}
                />
                <p className="text-accent/50 text-xs mt-1">
                  Characters: {reportDescription.length}/10 minimum (max 500)
                </p>
              </div>

              {/* Info Box */}
              <div className="border-2 border-retro-amber/50 bg-retro-amber/5 p-3">
                <p className="text-retro-amber text-xs font-mono">
                  [WARNING] False reports may result in account suspension.
                  Reports are reviewed by admins within 24 hours.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription('');
                    setReportType('spam');
                  }}
                  className="retro-button flex-1"
                  disabled={reporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportRoom}
                  className="retro-button flex-1 bg-retro-amber hover:bg-retro-amber/80"
                  disabled={reporting || reportDescription.length < 10}
                >
                  {reporting ? '[SUBMITTING...]' : '[SUBMIT_REPORT]'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserUid && (
        <UserProfileModal
          uid={selectedUserUid}
          onClose={() => setSelectedUserUid(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

