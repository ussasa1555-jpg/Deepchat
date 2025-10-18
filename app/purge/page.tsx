'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function PurgePage() {
  const router = useRouter();
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (command !== 'PURGE_DATA --CONFIRM') {
      setError('Invalid command. Type exactly: PURGE_DATA --CONFIRM');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Delete user data
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('uid', session.user.id);

      if (deleteError) throw deleteError;

      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to home
      router.push('/');
    } catch (err: any) {
      setError(`Purge failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Floating Particles Background */}
      <div className="particles-container">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-3xl mx-auto">
        {/* Warning Header */}
        <div className="terminal border-error/50 mb-6">
          <div className="border-b-2 border-error pb-4 mb-6">
            <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-error retro-title">
              ⚠️ DATA PURGE
            </h1>
            <p className="text-error text-sm retro-text">
              Permanent account deletion
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-error p-4 rounded-lg bg-error/10">
              <p className="text-error text-sm font-bold retro-text mb-2">
                WARNING: THIS ACTION CANNOT BE UNDONE
              </p>
              <p className="text-error text-xs retro-muted">
                All your data will be permanently deleted from our servers.
              </p>
            </div>
          </div>
        </div>

        {/* What Will Be Deleted */}
        <div className="terminal mb-6">
          <div className="border-b-2 border-border pb-4 mb-6">
            <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
              What Will Be Deleted
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-error text-xl">🗑️</span>
              <div>
                <p className="text-accent text-sm retro-text">User Account</p>
                <p className="text-xs text-muted retro-muted">Your UID, nickname, and email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-error text-xl">💬</span>
              <div>
                <p className="text-accent text-sm retro-text">All Messages</p>
                <p className="text-xs text-muted retro-muted">Public, private, and direct messages</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-error text-xl">🔐</span>
              <div>
                <p className="text-accent text-sm retro-text">Private Channels</p>
                <p className="text-xs text-muted retro-muted">Any private channels you created</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-error text-xl">⚙️</span>
              <div>
                <p className="text-accent text-sm retro-text">Settings & Preferences</p>
                <p className="text-xs text-muted retro-muted">All account settings and preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation */}
        <div className="terminal">
          <div className="border-b-2 border-border pb-4 mb-6">
            <h2 className="text-xl uppercase tracking-wider text-accent retro-title">
              Confirmation Required
            </h2>
          </div>

          {!confirmed ? (
            <div className="space-y-4">
              <p className="text-sm text-muted retro-text">
                To proceed with account deletion, please confirm that you understand:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted retro-text ml-4">
                <li>This action is permanent and cannot be undone</li>
                <li>All your data will be immediately deleted</li>
                <li>You will be signed out and cannot recover your account</li>
                <li>Your nickname may become available for others to use</li>
              </ul>
              <button
                onClick={() => setConfirmed(true)}
                className="retro-button border-warning text-warning hover:bg-warning hover:text-background"
              >
                I Understand, Continue
              </button>
              <Link href="/dashboard">
                <button className="retro-button ml-4">
                  Cancel
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePurge} className="space-y-6">
              <div>
                <p className="text-sm text-accent mb-4 retro-text">
                  Type the following command to confirm deletion:
                </p>
                <div className="border border-error p-4 rounded-lg bg-error/5 mb-4">
                  <code className="text-error text-sm retro-text">PURGE_DATA --CONFIRM</code>
                </div>
                <div className="flex items-center gap-2 border border-border rounded-lg p-3 bg-surface">
                  <span className="text-accent retro-text">{'>'}</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-accent retro-text"
                    placeholder="Type command here..."
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="border border-error p-3 rounded-lg bg-error/10">
                  <p className="text-error text-sm retro-text">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || command !== 'PURGE_DATA --CONFIRM'}
                  className="retro-button border-error text-error hover:bg-error hover:text-background"
                >
                  {loading ? 'Deleting...' : 'Execute Purge'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmed(false)}
                  className="retro-button"
                  disabled={loading}
                >
                  Go Back
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="ghost-link text-sm">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
