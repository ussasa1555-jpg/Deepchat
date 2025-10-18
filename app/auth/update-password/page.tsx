'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { CLIInput } from '@/components/ui/CLIInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if user has a valid password recovery session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        setMessage('Invalid or expired reset link');
        setIsSuccess(false);
        setTimeout(() => router.push('/auth/reset'), 3000);
      } else {
        setIsValidSession(true);
      }
    };

    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    console.log('[UPDATE_PASSWORD] Validation:', {
      newPassword: newPassword.length,
      confirmPassword: confirmPassword.length,
      passwordScore,
      isValidSession,
      match: newPassword === confirmPassword
    });

    // Validation
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    // Relaxed password strength check (only warn, don't block)
    // Allow if: length >= 12 OR has mixed case+numbers+symbols
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const mixedComplexity = [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length;

    if (newPassword.length < 12 && mixedComplexity < 3) {
      setMessage('Password is too weak. Use at least 12 characters OR mix uppercase, lowercase, numbers and symbols');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Password updated successfully! Redirecting...');
        setIsSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        
        // Sign out and redirect to login
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err) {
      setMessage('Password update failed. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 login-page">
        <div className="particles-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div className="login-form">
          <div className="terminal max-w-md w-full">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <p className="text-accent animate-pulse">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-page">
      {/* Animated Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-lg w-full">
        <div className="terminal">
          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border-2 border-accent mb-4 animate-pulse">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
              Reset Password
            </h1>
            <p className="text-accent/70 text-sm retro-text">
              Create a strong new password for your account
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {/* New Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-accent uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <CLIInput
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  required
                  disabled={loading || !isValidSession}
                  autoComplete="new-password"
                  minLength={8}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-accent/50 hover:text-accent transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {newPassword && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <PasswordStrengthMeter
                    password={newPassword}
                    onScoreChange={setPasswordScore}
                  />
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-accent uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <CLIInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  disabled={loading || !isValidSession}
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-accent/50 hover:text-accent transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator with Animation */}
              {confirmPassword && (
                <div className="flex items-center space-x-2 mt-2 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  {newPassword === confirmPassword ? (
                    <>
                      <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-accent font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-retro-amber" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-retro-amber font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
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
                  <p className="font-medium">{message}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <NeonButton
              type="submit"
              disabled={loading || !isValidSession}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  <span>Updating Password...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Update Password</span>
                </span>
              )}
            </NeonButton>

            {/* Security Tips */}
            <div className="bg-bg/50 border-2 border-border rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Security Tips</span>
              </h3>
              <ul className="text-xs text-accent/70 space-y-1 pl-6">
                <li className="list-disc">Use at least 8 characters</li>
                <li className="list-disc">Mix uppercase and lowercase letters</li>
                <li className="list-disc">Include numbers and symbols</li>
                <li className="list-disc">Avoid common words or patterns</li>
              </ul>
            </div>

            {/* Back to Login Link */}
            <div className="text-center pt-4 border-t-2 border-border">
              <Link href="/auth/login" className="ghost-link inline-flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

