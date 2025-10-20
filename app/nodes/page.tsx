'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import { usePresence } from '@/lib/PresenceProvider';

interface Node {
  id: string;
  owner_uid: string;
  peer_uid: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  owner?: {
    nickname: string;
  };
  peer?: {
    nickname: string;
  };
}

interface FriendWithUnread {
  node_id: string;
  friend_uid: string;
  friend_nickname: string;
  thread_id: string | null;
  unread_count: number;
}

export default function NodesPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Node[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Node[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<Node[]>([]);
  const [friendsWithUnread, setFriendsWithUnread] = useState<FriendWithUnread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<{ nodeId: string; nickname: string } | null>(null);
  
  const { isUserOnline } = usePresence();

  useEffect(() => {
    init();
  }, []);

  // Real-time subscription for DM message updates
  useEffect(() => {
    if (!currentUserUid) return;

    const channel = supabase
      .channel('dm_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
        },
        () => {
          // Reload unread counts when any new message arrives
          loadUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dm_participants',
        },
        () => {
          // Reload unread counts when someone reads messages
          loadUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
        },
        () => {
          // Reload nodes when friend requests change
          loadNodes(currentUserUid);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserUid]);

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // user.id is now the UID (after our changes)
      const uid = user.id;
      setCurrentUserUid(uid);
      loadNodes(uid);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('nodes')
        .select(`
          *,
          owner:owner_uid (nickname),
          peer:peer_uid (nickname)
        `)
        .or(`owner_uid.eq.${uid},peer_uid.eq.${uid}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allNodes = data || [];
      setNodes(allNodes);
      
      // Separate into categories
      const incoming = allNodes.filter(n => n.peer_uid === uid && n.status === 'pending');
      const outgoing = allNodes.filter(n => n.owner_uid === uid && n.status === 'pending');
      const accepted = allNodes.filter(n => n.status === 'accepted');
      
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setAcceptedFriends(accepted);
      
      // Load unread counts for accepted friends
      if (accepted.length > 0) {
        loadUnreadCounts();
      }
    } catch (err) {
      console.error('Error loading nodes:', err);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('v_friend_dm_status')
        .select('*');

      if (error) {
        console.error('Error loading unread counts:', error);
        return;
      }

      setFriendsWithUnread(data || []);
    } catch (err: any) {
      console.error('Error loading unread counts:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResult(null);

    try {
      // Search by UID or nickname (case-insensitive, partial match)
      // Exclude current user from results
      const trimmedQuery = searchQuery.trim();
      
      const { data, error } = await supabase
        .from('users')
        .select('uid, nickname')
        .or(`uid.ilike.%${trimmedQuery}%,nickname.ilike.%${trimmedQuery}%`)
        .neq('uid', currentUserUid)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Search error:', error);
        setSearchResult({ error: '[ERROR] SEARCH_FAILED' });
      } else if (!data) {
        setSearchResult({ error: '[ERROR_404] NODE_NOT_FOUND' });
      } else {
        setSearchResult(data);
      }
    } catch (err) {
      console.error('Search exception:', err);
      setSearchResult({ error: '[ERROR] SEARCH_FAILED' });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUid: string) => {
    if (!currentUserUid) return;

    // Kendine istek göndermeyi engelle
    if (currentUserUid === targetUid) {
      alert('[ERROR] CANNOT_ADD_SELF');
      return;
    }

    try {
      console.log('Sending friend request:', {
        owner_uid: currentUserUid,
        peer_uid: targetUid,
      });

      const { data, error } = await supabase.from('nodes').insert({
        owner_uid: currentUserUid,
        peer_uid: targetUid,
        status: 'pending',
      }).select();

      if (error) {
        console.error('Supabase error:', error);
        
        // Duplicate request kontrolü
        if (error.code === '23505') {
          alert('[ERROR] REQUEST_ALREADY_EXISTS');
          return;
        }
        
        throw error;
      }

      console.log('Friend request sent:', data);
      setSearchResult(null);
      setSearchQuery('');
      loadNodes(currentUserUid);
    } catch (err: any) {
      console.error('Error sending request:', err);
      alert(`[ERROR] REQUEST_FAILED: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancelRequest = async (nodeId: string) => {
    if (!currentUserUid) return;

    try {
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      loadNodes(currentUserUid);
    } catch (err: any) {
      console.error('Error canceling request:', err);
      alert('[ERROR] CANCEL_FAILED');
    }
  };

  const handleAcceptRequest = async (nodeId: string) => {
    if (!currentUserUid) return;

    try {
      const { error } = await supabase
        .from('nodes')
        .update({ status: 'accepted' })
        .eq('id', nodeId);

      if (error) throw error;

      loadNodes(currentUserUid);
    } catch (err: any) {
      console.error('Error accepting request:', err);
      alert('[ERROR] ACCEPT_FAILED');
    }
  };

  const handleRejectRequest = async (nodeId: string) => {
    if (!currentUserUid) return;

    try {
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      loadNodes(currentUserUid);
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert('[ERROR] REJECT_FAILED');
    }
  };

  const handleDeleteFriend = async (nodeId: string, nickname: string) => {
    if (!currentUserUid) return;
    
    // Show confirmation modal
    setFriendToDelete({ nodeId, nickname });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFriend = async () => {
    if (!friendToDelete || !currentUserUid) return;

    try {
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('id', friendToDelete.nodeId);

      if (error) throw error;

      loadNodes(currentUserUid);
      setShowDeleteConfirm(false);
      setFriendToDelete(null);
    } catch (err: any) {
      console.error('Error deleting friend:', err);
      alert('[ERROR] DELETE_FAILED');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TerminalPanel>
          <p className="text-accent">[LOADING_NETWORK_NODES...]</p>
        </TerminalPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-6xl mx-auto">
        <div className="terminal space-y-6">
          {/* Header with Icon */}
          <div className="border-b-2 border-border pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl uppercase tracking-[0.2em] text-accent retro-title">
                    Network Nodes
                  </h1>
                  <p className="text-accent/70 text-sm retro-text mt-1">
                    Connect with other users and start conversations
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-border p-4 bg-surface/30">
            <div className="flex items-center gap-3">
              <div className="text-accent text-3xl font-mono font-bold">[■]</div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Friends</p>
                <p className="text-2xl text-accent font-bold font-mono">{acceptedFriends.length}</p>
              </div>
            </div>
          </div>
          <div className="border border-border p-4 bg-surface/30">
            <div className="flex items-center gap-3">
              <div className="text-accent text-3xl font-mono font-bold">[↓]</div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Incoming</p>
                <p className="text-2xl text-accent font-bold font-mono">{incomingRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="border border-border p-4 bg-surface/30">
            <div className="flex items-center gap-3">
              <div className="text-accent text-3xl font-mono font-bold">[↑]</div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">Sent</p>
                <p className="text-2xl text-accent font-bold font-mono">{outgoingRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="terminal">
          <div className="border-b-2 border-border pb-3 mb-4">
            <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
              [FIND_USERS]
            </h2>
          </div>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <p className="text-sm text-muted retro-text mb-3">
                Search by nickname or user ID:
              </p>
              <div className="border-2 border-accent p-4 bg-surface/30 rounded-lg shadow-glow">
                <div className="flex items-center gap-2">
                  <span className="text-accent text-lg">&gt;</span>
                  <span className="text-primary text-sm">SEARCH:</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter username..."
                    disabled={searching}
                    className="bg-transparent border-none outline-none text-accent font-mono text-lg flex-1 placeholder:text-muted/50"
                    autoFocus
                  />
                  {!searching && <span className="text-accent animate-pulse">▊</span>}
                </div>
              </div>
            </div>

            <NeonButton type="submit" disabled={searching || !searchQuery.trim()} className="w-full">
              {searching ? '[SEARCHING...]' : '[SEARCH USER]'}
            </NeonButton>
          </form>

          {/* Search Result */}
          {searchResult && (
            <div className="mt-6 pt-6 border-t border-border">
              {searchResult.error ? (
                <div className="border border-error p-4 bg-error/10 rounded-lg">
                  <p className="text-error text-sm">{searchResult.error}</p>
                </div>
              ) : (
                <div className="border-2 border-accent p-6 bg-surface/50 shadow-glow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 border-2 border-accent bg-surface flex items-center justify-center">
                      <span className="text-accent text-3xl font-mono font-bold">&gt;_</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-accent text-xl font-bold mb-1 font-mono">{searchResult.nickname}</p>
                      <p className="text-xs text-muted font-mono">UID: {searchResult.uid}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="status-led online" />
                        <span className="text-success text-xs uppercase">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <NeonButton onClick={() => handleSendRequest(searchResult.uid)} className="flex-1">
                      [Add Friend]
                    </NeonButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="terminal">
            <div className="border-b-2 border-border pb-3 mb-4">
              <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                [INCOMING_REQUESTS] ({incomingRequests.length})
              </h2>
            </div>
            <div className="space-y-2">
              {incomingRequests.map((node) => (
                <div
                  key={node.id}
                  className="border border-border bg-surface/20 p-2 hover:border-accent transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-accent font-mono font-bold">[?]</span>
                      <p className="text-accent font-mono font-bold text-sm truncate">
                        {node.owner?.nickname || node.owner_uid}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <NeonButton 
                        onClick={() => handleAcceptRequest(node.id)}
                      >
                        [Accept]
                      </NeonButton>
                      <NeonButton 
                        variant="danger" 
                        onClick={() => handleRejectRequest(node.id)}
                      >
                        [Reject]
                      </NeonButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Friend Requests */}
        {outgoingRequests.length > 0 && (
          <div className="terminal">
            <div className="border-b-2 border-border pb-3 mb-4">
              <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
                [SENT_REQUESTS] ({outgoingRequests.length})
              </h2>
            </div>
            <div className="space-y-2">
              {outgoingRequests.map((node) => (
                <div
                  key={node.id}
                  className="border border-border bg-surface/20 p-2 hover:border-accent transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-primary font-mono font-bold">[...]</span>
                      <p className="text-accent font-mono font-bold text-sm truncate">
                        {node.peer?.nickname || node.peer_uid}
                      </p>
                    </div>
                    <NeonButton 
                      variant="danger" 
                      onClick={() => handleCancelRequest(node.id)}
                    >
                      [Cancel]
                    </NeonButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Friends */}
        <div className="terminal">
          <div className="border-b-2 border-border pb-3 mb-4">
            <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
              [CONNECTED_NODES] ({acceptedFriends.length})
            </h2>
          </div>
          {acceptedFriends.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border">
              <p className="text-accent text-6xl mb-4 font-mono">[--]</p>
              <p className="text-muted text-sm mb-2 uppercase tracking-wider">
                No connections established
              </p>
              <p className="text-xs text-dim">
                Use search function to locate and connect with nodes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {acceptedFriends.map((node) => {
                const friendUid = node.owner_uid === currentUserUid ? node.peer_uid : node.owner_uid;
                const friendNickname = node.owner_uid === currentUserUid 
                  ? (node.peer?.nickname || node.peer_uid)
                  : (node.owner?.nickname || node.owner_uid);
                
                // Get unread count for this friend
                const friendData = friendsWithUnread.find(f => f.friend_uid === friendUid);
                const unreadCount = friendData?.unread_count || 0;
                
                // Check if friend is online
                const isOnline = isUserOnline(friendUid);
                
                return (
                  <div
                    key={node.id}
                    className="border border-border bg-surface/20 p-2 hover:border-accent transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`status-led ${isOnline ? 'online' : 'offline'} flex-shrink-0`} />
                        <p className="text-accent font-mono font-bold text-sm truncate">
                          {friendNickname}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-black border border-accent text-accent px-1.5 py-0 text-[10px] font-bold font-mono min-w-[18px] h-[18px] flex items-center justify-center rounded">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/dm/${friendUid}`}>
                          <NeonButton variant="secondary">
                            [Open DM]
                          </NeonButton>
                        </Link>
                        <NeonButton 
                          variant="danger"
                          onClick={() => handleDeleteFriend(node.id, friendNickname)}
                        >
                          [X]
                        </NeonButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Delete Friend Confirmation Modal */}
      {showDeleteConfirm && friendToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <TerminalPanel className="max-w-md w-full">
            <div className="space-y-4">
              <div className="border-b-2 border-border pb-4">
                <h3 className="text-accent font-bold font-mono text-lg">
                  [CONFIRM_DELETION]
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-white font-mono text-sm">
                  Remove <span className="text-accent font-bold">{friendToDelete.nickname}</span> from your connections?
                </p>
                <p className="text-dim font-mono text-xs">
                  This will permanently delete the connection. You can reconnect later if needed.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <NeonButton
                  variant="danger"
                  onClick={confirmDeleteFriend}
                  className="flex-1"
                >
                  [Confirm Delete]
                </NeonButton>
                <NeonButton
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setFriendToDelete(null);
                  }}
                  className="flex-1"
                >
                  [Cancel]
                </NeonButton>
              </div>
            </div>
          </TerminalPanel>
        </div>
      )}
    </div>
  );
}

