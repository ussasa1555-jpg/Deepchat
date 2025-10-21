'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';

interface UserDetailModalProps {
  uid: string;
  onClose: () => void;
}

interface UserDetails {
  user: {
    uid: string;
    nickname: string;
    email: string;
    role: string;
    created_at: string;
    last_login_at: string | null;
    two_factor_enabled: boolean;
  };
  stats: {
    total_messages: number;
    messages_24h: number;
    messages_7d: number;
    messages_30d: number;
    rooms_created: number;
    rooms_joined: number;
    dm_conversations: number;
    friends_count: number;
    last_message_at: string | null;
    failed_logins: number;
  };
  ip_history: Array<{
    ip_address: string;
    user_agent: string;
    device: string;
    first_seen: string;
    last_seen: string;
    access_count: number;
  }>;
  recent_activity: Array<{
    id: string;
    action: string;
    created_at: string;
    ip_address: string;
    metadata: any;
  }>;
  threat_score: number;
}

export function UserDetailModal({ uid, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'security'>('overview');

  useEffect(() => {
    loadUserDetails();
  }, [uid]);

  const loadUserDetails = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_details', { target_uid: uid });

      if (error) throw error;
      setDetails(data);
      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Load user details error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="terminal w-full max-w-md p-6">
          <p className="text-accent text-center">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="terminal w-full max-w-md p-6">
          <p className="text-red-500 text-center">Failed to load user details</p>
          <div className="text-center mt-4">
            <NeonButton onClick={onClose}>Close</NeonButton>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, ip_history, recent_activity, threat_score } = details;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-hidden">
      <div className="terminal w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="border-b-2 border-border pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-accent font-bold uppercase tracking-wider">
                👤 {user.nickname}
              </h2>
              <p className="text-retro-gray text-sm mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 text-xs border-2 rounded ${
                  user.role === 'management' ? 'border-accent text-accent' :
                  user.role === 'admin' ? 'border-retro-amber text-retro-amber' :
                  'border-retro-gray text-retro-gray'
                }`}>
                  {user.role.toUpperCase()}
                </span>
                {user.two_factor_enabled && (
                  <span className="px-2 py-1 text-xs border-2 border-green-500 text-green-500 rounded">
                    🔒 2FA
                  </span>
                )}
                {threat_score > 50 && (
                  <span className="px-2 py-1 text-xs border-2 border-red-500 text-red-500 rounded animate-pulse">
                    ⚠️ THREAT: {threat_score}
                  </span>
                )}
              </div>
            </div>
            <NeonButton onClick={onClose} variant="secondary">✕ Close</NeonButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b-2 border-border pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === 'overview'
                ? 'text-accent border-b-2 border-accent'
                : 'text-retro-gray hover:text-accent'
            }`}
          >
            📊 OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === 'activity'
                ? 'text-accent border-b-2 border-accent'
                : 'text-retro-gray hover:text-accent'
            }`}
          >
            ⏰ ACTIVITY
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === 'security'
                ? 'text-accent border-b-2 border-accent'
                : 'text-retro-gray hover:text-accent'
            }`}
          >
            🔒 SECURITY
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && (
            <>
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-bg/50 border-2 border-border rounded p-3">
                  <p className="text-xs text-retro-gray uppercase">Total Messages</p>
                  <p className="text-2xl text-accent font-bold">{stats.total_messages.toLocaleString()}</p>
                </div>
                <div className="bg-bg/50 border-2 border-border rounded p-3">
                  <p className="text-xs text-retro-gray uppercase">Rooms</p>
                  <p className="text-2xl text-accent font-bold">{stats.rooms_joined}</p>
                </div>
                <div className="bg-bg/50 border-2 border-border rounded p-3">
                  <p className="text-xs text-retro-gray uppercase">Friends</p>
                  <p className="text-2xl text-accent font-bold">{stats.friends_count}</p>
                </div>
                <div className="bg-bg/50 border-2 border-border rounded p-3">
                  <p className="text-xs text-retro-gray uppercase">DM Convos</p>
                  <p className="text-2xl text-accent font-bold">{stats.dm_conversations}</p>
                </div>
              </div>

              {/* Recent Activity Stats */}
              <div className="bg-bg/50 border-2 border-border rounded p-4">
                <h3 className="text-lg text-accent font-bold mb-3 uppercase">📈 Recent Activity</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-retro-gray">Last 24h:</p>
                    <p className="text-accent font-bold">{stats.messages_24h} messages</p>
                  </div>
                  <div>
                    <p className="text-retro-gray">Last 7d:</p>
                    <p className="text-accent font-bold">{stats.messages_7d} messages</p>
                  </div>
                  <div>
                    <p className="text-retro-gray">Last 30d:</p>
                    <p className="text-accent font-bold">{stats.messages_30d} messages</p>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-bg/50 border-2 border-border rounded p-4">
                <h3 className="text-lg text-accent font-bold mb-3 uppercase">📋 Account Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-retro-gray">UID:</span>
                    <span className="text-accent font-mono text-xs">{user.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-retro-gray">Registered:</span>
                    <span className="text-accent">
                      {new Date(user.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-retro-gray">Last Login:</span>
                    <span className="text-accent">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-retro-gray">Last Message:</span>
                    <span className="text-accent">
                      {stats.last_message_at
                        ? new Date(stats.last_message_at).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-retro-gray">Rooms Created:</span>
                    <span className="text-accent font-bold">{stats.rooms_created}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {/* Recent Activity Log */}
              <div className="bg-bg/50 border-2 border-border rounded p-4">
                <h3 className="text-lg text-accent font-bold mb-3 uppercase">⏰ Recent Activity</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {recent_activity && recent_activity.length > 0 ? (
                    recent_activity.map((activity) => (
                      <div
                        key={activity.id}
                        className="border-l-2 border-accent pl-3 py-1 text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-accent font-semibold">
                            {activity.action.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-retro-gray text-xs">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                        {activity.ip_address && (
                          <p className="text-retro-gray text-xs">IP: {activity.ip_address}</p>
                        )}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <p className="text-retro-gray text-xs font-mono mt-1">
                            {JSON.stringify(activity.metadata, null, 2).substring(0, 100)}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-retro-gray">No recent activity</p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              {/* Security Overview */}
              <div className="bg-bg/50 border-2 border-border rounded p-4">
                <h3 className="text-lg text-accent font-bold mb-3 uppercase">🔒 Security Overview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-retro-gray">Threat Score:</p>
                    <p className={`text-2xl font-bold ${
                      threat_score > 50 ? 'text-red-500' :
                      threat_score > 20 ? 'text-retro-amber' :
                      'text-green-500'
                    }`}>
                      {threat_score} / 100
                    </p>
                  </div>
                  <div>
                    <p className="text-retro-gray">Failed Logins:</p>
                    <p className={`text-2xl font-bold ${
                      stats.failed_logins > 5 ? 'text-red-500' : 'text-accent'
                    }`}>
                      {stats.failed_logins}
                    </p>
                  </div>
                  <div>
                    <p className="text-retro-gray">2FA Status:</p>
                    <p className={`text-lg font-bold ${
                      user.two_factor_enabled ? 'text-green-500' : 'text-retro-amber'
                    }`}>
                      {user.two_factor_enabled ? '✅ Enabled' : '⚠️ Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-retro-gray">Unique IPs:</p>
                    <p className="text-lg font-bold text-accent">
                      {ip_history ? ip_history.length : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* IP & Device History */}
              <div className="bg-bg/50 border-2 border-border rounded p-4">
                <h3 className="text-lg text-accent font-bold mb-3 uppercase">🌐 IP & Device History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {ip_history && ip_history.length > 0 ? (
                    ip_history.map((ip, idx) => (
                      <div
                        key={idx}
                        className="border-2 border-border rounded p-3 bg-bg/30"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-accent font-bold font-mono">{ip.ip_address}</span>
                          <span className="text-xs text-retro-gray">
                            {ip.access_count} access{ip.access_count > 1 ? 'es' : ''}
                          </span>
                        </div>
                        {ip.user_agent && (
                          <p className="text-xs text-retro-gray mb-1">
                            🖥️ {ip.user_agent.substring(0, 60)}...
                          </p>
                        )}
                        <div className="flex justify-between text-xs text-retro-gray">
                          <span>First: {new Date(ip.first_seen).toLocaleString()}</span>
                          <span>Last: {new Date(ip.last_seen).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-retro-gray">No IP history found</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-border pt-4 mt-4 flex justify-end gap-2">
          <NeonButton onClick={onClose} variant="secondary">
            Close
          </NeonButton>
        </div>
      </div>
    </div>
  );
}









