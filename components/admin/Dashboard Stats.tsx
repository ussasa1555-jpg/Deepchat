'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SystemStats {
  users_total: number;
  users_online: number;
  users_24h: number;
  users_7d: number;
  users_30d: number;
  rooms_total: number;
  rooms_public: number;
  rooms_private: number;
  rooms_admin: number;
  rooms_locked: number;
  messages_total: number;
  messages_24h: number;
  messages_7d: number;
  threats_active: number;
  threats_high: number;
  threats_total: number;
  bans_active: number;
  failed_logins_1h: number;
  failed_logins_24h: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_stats');
      if (error) throw error;
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('[DASHBOARD] Load stats error:', error);
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-bg/50 border-2 border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-border rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <StatCard
          title="Total Users"
          value={stats.users_total.toLocaleString()}
          subtitle={`${stats.users_24h} new today`}
          icon="👥"
          color="accent"
        />
        
        {/* Rooms */}
        <StatCard
          title="Total Rooms"
          value={stats.rooms_total.toLocaleString()}
          subtitle={`${stats.rooms_public} public, ${stats.rooms_private} private`}
          icon="🏠"
          color="accent"
        />
        
        {/* Messages */}
        <StatCard
          title="Total Messages"
          value={stats.messages_total.toLocaleString()}
          subtitle={`${stats.messages_24h.toLocaleString()} today`}
          icon="💬"
          color="accent"
        />
        
        {/* Threats */}
        <StatCard
          title="Active Threats"
          value={stats.threats_active.toLocaleString()}
          subtitle={`${stats.threats_high} high severity`}
          icon="⚠️"
          color={stats.threats_active > 10 ? "red" : stats.threats_active > 0 ? "amber" : "green"}
        />
      </div>

      {/* Activity Stats */}
      <div className="bg-bg/50 border-2 border-border rounded-lg p-6">
        <h3 className="text-lg text-accent font-bold mb-4 uppercase">📊 Activity Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-retro-gray uppercase">Users (7d)</p>
            <p className="text-2xl text-accent font-bold">{stats.users_7d}</p>
          </div>
          <div>
            <p className="text-xs text-retro-gray uppercase">Users (30d)</p>
            <p className="text-2xl text-accent font-bold">{stats.users_30d}</p>
          </div>
          <div>
            <p className="text-xs text-retro-gray uppercase">Messages (7d)</p>
            <p className="text-2xl text-accent font-bold">{stats.messages_7d.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-retro-gray uppercase">Active Bans</p>
            <p className="text-2xl text-retro-amber font-bold">{stats.bans_active}</p>
          </div>
        </div>
      </div>

      {/* Security Stats */}
      <div className="bg-bg/50 border-2 border-border rounded-lg p-6">
        <h3 className="text-lg text-accent font-bold mb-4 uppercase">🔒 Security Monitor</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-retro-gray uppercase">Failed Logins (1h)</p>
            <p className={`text-2xl font-bold ${stats.failed_logins_1h > 10 ? 'text-red-500' : 'text-accent'}`}>
              {stats.failed_logins_1h}
            </p>
          </div>
          <div>
            <p className="text-xs text-retro-gray uppercase">Failed Logins (24h)</p>
            <p className={`text-2xl font-bold ${stats.failed_logins_24h > 50 ? 'text-red-500' : 'text-accent'}`}>
              {stats.failed_logins_24h}
            </p>
          </div>
          <div>
            <p className="text-xs text-retro-gray uppercase">Total Threats</p>
            <p className="text-2xl text-retro-amber font-bold">{stats.threats_total}</p>
          </div>
          <div>
            <p className="text-xs text-retro-gray uppercase">Locked Rooms</p>
            <p className="text-2xl text-accent font-bold">{stats.rooms_locked}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color?: 'accent' | 'red' | 'amber' | 'green';
}

function StatCard({ title, value, subtitle, icon, color = 'accent' }: StatCardProps) {
  const colors = {
    accent: 'border-accent text-accent',
    red: 'border-red-500 text-red-500',
    amber: 'border-retro-amber text-retro-amber',
    green: 'border-green-500 text-green-500',
  };

  return (
    <div className={`bg-bg/50 border-2 ${colors[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider opacity-70">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
    </div>
  );
}




