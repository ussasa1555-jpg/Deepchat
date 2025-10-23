'use client';

import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

interface TypingUser {
  uid: string;
  nickname: string;
  timestamp: number;
}

interface UseTypingIndicatorProps {
  channelName: string;
  currentUserUid: string | null;
  currentUserNickname?: string;
}

export function useTypingIndicator({
  channelName,
  currentUserUid,
  currentUserNickname = 'User',
}: UseTypingIndicatorProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingUsersRef = useRef<Map<string, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onTypingChangeRef = useRef<((users: TypingUser[]) => void) | null>(null);

  // Clean up stale typing indicators (older than 3 seconds)
  const cleanStaleIndicators = useCallback(() => {
    const now = Date.now();
    let hasChanges = false;

    typingUsersRef.current.forEach((user, uid) => {
      if (now - user.timestamp > 3000) {
        typingUsersRef.current.delete(uid);
        hasChanges = true;
      }
    });

    if (hasChanges && onTypingChangeRef.current) {
      onTypingChangeRef.current(Array.from(typingUsersRef.current.values()));
    }
  }, []);

  useEffect(() => {
    if (!currentUserUid || !channelName) return;

    // Initialize presence channel
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserUid,
        },
      },
    });

    channelRef.current = channel;

    // Subscribe to presence events
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (presence.uid !== currentUserUid && presence.typing) {
              typingUsers.push({
                uid: presence.uid,
                nickname: presence.nickname || 'User',
                timestamp: Date.now(),
              });
            }
          });
        });

        // Update typing users map
        typingUsersRef.current.clear();
        typingUsers.forEach((user) => {
          typingUsersRef.current.set(user.uid, user);
        });

        if (onTypingChangeRef.current) {
          onTypingChangeRef.current(typingUsers);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence (not typing)
          await channel.track({
            uid: currentUserUid,
            nickname: currentUserNickname,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Cleanup interval for stale indicators
    const cleanupInterval = setInterval(cleanStaleIndicators, 1000);

    return () => {
      clearInterval(cleanupInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelName, currentUserUid, currentUserNickname, cleanStaleIndicators]);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!channelRef.current || !currentUserUid) return;

    await channelRef.current.track({
      uid: currentUserUid,
      nickname: currentUserNickname,
      typing: true,
      online_at: new Date().toISOString(),
    });

    // Auto-stop after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [currentUserUid, currentUserNickname]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!channelRef.current || !currentUserUid) return;

    await channelRef.current.track({
      uid: currentUserUid,
      nickname: currentUserNickname,
      typing: false,
      online_at: new Date().toISOString(),
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentUserUid, currentUserNickname]);

  // Subscribe to typing changes
  const onTypingChange = useCallback((callback: (users: TypingUser[]) => void) => {
    onTypingChangeRef.current = callback;
  }, []);

  return {
    startTyping,
    stopTyping,
    onTypingChange,
  };
}















