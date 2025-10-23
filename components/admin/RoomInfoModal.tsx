'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RoleBadge } from '@/components/ui/RoleBadge';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  type: string;
  description: string | null;
  created_by: string;
  created_at: string;
  locked?: boolean;
  locked_reason?: string;
}

interface RoomInfoModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'management';
}

interface Stats {
  memberCount: number;
  messageCount: number;
  todayMessageCount: number;
}

interface Member {
  uid: string;
  role: string;
  joined_at: string;
  users?: {
    nickname: string;
    role?: string;
  };
}

export function RoomInfoModal({ room, isOpen, onClose, userRole }: RoomInfoModalProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingKey, setLoadingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRoomDetails();
    }
  }, [isOpen, room.id]);

  const loadRoomDetails = async () => {
    setLoading(true);
    try {
      // Get message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      // Get today's message count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayMessageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .gte('created_at', today);

      // Get member count
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      // Get members with details
      const { data: membersData } = await supabase
        .from('members')
        .select(`
          uid,
          role,
          joined_at,
          users:uid (nickname, role)
        `)
        .eq('room_id', room.id)
        .order('joined_at', { ascending: true });

      setStats({
        memberCount: memberCount || 0,
        messageCount: messageCount || 0,
        todayMessageCount: todayMessageCount || 0,
      });
      setMembers(membersData || []);

      // Load key if private room and user is management
      if (room.type === 'private' && userRole === 'management') {
        await loadRoomKey();
      }

      setLoading(false);
    } catch (error) {
      console.error('[ROOM_INFO] Load details error:', error);
      setLoading(false);
    }
  };

  const loadRoomKey = async () => {
    setLoadingKey(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/management/get-room-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ room_id: room.id }),
      });

      if (response.ok) {
        const { key } = await response.json();
        setRoomKey(key);
      }
    } catch (error) {
      console.error('[ROOM_INFO] Load key error:', error);
    } finally {
      setLoadingKey(false);
    }
  };

  const copyKey = () => {
    if (roomKey) {
      navigator.clipboard.writeText(roomKey);
      alert('Key copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="terminal max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="border-b-2 border-border pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-accent uppercase tracking-wider">Room Details</h2>
            <p className="text-accent/70 text-sm mt-1">{room.name}</p>
          </div>
          <button onClick={onClose} className="retro-button text-sm">
            ✕ Close
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-accent/50">Loading room details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-accent uppercase text-sm mb-3 font-semibold">Basic Information</h3>
              <div className="bg-bg/50 border-2 border-border rounded-lg p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-accent/70">Name:</span>
                    <span className="text-accent ml-2 font-semibold">{room.name}</span>
                  </div>
                  <div>
                    <span className="text-accent/70">Type:</span>
                    <span
                      className={`ml-2 uppercase font-semibold ${
                        room.type === 'private' ? 'text-retro-amber' : 'text-accent'
                      }`}
                    >
                      {room.type}
                    </span>
                  </div>
                  {room.description && (
                    <div className="col-span-2">
                      <span className="text-accent/70">Description:</span>
                      <span className="text-accent ml-2">{room.description}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-accent/70">Created:</span>
                    <span className="text-accent ml-2">{new Date(room.created_at).toLocaleString()}</span>
                  </div>
                  {room.locked && (
                    <div className="col-span-2 mt-2 p-3 bg-red-500/10 border-2 border-red-500 rounded">
                      <p className="text-red-500 font-semibold">🔒 LOCKED</p>
                      <p className="text-red-400 text-xs mt-1">{room.locked_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Private Room Key (Management Only) */}
            {room.type === 'private' && userRole === 'management' && (
              <div>
                <h3 className="text-retro-amber uppercase text-sm mb-3 font-semibold flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Room Key (Management Only)</span>
                </h3>
                <div className="bg-retro-amber/10 border-2 border-retro-amber rounded-lg p-6">
                  {loadingKey ? (
                    <p className="text-center text-retro-amber/50">Loading key...</p>
                  ) : roomKey && roomKey !== '[KEY_NOT_STORED]' ? (
                    <>
                      <div className="bg-bg/80 border border-retro-amber/50 rounded p-4 mb-4">
                        <p className="text-retro-amber text-2xl font-mono font-bold tracking-[0.3em] text-center">
                          {roomKey}
                        </p>
                      </div>
                      <button onClick={copyKey} className="retro-button w-full mb-3">
                        📋 Copy Key to Clipboard
                      </button>
                      <div className="bg-retro-amber/10 border border-retro-amber/30 rounded p-3">
                        <p className="text-retro-amber/70 text-xs">
                          <strong>⚠️ SECURITY WARNING:</strong> Never share this key publicly. This key
                          grants full access to the room. Key views are logged.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-retro-amber/50 text-sm mb-2">
                        Key not recoverable (created before key storage system)
                      </p>
                      <p className="text-accent/50 text-xs">
                        Only new private rooms have recoverable keys
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div>
              <h3 className="text-accent uppercase text-sm mb-3 font-semibold">Statistics</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-4 text-center hover:border-accent transition-colors">
                  <p className="text-accent text-3xl font-bold">{stats?.memberCount || 0}</p>
                  <p className="text-accent/70 text-xs uppercase mt-1">Members</p>
                </div>
                <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-4 text-center hover:border-accent transition-colors">
                  <p className="text-accent text-3xl font-bold">{stats?.messageCount || 0}</p>
                  <p className="text-accent/70 text-xs uppercase mt-1">Total Messages</p>
                </div>
                <div className="bg-bg/50 border-2 border-accent/30 rounded-lg p-4 text-center hover:border-accent transition-colors">
                  <p className="text-accent text-3xl font-bold">{stats?.todayMessageCount || 0}</p>
                  <p className="text-accent/70 text-xs uppercase mt-1">Today</p>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div>
              <h3 className="text-accent uppercase text-sm mb-3 font-semibold">
                Members ({members.length})
              </h3>
              <div className="bg-bg/50 border-2 border-border rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <p className="text-center text-accent/50 py-4">No members</p>
                  ) : (
                    members.map((member, idx) => (
                      <div
                        key={member.uid}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-accent/50 text-sm w-6">{idx + 1}.</span>
                          <span className="text-accent font-mono">{member.users?.nickname || member.uid}</span>
                          {member.users?.role && <RoleBadge role={member.users.role as any} short />}
                        </div>
                        <span
                          className={`text-xs uppercase px-2 py-1 rounded ${
                            member.role === 'admin'
                              ? 'bg-retro-amber/20 text-retro-amber'
                              : 'bg-accent/20 text-accent'
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t-2 border-border">
              <Link href={`/room/${room.id}`} className="flex-1">
                <button className="retro-button w-full">
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>View Room</span>
                  </span>
                </button>
              </Link>
              <button onClick={onClose} className="retro-button flex-1">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}












