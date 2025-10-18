'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { CLIInput } from '@/components/ui/CLIInput';
import bcrypt from 'bcryptjs';

export default function PrivateRoomPage() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(5);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');

  const generateRandomKey = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (0,O,1,I)
    let key = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const formatKey = (input: string): string => {
    // Remove non-alphanumeric, convert to uppercase
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Add hyphens at positions 4, 8
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  };

  const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatKey(value);
    setKeyInput(formatted);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      // Check both session and user for better auth verification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated. Please log in again.');
        router.push('/auth/login');
        return;
      }

      const uid = session.user.id;
      const newKey = generateRandomKey();

      // Hash the key with bcrypt (secure hashing - 10 rounds)
      const keyHash = await bcrypt.hash(newKey, 10);

      console.log('Creating private room:', {
        name: roomName,
        type: 'private',
        created_by: uid,
        has_key_hash: !!keyHash,
        security_level: 'bcrypt-10-rounds'
      });

      // Create private room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          description: roomDescription || null,
          type: 'private',
          created_by: uid,
          key_hash: keyHash,
        })
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        throw roomError;
      }

      console.log('Room created successfully:', room);

      // Store key for Management recovery
      try {
        const { error: keyError } = await supabase
          .from('private_room_keys')
          .insert({
            room_id: room.id,
            key_plain: newKey,
            key_hash: keyHash,
            created_by: uid,
          });

        if (keyError) {
          console.error('Key storage error:', keyError);
          // Non-critical error, room still created
        } else {
          console.log('Private key stored for Management recovery');
        }
      } catch (keyErr) {
        console.error('Failed to store key:', keyErr);
      }

      // Show generated key
      setGeneratedKey(newKey);
      setRoomName('');
      setRoomDescription('');
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(`Error: ${err.message || 'Room creation failed'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate format
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(keyInput)) {
      setError('SYNTAX ERROR: Invalid key format. Expected: XXXX-XXXX-XXXX');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get session token for API auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Call API to validate key (server-side bcrypt)
      const response = await fetch('/api/validate-room-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roomKey: keyInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'INVALID KEY: Access denied.');
        setAttempts(prev => prev - 1);
        
        if (attempts <= 1) {
          setError('TOO MANY ATTEMPTS: Please try again in 5 minutes.');
        }
        return;
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          room_id: result.roomId,
          uid: session.user.id,
          role: 'member',
        });

      // Ignore duplicate key error (already a member)
      if (memberError && !memberError.message.includes('duplicate')) {
        throw memberError;
      }

      // Redirect to room
      router.push(`/room/${result.roomId}`);
    } catch (err: any) {
      console.error('Error:', err);
      setError('CONNECTION FAILED: Unable to access room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form w-full max-w-2xl">
        <div className="terminal">
          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 border-2 border-accent mb-4 animate-pulse">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
              Private Access
            </h1>
            <p className="text-accent/70 text-sm retro-text">
              Secure encrypted room entry
            </p>
          </div>

          {/* Create Room Button */}
          <div className="mb-6">
            <NeonButton
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setGeneratedKey('');
                setError('');
              }}
              className="w-full"
            >
              {showCreateForm ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Private Room</span>
                </span>
              )}
            </NeonButton>
          </div>

          {/* Create Room Form */}
          {showCreateForm && (
            <div className="mb-6 p-6 bg-bg/50 border-2 border-accent/30 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <h3 className="text-lg uppercase tracking-wider text-accent font-semibold">Create Private Room</h3>
              </div>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-accent uppercase tracking-wider">
                    Room Name
                  </label>
                  <CLIInput
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Secret Hideout"
                    required
                    minLength={3}
                    maxLength={50}
                    disabled={creating}
                  />
                  <p className="text-xs text-accent/50">3-50 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-accent uppercase tracking-wider">
                    Description
                  </label>
                  <CLIInput
                    type="text"
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="Top secret discussions only"
                    maxLength={200}
                    disabled={creating}
                  />
                  <p className="text-xs text-accent/50">Optional, max 200 characters</p>
                </div>

                <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-accent/70 space-y-1">
                      <p className="font-semibold text-accent">ROOM INFO:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Maximum 12 members per room</li>
                        <li>Random secure key will be generated</li>
                        <li>Share key with members to invite</li>
                        <li>bcrypt-10 rounds encryption</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {generatedKey && (
                  <div className="border-2 border-accent bg-accent/10 rounded-lg p-6 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-accent text-sm font-semibold uppercase">Room Created Successfully!</p>
                    </div>
                    <div className="bg-bg/80 border border-accent/50 rounded p-4 mb-3">
                      <p className="text-accent text-2xl font-mono font-bold tracking-[0.3em] text-center">
                        {generatedKey}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-retro-amber flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-retro-amber text-xs">
                        <strong>IMPORTANT:</strong> Save this key securely! You'll need it to access the room. This key is only shown once.
                      </p>
                    </div>
                  </div>
                )}

                {!generatedKey && (
                  <NeonButton type="submit" disabled={creating} className="w-full">
                    {creating ? (
                      <span className="flex items-center justify-center space-x-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        <span>Creating...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Create Room</span>
                      </span>
                    )}
                  </NeonButton>
                )}
              </form>
            </div>
          )}

          {/* Key Entry Interface */}
          <div className="p-6 bg-bg/50 border-2 border-border rounded-lg min-h-[400px]">
            <div className="space-y-6">
              <div className="border-b-2 border-border pb-4">
                <h2 className="text-xl uppercase tracking-wider text-accent font-semibold flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Room Key Entry</span>
                </h2>
                <p className="text-sm text-accent/70 mt-2">
                  Enter your 12-character room key to gain access
                </p>
              </div>

              <form onSubmit={handleConnect} className="space-y-6">
                {/* Key Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-accent uppercase tracking-wider">
                    Room Key
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyInput}
                      onChange={handleKeyInput}
                      placeholder="XXXX-XXXX-XXXX"
                      maxLength={14}
                      disabled={loading}
                      className="w-full bg-bg border-2 border-border p-4 text-accent font-mono text-xl tracking-[0.3em] text-center focus:border-accent focus:outline-none transition-colors uppercase"
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-accent/50">Format: XXXX-XXXX-XXXX (12 characters)</p>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="bg-accent/10 border-2 border-accent rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
                      <p className="text-accent text-sm font-medium">Validating key...</p>
                    </div>
                    <div className="w-full bg-bg/50 rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-xs text-accent/70">Verifying access credentials...</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="border-2 border-retro-amber bg-retro-amber/10 rounded-lg p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0 text-retro-amber mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-retro-amber text-sm font-medium">
                          {error}
                        </p>
                        {attempts < 5 && attempts > 0 && (
                          <p className="text-retro-amber/70 text-xs mt-2 flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Attempts remaining: {attempts}/5</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-bg/50 border-2 border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
                        Security Features
                      </p>
                      <ul className="text-xs text-accent/70 space-y-2">
                        <li className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Keys hashed with bcrypt (10 rounds)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Rate limited (5 attempts per hour)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>No keys stored in client storage</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Keys expire after 10 days of inactivity</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <NeonButton type="submit" disabled={loading || !keyInput} className="flex-1">
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        <span>Validating...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span>Connect to Room</span>
                      </span>
                    )}
                  </NeonButton>
                  <Link href="/dashboard" className="flex-1">
                    <NeonButton variant="secondary" className="w-full">
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Dashboard</span>
                      </span>
                    </NeonButton>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

