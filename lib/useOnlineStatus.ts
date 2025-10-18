'use client';

import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

interface OnlineUser {
  uid: string;
  nickname: string;
  last_seen: string;
}

interface UseOnlineStatusProps {
  channelName: string;
  currentUserUid: string | null;
  currentUserNickname?: string;
}

export function useOnlineStatus({
  channelName,
  currentUserUid,
  currentUserNickname = 'User',
}: UseOnlineStatusProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onlineUsersRef = useRef<Map<string, OnlineUser>>(new Map());
  const onChangeRef = useRef<((users: OnlineUser[]) => void) | null>(null);

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
        const onlineUsers: OnlineUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (presence.uid) {
              onlineUsers.push({
                uid: presence.uid,
                nickname: presence.nickname || 'User',
                last_seen: presence.online_at || new Date().toISOString(),
              });
            }
          });
        });

        // Update online users map
        onlineUsersRef.current.clear();
        onlineUsers.forEach((user) => {
          onlineUsersRef.current.set(user.uid, user);
        });

        if (onChangeRef.current) {
          onChangeRef.current(onlineUsers);
        }
      })
      .on('presence', { event: 'join' }, ({ key: _key, newPresences }: any) => {
        newPresences.forEach((presence: any) => {
          if (presence.uid && presence.uid !== currentUserUid) {
            console.log(`[PRESENCE] User joined: ${presence.nickname}`);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key: _key, leftPresences }: any) => {
        leftPresences.forEach((presence: any) => {
          if (presence.uid && presence.uid !== currentUserUid) {
            console.log(`[PRESENCE] User left: ${presence.nickname}`);
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            uid: currentUserUid,
            nickname: currentUserNickname,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          uid: currentUserUid,
          nickname: currentUserNickname,
          online_at: new Date().toISOString(),
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeat);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, currentUserUid, currentUserNickname]);

  // Subscribe to online status changes
  const onOnlineChange = useCallback((callback: (users: OnlineUser[]) => void) => {
    onChangeRef.current = callback;
  }, []);

  // Check if a specific user is online
  const isUserOnline = useCallback((uid: string): boolean => {
    return onlineUsersRef.current.has(uid);
  }, []);

  // Get all online users
  const getOnlineUsers = useCallback((): OnlineUser[] => {
    return Array.from(onlineUsersRef.current.values());
  }, []);

  return {
    onOnlineChange,
    isUserOnline,
    getOnlineUsers,
  };
}







