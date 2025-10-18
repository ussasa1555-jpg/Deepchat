'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { CLIInput } from '@/components/ui/CLIInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { TerminalPanel } from '@/components/ui/TerminalPanel';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        try {
          await fetch('/api/log-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: email, // Use email for failed attempts (no UID yet)
              action: 'login_failed',
              metadata: { 
                reason: error.message,
                email: email 
              }
            })
          });
        } catch (logError) {
          console.error('Failed to log failed login:', logError);
        }
        
        setError(`Authentication failed: ${error.message}`);
        return;
      }

      if (data.session) {
        // Log successful login
        try {
          await fetch('/api/log-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: data.session.user.id,
              action: 'login',
              metadata: { 
                email: email,
                success: true 
              }
            })
          });
        } catch (logError) {
          console.error('Failed to log successful login:', logError);
          // Continue even if logging fails
        }

        // Setup profile if it doesn't exist
        try {
          await fetch('/api/setup-profile', {
            method: 'POST',
          });
        } catch (profileError) {
          console.error('Profile setup error:', profileError);
          // Continue even if profile setup fails
        }

        // Check if 2FA is enabled
        const { data: profile } = await supabase
          .from('users')
          .select('two_factor_enabled')
          .eq('uid', data.session.user.id)
          .single();

        if (profile?.two_factor_enabled) {
          // Redirect to 2FA verification
          router.push('/auth/verify-2fa?redirect=/dashboard');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-page">
      {/* Floating Particles Background */}
      <div className="particles-container">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="login-form">
        <div className="terminal max-w-md w-full">
          {/* Header */}
          <div className="border-b-2 border-border pb-4 mb-6">
            <h1 className="text-2xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
              USER AUTHENTICATION
            </h1>
            <p className="text-accent text-sm retro-text">
              Sign in to your account
            </p>
          </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
              Email Address
            </label>
            <CLIInput
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
              Password
            </label>
            <CLIInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
              {error && (
                <div className="border border-error p-3 bg-error/10">
                  <p className="text-error text-sm font-mono retro-text">{error}</p>
                </div>
              )}

          {/* Submit Button */}
          <div className="flex gap-4 items-center">
            <NeonButton type="submit" disabled={loading} className="flex-1">
              {loading ? 'Authenticating...' : 'Sign In'}
            </NeonButton>
          </div>

          {/* Links */}
          <div className="border-t-2 border-border pt-4 space-y-2">
            <p className="text-sm text-muted retro-text">
              Don't have an account?{' '}
              <Link href="/auth/register" className="ghost-link">
                Create one here
              </Link>
            </p>
            <p className="text-sm text-muted retro-text">
              <Link href="/auth/reset" className="ghost-link">
                Forgot your password?
              </Link>
            </p>
            <p className="text-sm text-muted retro-text">
              <Link href="/" className="ghost-link">
                ← Return to homepage
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
