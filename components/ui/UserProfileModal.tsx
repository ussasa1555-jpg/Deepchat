'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TerminalPanel } from './TerminalPanel';
import { NeonButton } from './NeonButton';

interface UserProfileModalProps {
  uid: string;
  onClose: () => void;
}

interface UserProfile {
  uid: string;
  nickname: string;
  created_at: string;
}

export function UserProfileModal({ uid, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [uid]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('uid, nickname, created_at')
        .eq('uid', uid)
        .single();

      if (userError) throw userError;
      setProfile(userData);

      // Get message count
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('uid', uid);

      setMessageCount(count || 0);

      // Check if blocked
      const { data: blockData } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_uid', user.id)
        .eq('blocked_uid', uid)
        .single();

      setIsBlocked(!!blockData);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!profile || blocking) return;

    setBlocking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isBlocked) {
        // Unblock
        await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_uid', user.id)
          .eq('blocked_uid', uid);
        setIsBlocked(false);
      } else {
        // Block
        await supabase
          .from('blocked_users')
          .insert({
            blocker_uid: user.id,
            blocked_uid: uid,
          });
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('Error toggling block:', err);
    } finally {
      setBlocking(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <TerminalPanel className="max-w-md w-full">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-accent animate-pulse">[LOADING_PROFILE...]</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b-2 border-border pb-4">
              <h2 className="text-xl uppercase text-accent retro-title mb-2">
                [USER_PROFILE]
              </h2>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-accent bg-surface flex items-center justify-center">
                  <span className="text-accent text-3xl font-mono font-bold">&gt;_</span>
                </div>
                <div className="flex-1">
                  <p className="text-accent text-xl font-bold font-mono">{profile.nickname}</p>
                  <p className="text-xs text-muted font-mono">UID: {profile.uid}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border p-3 bg-surface/30">
                  <p className="text-xs text-muted uppercase mb-1">Joined</p>
                  <p className="text-accent text-sm font-mono">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="border border-border p-3 bg-surface/30">
                  <p className="text-xs text-muted uppercase mb-1">Messages</p>
                  <p className="text-accent text-sm font-mono">{messageCount}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Link href={`/dm/${profile.uid}`} className="flex-1">
                  <NeonButton className="w-full">[Send DM]</NeonButton>
                </Link>
                <NeonButton variant="secondary" onClick={onClose} className="flex-1">
                  [Close]
                </NeonButton>
              </div>
              <NeonButton
                variant="danger"
                onClick={handleBlockToggle}
                disabled={blocking}
                className="w-full"
              >
                {blocking ? '[...]' : isBlocked ? '[Unblock User]' : '[Block User]'}
              </NeonButton>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-error">[ERROR] PROFILE_NOT_FOUND</p>
            <NeonButton onClick={onClose} className="mt-4">
              [Close]
            </NeonButton>
          </div>
        )}
      </TerminalPanel>
    </div>
  );
}

