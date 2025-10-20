'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import { DashboardStats } from '@/components/admin/DashboardStats';

interface Stats {
  total_admins: number;
  active_admins: number;
  suspended_admins: number;
  total_bans_today: number;
  total_actions_today: number;
  total_users: number;
  total_rooms: number;
  total_messages: number;
  active_threats: number;
  pending_reports: number;
}

interface RecentActivity {
  id: string;
  admin_uid: string;
  action_type: string;
  target_id: string | null;
  action_details: any;
  success: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'management' | null>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string>('');

  useEffect(() => {
    loadDashboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setCurrentUserUid(session.user.id);

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('uid', session.user.id)
        .single();

      if (userData) {
        setUserRole(userData.role as 'admin' | 'management');
      }

      // Get stats from API
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }

      // Get recent activity (last 3 only)
      const { data: actions } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (actions) {
        setRecentActivity(actions);
      }

      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Dashboard load error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-page">
        <div className="particles-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div className="login-form">
          <div className="terminal max-w-md w-full">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <p className="text-accent animate-pulse">Loading admin panel...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-7xl mx-auto">
        <div className="terminal space-y-6">
          {/* Header */}
          <div className="border-b-2 border-border pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl uppercase tracking-[0.2em] text-accent retro-title">
                    Admin Panel
                  </h1>
                  <p className="text-accent/70 text-sm retro-text mt-1">
                    Role: {userRole?.toUpperCase()} • System Management
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Users */}
            <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-6 hover:border-accent transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent/70 text-sm uppercase tracking-wider mb-1">Total Users</p>
                  <p className="text-accent text-3xl font-bold">{stats?.total_users || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Rooms */}
            <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-6 hover:border-accent transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent/70 text-sm uppercase tracking-wider mb-1">Total Rooms</p>
                  <p className="text-accent text-3xl font-bold">{stats?.total_rooms || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Messages */}
            <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-6 hover:border-accent transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent/70 text-sm uppercase tracking-wider mb-1">Total Messages</p>
                  <p className="text-accent text-3xl font-bold">{stats?.total_messages?.toLocaleString() || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Threats */}
            <div className="bg-bg/50 border-2 border-retro-amber/30 rounded-lg p-6 hover:border-retro-amber transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-retro-amber/70 text-sm uppercase tracking-wider mb-1">Active Threats</p>
                  <p className="text-retro-amber text-3xl font-bold">{stats?.active_threats || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-retro-amber/10 border border-retro-amber flex items-center justify-center">
                  <svg className="w-6 h-6 text-retro-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pending Reports */}
            <Link href="/admin/reports" className="block">
              <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-6 hover:border-accent transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-accent/70 text-sm uppercase tracking-wider mb-1">Pending Reports</p>
                    <p className="text-accent text-3xl font-bold">{stats?.pending_reports || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Bans Today */}
            <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-6 hover:border-accent transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent/70 text-sm uppercase tracking-wider mb-1">Bans Today</p>
                  <p className="text-accent text-3xl font-bold">{stats?.total_bans_today || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Modern Menu */}
          <div className="bg-bg/30 border-2 border-border rounded-lg p-6">
            <h2 className="text-xl uppercase tracking-wider text-accent font-semibold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link href="/admin/chat" className="block group">
                <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/50 rounded-lg p-6 hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 h-full transform hover:-translate-y-1">
                  <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <svg className="w-10 h-10 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span className="block text-center text-sm text-accent font-bold uppercase tracking-wider">Admin Chat</span>
                </div>
              </Link>

              <Link href="/admin/users" className="block group">
                <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/50 rounded-lg p-6 hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 h-full transform hover:-translate-y-1">
                  <svg className="w-10 h-10 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="block text-center text-sm text-accent font-bold uppercase tracking-wider">Users</span>
                </div>
              </Link>

              <Link href="/admin/rooms" className="block group">
                <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/50 rounded-lg p-6 hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 h-full transform hover:-translate-y-1">
                  <svg className="w-10 h-10 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="block text-center text-sm text-accent font-bold uppercase tracking-wider">Rooms</span>
                </div>
              </Link>

              <Link href="/admin/threats" className="block group">
                <div className="relative bg-gradient-to-br from-retro-amber/10 to-retro-amber/5 border-2 border-retro-amber/50 rounded-lg p-6 hover:border-retro-amber hover:shadow-lg hover:shadow-retro-amber/20 transition-all duration-300 h-full transform hover:-translate-y-1">
                  <div className="absolute top-2 right-2 w-2 h-2 bg-retro-amber rounded-full animate-pulse"></div>
                  <svg className="w-10 h-10 text-retro-amber mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="block text-center text-sm text-retro-amber font-bold uppercase tracking-wider">Threats</span>
                </div>
              </Link>

              <Link href="/admin/audit-logs" className="block group">
                <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/50 rounded-lg p-6 hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 h-full transform hover:-translate-y-1">
                  <svg className="w-10 h-10 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="block text-center text-sm text-accent font-bold uppercase tracking-wider">Audit Logs</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-bg/50 border-2 border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl uppercase tracking-wider text-accent font-semibold">Recent Activity</h2>
              <button
                onClick={loadDashboard}
                className="text-accent/50 hover:text-accent transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {recentActivity.length === 0 ? (
                <p className="text-accent/50 text-center py-8">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`border-l-4 ${
                      activity.success ? 'border-accent' : 'border-retro-amber'
                    } bg-bg/30 p-3 text-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-accent font-mono">
                          {activity.action_type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-accent/70 text-xs mt-1">
                          Admin: {activity.admin_uid.substring(0, 12)}...
                          {activity.target_id && ` • Target: ${activity.target_id.substring(0, 12)}...`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent/50 text-xs">
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                        {activity.success ? (
                          <span className="text-accent text-xs">✓ Success</span>
                        ) : (
                          <span className="text-retro-amber text-xs">✗ Failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-accent/70 space-y-1">
                <p className="font-semibold text-accent">ADMIN PANEL FEATURES:</p>
                {userRole === 'admin' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>View audit logs, threats, and reports</li>
                    <li>Ban users (max 5/hour, 24h max duration)</li>
                    <li>Delete spam messages (max 10/hour)</li>
                    <li>Quota limits apply to prevent abuse</li>
                  </ul>
                )}
                {userRole === 'management' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full admin capabilities + no limits</li>
                    <li>Manage admins (suspend, promote, demote)</li>
                    <li>System configuration and settings</li>
                    <li>IP whitelist and advanced security</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

