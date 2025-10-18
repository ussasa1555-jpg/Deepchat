'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';

interface Room {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
  locked?: boolean;
  locked_reason?: string;
  locked_at?: string;
}

export default function PublicRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [canCreateRoom, setCanCreateRoom] = useState(true);
  const [roomsCreatedToday, setRoomsCreatedToday] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'date'>('members');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRooms();
    checkDailyLimit();
    
    // Subscribe to member changes for realtime count updates
    const channel = supabase
      .channel('public-rooms-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
        },
        () => {
          // Reload rooms when any member joins/leaves
          loadRooms();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkDailyLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('uid', user.id)
        .single();
      
      const userIsAdmin = userData?.is_admin || false;
      setIsAdmin(userIsAdmin);
      
      // Admins have no limit
      if (userIsAdmin) {
        setCanCreateRoom(true);
        setRoomsCreatedToday(0);
        return;
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('created_by', user.id)
        .eq('type', 'public')
        .gte('created_at', today);

      if (error) throw error;
      
      const count = data?.length || 0;
      setRoomsCreatedToday(count);
      setCanCreateRoom(count < 1);
    } catch (err) {
      console.error('Error checking room limit:', err);
    }
  };

  const loadRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('type', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load member count for each room
      if (roomsData) {
        const roomsWithCount = await Promise.all(
          roomsData.map(async (room) => {
            const { count } = await supabase
              .from('members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);
            
            return {
              ...room,
              member_count: count || 0,
            };
          })
        );
        setRooms(roomsWithCount);
      }
    } catch (err: any) {
      console.error('Error loading rooms:', err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // user.id is now the UID (after our changes)
      const uid = user.id;

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          description: roomDescription || null,
          type: 'public',
          created_by: uid,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Trigger automatically adds creator as admin member
      // No need to manually insert into members table
      
      // Reset form and reload
      setRoomName('');
      setRoomDescription('');
      setShowCreateForm(false);
      loadRooms();
      checkDailyLimit(); // Recheck limit after creating
    } catch (err: any) {
      console.error('Error creating room:', err);
      
      // Check if it's the daily limit error
      if (err.message && err.message.includes('Daily public room creation limit')) {
        setError('⚠️ Daily limit reached: You can only create 1 public room per day.');
      } else {
        setError(`Error: ${err.message || 'Room creation failed'}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-5xl mx-auto">
        <div className="terminal space-y-6">
          {/* Header with Icon */}
          <div className="border-b-2 border-border pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl uppercase tracking-[0.2em] text-accent retro-title">
                    Public Rooms
                  </h1>
                  <p className="text-accent/70 text-sm retro-text mt-1">
                    Join community chat rooms
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

        {/* Create Room Button */}
        <div>
          {!canCreateRoom && !isAdmin && (
            <div className="border border-accent p-4 bg-surface/50 backdrop-blur-sm rounded-lg mb-4">
              <p className="text-accent text-sm font-mono">
                🔒 Daily limit reached: You can only create 1 public room per day.
              </p>
              <p className="text-retro-gray text-xs mt-2">
                You created {roomsCreatedToday} room(s) today. Try again tomorrow.
              </p>
            </div>
          )}
          {isAdmin && (
            <div className="border border-success p-3 bg-success/10 mb-4">
              <p className="text-success text-sm font-mono">
                🔓 Admin Mode: No room creation limits
              </p>
            </div>
          )}
          <NeonButton
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full"
            disabled={!canCreateRoom}
          >
            {showCreateForm ? '[Cancel]' : canCreateRoom ? '[Create New Room]' : '[Limit Reached - 1/Day]'}
          </NeonButton>
        </div>

        {/* Create Room Form */}
        {showCreateForm && (
          <TerminalPanel header="CREATE PUBLIC ROOM">
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-accent uppercase">
                  Room Name (3-50 chars)
                </label>
                <CLIInput
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="The Cipher Lounge"
                  required
                  minLength={3}
                  maxLength={50}
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-accent uppercase">
                  Description (optional, max 200 chars)
                </label>
                <CLIInput
                  type="text"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="A space for encrypted chat enthusiasts"
                  maxLength={200}
                  disabled={creating}
                />
              </div>

              {error && (
                <div className="border border-retro-amber p-3 bg-retro-amber/10">
                  <p className="text-retro-amber text-sm font-mono">{error}</p>
                </div>
              )}

              <NeonButton type="submit" disabled={creating} className="w-full">
                {creating ? '[Creating...]' : '[Create Room]'}
              </NeonButton>
            </form>
          </TerminalPanel>
        )}

        {/* Loading State */}
        {loading && (
          <TerminalPanel>
            <p className="text-accent">Loading rooms...</p>
          </TerminalPanel>
        )}

        {/* Empty State */}
        {!loading && rooms.length === 0 && (
          <TerminalPanel>
            <p className="text-accent text-center py-8">
              No rooms yet. Create one!
            </p>
          </TerminalPanel>
        )}

        {/* Search and Sort Controls */}
        {!loading && rooms.length > 0 && (
          <div className="terminal mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Search Rooms</p>
                <div className="border-2 border-accent p-2 bg-surface/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">&gt;</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by name..."
                      className="bg-transparent border-none outline-none text-accent font-mono text-sm flex-1 placeholder:text-muted/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-accent hover:text-error text-xs"
                      >
                        [Clear]
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sort Controls */}
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Sort By</p>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 bg-surface border-2 border-accent text-accent font-mono text-sm p-2 rounded-lg outline-none"
                  >
                    <option value="members">Member Count</option>
                    <option value="name">Room Name</option>
                    <option value="date">Creation Date</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="retro-button border-accent text-accent hover:bg-accent hover:text-background px-4"
                  >
                    [{sortOrder === 'asc' ? '↑' : '↓'}]
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rooms List */}
        {!loading && rooms.length > 0 && (
          <TerminalPanel header={`AVAILABLE_ROOMS (${
            rooms.filter(room => 
              room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (room.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
            ).length
          })`}>
            <div className="space-y-2">
              {rooms
                .filter(room => 
                  room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (room.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
                )
                .sort((a, b) => {
                  let comparison = 0;
                  
                  switch (sortBy) {
                    case 'members':
                      comparison = (a.member_count || 0) - (b.member_count || 0);
                      break;
                    case 'name':
                      comparison = a.name.localeCompare(b.name);
                      break;
                    case 'date':
                      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      break;
                  }
                  
                  return sortOrder === 'asc' ? comparison : -comparison;
                })
                .map((room) => (
                <div
                  key={room.id}
                  className={`border p-2 transition-all ${
                    room.locked
                      ? 'border-red-500 bg-red-500/5 hover:border-red-400'
                      : 'border-border bg-surface/20 hover:border-accent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`status-led flex-shrink-0 ${room.locked ? 'offline' : 'online'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-mono font-bold text-sm truncate ${
                            room.locked ? 'text-red-500' : 'text-accent'
                          }`}>
                            {room.name}
                          </p>
                          {room.locked && (
                            <span className="text-red-500 text-xs animate-pulse" title={room.locked_reason}>
                              🔒
                            </span>
                          )}
                        </div>
                        {room.description && (
                          <p className={`text-xs truncate ${
                            room.locked ? 'text-red-400/70' : 'text-muted'
                          }`}>
                            {room.description}
                          </p>
                        )}
                        {room.locked && room.locked_reason && (
                          <p className="text-xs text-red-400 font-mono truncate mt-1">
                            [LOCKED: {room.locked_reason}]
                          </p>
                        )}
                      </div>
                      <span className="text-accent text-xs font-mono flex-shrink-0">
                        {room.member_count || 0} Online
                      </span>
                    </div>
                    <Link href={`/room/${room.id}`}>
                      <NeonButton variant="secondary">
                        [Enter]
                      </NeonButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* No Results */}
            {rooms.filter(room => 
              room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (room.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
            ).length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border">
                <p className="text-muted text-sm">No rooms match your search</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-accent text-xs mt-2 hover:underline"
                >
                  [Clear Search]
                </button>
              </div>
            )}
          </TerminalPanel>
        )}
        </div>
      </div>
    </div>
  );
}

