'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { CLIInput } from '@/components/ui/CLIInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { TerminalPanel } from '@/components/ui/TerminalPanel';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { checkPasswordStrength } from '@/lib/passwordStrength';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'profile'>('email');

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 12) {
      setError('Password too short (minimum 12 characters)');
      return;
    }

    // Check password strength
    const strength = checkPasswordStrength(password);
    if (!strength.isStrong) {
      setError(`Password too weak: ${strength.feedback}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname || email.split('@')[0],
          },
        },
      });

      if (error) {
        // Log failed registration attempt
        try {
          await fetch('/api/log-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: email, // Use email for failed attempts (no UID yet)
              action: 'register_failed',
              metadata: { 
                reason: error.message,
                email: email,
                nickname: nickname 
              }
            })
          });
        } catch (logError) {
          console.error('Failed to log failed registration:', logError);
        }
        
        setError(`Registration failed: ${error.message}`);
        return;
      }

      if (data.user) {
        // Create user profile in users table (backup in case trigger fails)
        try {
          await supabase.from('users').insert({
            uid: data.user.id,
            email: email,
            nickname: nickname || email.split('@')[0],
            is_admin: false,
          });
        } catch (insertError) {
          console.log('User profile creation handled by trigger or already exists');
        }
        
        // Log successful registration
        try {
          await fetch('/api/log-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: data.user.id,
              action: 'register',
              metadata: { 
                email: email,
                nickname: nickname,
                success: true 
              }
            })
          });
        } catch (logError) {
          console.error('Failed to log successful registration:', logError);
          // Continue even if logging fails
        }
        
        // Show success message
        setError('Account created successfully! Check your email for verification.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err) {
      setError('Account creation failed. Please try again.');
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
              CREATE ACCOUNT
            </h1>
            <p className="text-accent text-sm retro-text">
              Join our secure platform
            </p>
          </div>

        <form onSubmit={handleEmailSignup} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
              Email Address
            </label>
            <CLIInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={loading}
              autoComplete="email"
            />
            <p className="text-xs text-muted mt-1 retro-muted">
              Email will be hidden after registration
            </p>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
              Nickname (3-16 chars)
            </label>
            <CLIInput
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="CipherQueen"
              required
              minLength={3}
              maxLength={16}
              disabled={loading}
              pattern="[a-zA-Z0-9_]+"
              title="Alphanumeric and underscore only"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
              Password (min 12 chars)
            </label>
            <CLIInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={12}
              disabled={loading}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
              Confirm Password
            </label>
            <CLIInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* Error/Success Message */}
          {error && (
            <div
              className={`border p-3 ${
                error.includes('successfully')
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-error bg-error/10 text-error'
              }`}
            >
              <p className="text-sm retro-text">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <NeonButton type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating Account...' : 'Create Account'}
            </NeonButton>
          </div>

          {/* Links */}
          <div className="border-t-2 border-border pt-4 space-y-2">
            <p className="text-sm text-muted retro-text">
              Already have an account?{' '}
              <Link href="/auth/login" className="ghost-link">
                Sign in here
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
