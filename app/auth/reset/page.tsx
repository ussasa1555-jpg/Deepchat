'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { CLIInput } from '@/components/ui/CLIInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { TerminalPanel } from '@/components/ui/TerminalPanel';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Password reset email sent successfully!');
        setIsSuccess(true);
        setEmail('');
      }
    } catch (err) {
      setMessage('Reset request failed. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-md w-full">
        <div className="terminal">
          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border-2 border-accent mb-4 animate-pulse">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
              Reset Password
            </h1>
            <p className="text-accent/70 text-sm retro-text">
              We'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-accent uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <CLIInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Message Alert */}
            {message && (
              <div
                className={`
                  border-2 rounded-lg p-4 animate-in fade-in slide-in-from-top-4 duration-300
                  ${isSuccess
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-retro-amber bg-retro-amber/10 text-retro-amber'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  {isSuccess ? (
                    <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <p className="font-medium">{message}</p>
                    {isSuccess && (
                      <p className="text-xs mt-1 opacity-80">Check your inbox and spam folder</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <NeonButton type="submit" disabled={loading || isSuccess} className="w-full">
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  <span>Sending Email...</span>
                </span>
              ) : isSuccess ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Email Sent!</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Send Reset Link</span>
                </span>
              )}
            </NeonButton>

            {/* Info Box */}
            <div className="bg-bg/50 border-2 border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-accent/70 space-y-1">
                  <p>The reset link will expire in 1 hour</p>
                  <p>If you don't receive an email, check your spam folder</p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-border">
              <Link href="/auth/login" className="ghost-link inline-flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Back to Login</span>
              </Link>
              
              <Link href="/auth/register" className="ghost-link inline-flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Create Account</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
