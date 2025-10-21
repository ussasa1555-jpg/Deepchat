'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CLIInput } from '@/components/ui/CLIInput';
import { NeonButton } from '@/components/ui/NeonButton';

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Enter 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/2fa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store verification in session
      sessionStorage.setItem('2fa_verified', 'true');
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-page">
      {/* Floating Particles Background */}
      <div className="particles-container">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>
      
      <div className="login-form">
        <div className="terminal max-w-md w-full">
          {/* Header */}
          <div className="border-b-2 border-border pb-4 mb-6">
            <h1 className="text-2xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
              TWO-FACTOR AUTH
            </h1>
            <p className="text-accent text-sm retro-text">
              Enter verification code
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
                6-Digit Code
              </label>
              <CLIInput
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                disabled={loading}
                autoComplete="off"
                className="text-center font-mono text-2xl tracking-widest"
              />
              <p className="text-xs text-muted mt-1 retro-muted">
                Use authenticator app or backup code
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="border border-error bg-error/10 p-3">
                <p className="text-sm text-error retro-text">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <NeonButton type="submit" disabled={loading || code.length !== 6} className="flex-1">
                {loading ? 'Verifying...' : 'Verify'}
              </NeonButton>
            </div>

            {/* Links */}
            <div className="border-t-2 border-border pt-4 space-y-2">
              <p className="text-sm text-muted retro-text">
                Lost access?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="ghost-link"
                >
                  Sign in again
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}












