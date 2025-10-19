'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CLIInput } from '@/components/ui/CLIInput';
import { NeonButton } from '@/components/ui/NeonButton';

interface SearchResult {
  type: 'user' | 'room' | 'message';
  id: string;
  title: string;
  subtitle: string;
  data: any;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'users' | 'rooms' | 'messages'>('all');

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2) return;

    setSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search Users
      if (filter === 'all' || filter === 'users') {
        const { data: users } = await supabase
          .from('users')
          .select('uid, nickname, email')
          .or(`nickname.ilike.%${query}%,email.ilike.%${query}%,uid.ilike.%${query}%`)
          .limit(10);

        if (users) {
          searchResults.push(
            ...users.map((user) => ({
              type: 'user' as const,
              id: user.uid,
              title: user.nickname,
              subtitle: user.email,
              data: user,
            }))
          );
        }
      }

      // Search Rooms
      if (filter === 'all' || filter === 'rooms') {
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id, name, type, description')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10);

        if (rooms) {
          searchResults.push(
            ...rooms.map((room) => ({
              type: 'room' as const,
              id: room.id,
              title: room.name,
              subtitle: `${room.type} room`,
              data: room,
            }))
          );
        }
      }

      // Search Messages (limited for performance)
      if (filter === 'all' || filter === 'messages') {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, body, uid, created_at, users:uid(nickname)')
          .ilike('body', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (messages) {
          searchResults.push(
            ...messages.map((msg: any) => ({
              type: 'message' as const,
              id: msg.id,
              title: msg.users?.nickname || msg.uid,
              subtitle: msg.body.substring(0, 100),
              data: msg,
            }))
          );
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('[SEARCH] Error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-bg/50 border-2 border-border rounded-lg p-6">
      <h3 className="text-xl text-accent font-bold mb-4 uppercase">🔍 Global Search</h3>

      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <CLIInput
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Search users, rooms, messages..."
            showCursor
          />
        </div>
        <NeonButton onClick={handleSearch} disabled={searching || query.length < 2}>
          {searching ? 'Searching...' : 'Search'}
        </NeonButton>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'users', 'rooms', 'messages'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm border-2 rounded ${
              filter === f
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-retro-gray hover:border-accent/50'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {results.length === 0 && !searching && query.length >= 2 && (
          <p className="text-center text-retro-gray py-8">No results found</p>
        )}

        {results.map((result, idx) => (
          <div
            key={`${result.type}-${result.id}-${idx}`}
            className="border-2 border-border rounded p-3 hover:border-accent cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      result.type === 'user'
                        ? 'border-accent text-accent'
                        : result.type === 'room'
                        ? 'border-retro-amber text-retro-amber'
                        : 'border-retro-gray text-retro-gray'
                    }`}
                  >
                    {result.type.toUpperCase()}
                  </span>
                  <span className="text-accent font-semibold">{result.title}</span>
                </div>
                <p className="text-sm text-retro-gray">{result.subtitle}</p>
              </div>
              <Link
                href={
                  result.type === 'user'
                    ? `/admin/users`
                    : result.type === 'room'
                    ? `/admin/rooms`
                    : `/admin/audit-logs`
                }
                className="text-accent hover:text-accent/70 text-sm"
              >
                [View]
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}





