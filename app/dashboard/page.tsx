'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface UserProfile {
  uid: string;
  nickname: string;
  email: string;
  created_at: string;
  last_login_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserId, setShowUserId] = useState(false);
  const [showNickname, setShowNickname] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 login-page">
        <div className="particles-container">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        <div className="login-form">
          <div className="terminal max-w-md w-full">
            <p className="text-accent text-center animate-pulse">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Floating Particles Background */}
      <div className="particles-container">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="login-form max-w-7xl mx-auto">
        {/* Header */}
        <div className="terminal mb-6">
          <div className="border-b-2 border-border pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
                  DASHBOARD
                </h1>
                <p className="text-accent text-sm retro-text">
                  Welcome back, {profile?.nickname}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="retro-button border-2 border-background bg-background text-accent hover:bg-accent hover:text-background"
                >
                  [Sign Out]
                </button>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              className="border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50 cursor-pointer hover:border-accent/50 transition-all"
              onClick={() => setShowUserId(!showUserId)}
              title="Click to reveal/hide User ID"
            >
              <p className="text-xs text-muted uppercase tracking-wider mb-2 retro-muted">User ID</p>
              <p 
                className="text-accent font-mono text-sm retro-text break-all"
                style={{ 
                  filter: showUserId ? 'none' : 'blur(2px)',
                  transition: 'filter 0.2s ease',
                  userSelect: showUserId ? 'text' : 'none'
                }}
              >
                {profile?.uid || 'Loading...'}
              </p>
            </div>
            <div 
              className="border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50 cursor-pointer hover:border-accent/50 transition-all"
              onClick={() => setShowNickname(!showNickname)}
              title="Click to reveal/hide Nickname"
            >
              <p className="text-xs text-muted uppercase tracking-wider mb-2 retro-muted">Nickname</p>
              <p 
                className="text-accent text-lg font-semibold retro-text"
                style={{ 
                  filter: showNickname ? 'none' : 'blur(2px)',
                  transition: 'filter 0.2s ease',
                  userSelect: showNickname ? 'text' : 'none'
                }}
              >
                {profile?.nickname}
              </p>
            </div>
            <div className="border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
              <p className="text-xs text-muted uppercase tracking-wider mb-2 retro-muted">Status</p>
              <div className="flex items-center gap-2">
                <div className="status-led online"></div>
                <p className="text-success text-sm retro-text">Online</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted retro-muted">
              Account Created: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-xs text-muted retro-muted mt-1">
              Last Active: {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Chat Section */}
          <Link href="/rooms/public">
            <div className="terminal hover:scale-105 transition-transform cursor-pointer h-full">
              <div className="border-b-2 border-border pb-3 mb-4">
                <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                  Public Rooms
                </h2>
              </div>
              <p className="text-sm text-muted retro-text mb-4">
                Join open chat rooms and connect with the community
              </p>
              <div className="flex items-center gap-2 text-accent">
                <span className="text-2xl font-mono font-bold">#</span>
                <span className="text-sm retro-text">Start Chatting</span>
              </div>
            </div>
          </Link>

          <Link href="/rooms/private">
            <div className="terminal hover:scale-105 transition-transform cursor-pointer h-full">
              <div className="border-b-2 border-border pb-3 mb-4">
                <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                  Private Channels
                </h2>
              </div>
              <p className="text-sm text-muted retro-text mb-4">
                Access secure private channels with CLI keys
              </p>
              <div className="flex items-center gap-2 text-accent">
                <span className="text-2xl font-mono font-bold">*</span>
                <span className="text-sm retro-text">Enter Key</span>
              </div>
            </div>
          </Link>

          <Link href="/oracle">
            <div className="terminal hover:scale-105 transition-transform cursor-pointer h-full">
              <div className="border-b-2 border-border pb-3 mb-4">
                <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                  Oracle 0.0.8
                </h2>
              </div>
              <p className="text-sm text-muted retro-text mb-4">
                Chat with AI assistant in ephemeral sessions
              </p>
              <div className="flex items-center gap-2 text-accent">
                <span className="text-2xl font-mono font-bold">AI</span>
                <span className="text-sm retro-text">Start Session</span>
              </div>
            </div>
          </Link>

          <Link href="/nodes">
            <div className="terminal hover:scale-105 transition-transform cursor-pointer h-full">
              <div className="border-b-2 border-border pb-3 mb-4">
                <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                  Network Nodes
                </h2>
              </div>
              <p className="text-sm text-muted retro-text mb-4">
                Add friends and start private conversations
              </p>
              <div className="flex items-center gap-2 text-accent">
                <span className="text-2xl font-mono font-bold">+</span>
                <span className="text-sm retro-text">Manage Connections</span>
              </div>
            </div>
          </Link>

          <Link href="/settings">
            <div className="terminal hover:scale-105 transition-transform cursor-pointer h-full">
              <div className="border-b-2 border-border pb-3 mb-4">
                <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                  Settings
                </h2>
              </div>
              <p className="text-sm text-muted retro-text mb-4">
                Manage your account and preferences
              </p>
              <div className="flex items-center gap-2 text-accent">
                <span className="text-2xl font-mono font-bold">⚙</span>
                <span className="text-sm retro-text">Configure</span>
              </div>
            </div>
          </Link>

          <Link href="/purge">
            <div className="terminal hover:scale-105 transition-transform cursor-pointer h-full border-warning/30">
              <div className="border-b-2 border-warning pb-3 mb-4">
                <h2 className="text-xl uppercase tracking-wider text-warning retro-title">
                  Data Purge
                </h2>
              </div>
              <p className="text-sm text-muted retro-text mb-4">
                Permanently delete your account and data
              </p>
              <div className="flex items-center gap-2 text-warning">
                <span className="text-2xl font-mono font-bold">X</span>
                <span className="text-sm retro-text">Purge Data</span>
              </div>
            </div>
          </Link>
        </div>

        {/* System Status */}
        <div className="terminal">
          <div className="border-b-2 border-border pb-3 mb-4">
            <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
              System Status
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="status-led online"></div>
              <div>
                <p className="text-xs text-muted retro-muted">Database</p>
                <p className="text-success text-sm retro-text">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="status-led online"></div>
              <div>
                <p className="text-xs text-muted retro-muted">Authentication</p>
                <p className="text-success text-sm retro-text">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="status-led online"></div>
              <div>
                <p className="text-xs text-muted retro-muted">Realtime</p>
                <p className="text-success text-sm retro-text">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="status-led online"></div>
              <div>
                <p className="text-xs text-muted retro-muted">AI Oracle</p>
                <p className="text-success text-sm retro-text">Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link href="/" className="ghost-link text-sm">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
