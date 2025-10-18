'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import Link from 'next/link';

interface User {
  uid: string;
  nickname: string;
  email: string;
  role: string;
  two_factor_enabled: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'management'>('admin');
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState(24);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCurrentRole();
  }, []);

  const loadCurrentRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('uid', session.user.id)
      .single();

    if (data) {
      setUserRole(data.role as 'admin' | 'management');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('uid, nickname, email, role, two_factor_enabled, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Load users error:', error);
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;

    setBanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          uid: selectedUser.uid,
          reason: banReason,
          duration_hours: banDuration,
        }),
      });

      if (response.ok) {
        alert('User banned successfully');
        setShowBanModal(false);
        setBanReason('');
        setSelectedUser(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to ban user');
      }
    } catch (error) {
      console.error('[ADMIN] Ban error:', error);
      alert('Failed to ban user');
    } finally {
      setBanning(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nickname.toLowerCase().includes(search.toLowerCase()) ||
      u.uid.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 login-page">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-7xl mx-auto">
        <div className="terminal space-y-6">
          {/* Header */}
          <div className="border-b-2 border-border pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl uppercase tracking-wider text-accent retro-title">User Management</h1>
              <p className="text-accent/70 text-sm mt-1">View and manage users</p>
            </div>
            <Link href="/admin">
              <NeonButton variant="secondary">← Back</NeonButton>
            </Link>
          </div>

          {/* Search */}
          <div>
            <CLIInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by UID, nickname, or email..."
            />
          </div>

          {/* Users Table */}
          <div className="bg-bg/50 border-2 border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/10 border-b-2 border-border">
                  <tr>
                    <th className="text-left p-3 text-accent text-sm uppercase">UID</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Nickname</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Email</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Role</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">2FA</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Created</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-accent/50">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-accent/50">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.uid} className="border-b border-border/30 hover:bg-accent/5">
                        <td className="p-3 text-accent font-mono text-xs">{user.uid.substring(0, 15)}...</td>
                        <td className="p-3 text-accent">{user.nickname}</td>
                        <td className="p-3 text-accent/70 text-sm">{user.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs uppercase ${
                              user.role === 'management'
                                ? 'bg-accent/20 text-accent'
                                : user.role === 'admin'
                                ? 'bg-retro-amber/20 text-retro-amber'
                                : 'bg-border/20 text-accent/50'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {user.two_factor_enabled ? (
                            <span className="text-accent">✓</span>
                          ) : (
                            <span className="text-accent/30">✗</span>
                          )}
                        </td>
                        <td className="p-3 text-accent/70 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className="text-accent hover:text-accent/70 text-sm"
                          >
                            [Details]
                          </button>
                          {user.role === 'user' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }}
                              className="text-retro-amber hover:text-retro-amber/70 text-sm"
                            >
                              [Ban]
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          uid={selectedUser.uid}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <div className="terminal max-w-lg w-full">
                <h2 className="text-xl text-accent uppercase mb-4">Ban User</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-accent/70 text-sm mb-2">User: {selectedUser.nickname} ({selectedUser.uid})</p>
                  </div>

                  <div>
                    <label className="block text-sm text-accent mb-2 uppercase">Reason (min 10 chars)</label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
                      rows={3}
                      placeholder="Spam flooding, harassment, etc..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-accent mb-2 uppercase">Duration</label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(Number(e.target.value))}
                      className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={24}>24 hours{userRole === 'admin' ? ' (max)' : ''}</option>
                      {userRole === 'management' && (
                        <>
                          <option value={168}>7 days</option>
                          <option value={720}>30 days</option>
                          <option value={0}>Permanent</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowBanModal(false);
                        setBanReason('');
                        setSelectedUser(null);
                      }}
                      className="retro-button flex-1"
                      disabled={banning}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBanUser}
                      className="retro-button bg-retro-amber flex-1"
                      disabled={banning || banReason.length < 10}
                    >
                      {banning ? 'Banning...' : 'Ban User'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

