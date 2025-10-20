'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OnlineUser {
  uid: string;
  nickname: string;
  last_seen: string;
}

interface PresenceContextType {
  onlineUsers: string[];
  isUserOnline: (uid: string) => boolean;
  setManualOffline: (offline: boolean) => void;
  isManualOffline: boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  isUserOnline: () => false,
  setManualOffline: () => {},
  isManualOffline: false,
});

export function usePresence() {
  return useContext(PresenceContext);
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ uid: string; nickname: string } | null>(null);
  const [isManualOffline, setIsManualOffline] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Load manual offline setting from localStorage
    const stored = localStorage.getItem('deepchat_manual_offline');
    if (stored === 'true') {
      setIsManualOffline(true);
    }
  }, []);

  useEffect(() => {
    async function initPresence() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user nickname
        const { data: userData } = await supabase
          .from('users')
          .select('nickname')
          .eq('uid', user.id)
          .single();

        if (userData) {
          setCurrentUser({ uid: user.id, nickname: userData.nickname });
        }
      } catch (err) {
        console.error('Error initializing presence:', err);
      }
    }

    initPresence();
  }, []);

  useEffect(() => {
    if (!currentUser || isManualOffline) {
      // If manual offline, disconnect from presence
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    // Initialize global presence channel
    const presenceChannel = supabase.channel('global:presence', {
      config: {
        presence: {
          key: currentUser.uid,
        },
      },
    });

    setChannel(presenceChannel);

    // Subscribe to presence events
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online: string[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (presence.uid) {
              online.push(presence.uid);
            }
          });
        });

        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await presenceChannel.track({
            uid: currentUser.uid,
            nickname: currentUser.nickname,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(async () => {
      if (presenceChannel) {
        await presenceChannel.track({
          uid: currentUser.uid,
          nickname: currentUser.nickname,
          online_at: new Date().toISOString(),
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeat);
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [currentUser, isManualOffline]);

  const isUserOnline = (uid: string): boolean => {
    return onlineUsers.includes(uid);
  };

  const setManualOffline = (offline: boolean) => {
    setIsManualOffline(offline);
    localStorage.setItem('deepchat_manual_offline', offline.toString());
  };

  return (
    <PresenceContext.Provider
      value={{
        onlineUsers,
        isUserOnline,
        setManualOffline,
        isManualOffline,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}










