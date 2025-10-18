'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NeonButton } from '@/components/ui/NeonButton';
import { RoomInfoModal } from '@/components/admin/RoomInfoModal';
import { Toast } from '@/components/ui/Toast';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  type: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  locked?: boolean;
  locked_reason?: string;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'management'>('admin');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [locking, setLocking] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  useEffect(() => {
    loadRooms();
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

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts
      if (data) {
        const roomsWithCounts = await Promise.all(
          data.map(async (room) => {
            const { count } = await supabase
              .from('members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);

            return { ...room, member_count: count || 0 };
          })
        );

        setRooms(roomsWithCounts);
      }

      setLoading(false);
    } catch (error) {
      console.error('[ADMIN] Load rooms error:', error);
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLockRoom = async () => {
    if (!selectedRoom) return;

    // Only check reason for locking (not unlocking)
    if (!selectedRoom.locked && (!lockReason.trim() || lockReason.length < 10)) {
      showToast('Lock reason must be at least 10 characters', 'warning');
      return;
    }

    setLocking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const action = selectedRoom.locked ? 'unlock' : 'lock';

      const response = await fetch('/api/management/lock-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          action: action,
          reason: lockReason,
          lock_type: 'soft',
        }),
      });

      if (response.ok) {
        showToast(
          `🔒 Room "${selectedRoom.name}" ${action}ed successfully!`,
          'success'
        );
        setShowLockModal(false);
        setLockReason('');
        setSelectedRoom(null);
        loadRooms(); // Reload rooms to show updated status
      } else {
        const error = await response.json();
        showToast(
          error.error || `Failed to ${action} room`,
          'error'
        );
      }
    } catch (error) {
      console.error('[ADMIN] Lock room error:', error);
      showToast('Failed to lock room', 'error');
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

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
              <h1 className="text-2xl uppercase tracking-wider text-accent retro-title">Room Management</h1>
              <p className="text-accent/70 text-sm mt-1">View and manage chat rooms</p>
            </div>
            <Link href="/admin">
              <NeonButton variant="secondary">← Back</NeonButton>
            </Link>
          </div>

          {/* Rooms Table */}
          <div className="bg-bg/50 border-2 border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/10 border-b-2 border-border">
                  <tr>
                    <th className="text-left p-3 text-accent text-sm uppercase">Name</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Type</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Members</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Created</th>
                    <th className="text-left p-3 text-accent text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-accent/50">
                        Loading...
                      </td>
                    </tr>
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-accent/50">
                        No rooms found
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room.id} className="border-b border-border/30 hover:bg-accent/5">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-accent">{room.name}</span>
                            {room.locked && (
                              <span className="text-red-500 text-xs" title={room.locked_reason}>
                                🔒
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs uppercase ${
                              room.type === 'private'
                                ? 'bg-retro-amber/20 text-retro-amber'
                                : 'bg-accent/20 text-accent'
                            }`}
                          >
                            {room.type}
                          </span>
                        </td>
                        <td className="p-3 text-accent">{room.member_count}</td>
                        <td className="p-3 text-accent/70 text-sm">
                          {new Date(room.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRoom(room);
                              setShowInfoModal(true);
                            }}
                            className="text-accent hover:text-accent/70 text-sm"
                          >
                            [Info]
                          </button>
                          <Link href={`/room/${room.id}`} className="text-accent hover:text-accent/70 text-sm">
                            [View]
                          </Link>
                          {userRole === 'management' && (
                            <button
                              onClick={() => {
                                setSelectedRoom(room);
                                setShowLockModal(true);
                                if (room.locked) {
                                  setLockReason('Unlocking room');
                                } else {
                                  setLockReason('');
                                }
                              }}
                              className={`text-sm ${
                                room.locked
                                  ? 'text-green-500 hover:text-green-400'
                                  : 'text-retro-amber hover:text-retro-amber/70'
                              }`}
                            >
                              [{room.locked ? 'Unlock' : 'Lock'}]
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

          {/* Room Info Modal */}
          {selectedRoom && showInfoModal && (
            <RoomInfoModal
              room={selectedRoom}
              isOpen={showInfoModal}
              onClose={() => {
                setShowInfoModal(false);
                setSelectedRoom(null);
              }}
              userRole={userRole}
            />
          )}

          {/* Lock Modal */}
          {showLockModal && selectedRoom && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <div className="terminal max-w-lg w-full">
                <h2 className="text-xl text-accent uppercase mb-4">
                  {selectedRoom.locked ? '🔓 Unlock Room' : '🔒 Lock Room'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-accent/70 text-sm mb-2">
                      Room: <span className="text-accent font-semibold">{selectedRoom.name}</span>
                    </p>
                    {selectedRoom.locked && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded p-3 mb-3">
                        <p className="text-red-400 text-sm">
                          Current reason: {selectedRoom.locked_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {!selectedRoom.locked && (
                    <div>
                      <label className="block text-sm text-accent mb-2 uppercase">
                        Reason (min 10 chars) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={lockReason}
                        onChange={(e) => setLockReason(e.target.value)}
                        className="w-full bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none"
                        rows={3}
                        placeholder="Spam, inappropriate content, rule violations, etc..."
                      />
                      <p className="text-accent/50 text-xs mt-1">
                        Characters: {lockReason.length}/10 minimum
                      </p>
                    </div>
                  )}

                  {!selectedRoom.locked && (
                    <div className="bg-retro-amber/10 border border-retro-amber/50 rounded p-3">
                      <p className="text-retro-amber text-xs">
                        <strong>⚠️ WARNING:</strong> Locking a room will:
                      </p>
                      <ul className="text-retro-amber/80 text-xs mt-2 space-y-1 ml-4">
                        <li>• Make the room read-only (no new messages)</li>
                        <li>• Display a warning banner to all users</li>
                        <li>• Show the lock reason publicly</li>
                        <li>• Log this action in audit logs</li>
                        <li>• Can be unlocked by Management later</li>
                      </ul>
                    </div>
                  )}

                  {selectedRoom.locked && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded p-3">
                      <p className="text-green-400 text-sm">
                        ✓ Unlocking will restore normal room access and remove the warning banner.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowLockModal(false);
                        setLockReason('');
                        setSelectedRoom(null);
                      }}
                      className="retro-button flex-1"
                      disabled={locking}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLockRoom}
                      className={`retro-button flex-1 ${
                        selectedRoom.locked ? 'bg-green-500' : 'bg-retro-amber'
                      }`}
                      disabled={locking || (!selectedRoom.locked && lockReason.length < 10)}
                    >
                      {locking
                        ? selectedRoom.locked
                          ? 'Unlocking...'
                          : 'Locking...'
                        : selectedRoom.locked
                        ? '🔓 Unlock Room'
                        : '🔒 Lock Room'}
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

