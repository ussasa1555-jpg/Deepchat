'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useSound } from '@/lib/useSound';
import { usePresence } from '@/lib/PresenceProvider';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { checkPasswordStrength } from '@/lib/passwordStrength';

interface UserProfile {
  uid: string;
  nickname: string;
  email: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showUserId, setShowUserId] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const { toggleSound, isSoundEnabled, playNotification } = useSound();
  const { setManualOffline, isManualOffline } = usePresence();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorSecretPlain, setTwoFactorSecretPlain] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorMessage, setTwoFactorMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setNickname(data.nickname);
        setTwoFactorEnabled(data.two_factor_enabled || false);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  useEffect(() => {
    // Load sound setting
    setSoundEnabled(isSoundEnabled());
  }, [isSoundEnabled]);

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ nickname })
        .eq('uid', profile.uid);

      if (error) throw error;
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMessage('');

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage('All fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      setPasswordMessage('Password must be at least 12 characters');
      return;
    }

    // Check password strength
    const strength = checkPasswordStrength(newPassword);
    if (!strength.isStrong) {
      setPasswordMessage(`Password too weak: ${strength.feedback}`);
      return;
    }

    setSaving(true);

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (error: any) {
      setPasswordMessage(`Failed to change password: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    setTwoFactorMessage('');
    setSaving(true);

    try {
      const response = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      setTwoFactorSecret(data.qrCode);
      setTwoFactorSecretPlain(data.secret);
      setShowTwoFactorSetup(true);
      setTwoFactorMessage('Scan QR code with your authenticator app');
    } catch (error: any) {
      setTwoFactorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setTwoFactorMessage('Enter 6-digit code');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setVerificationCode('');
      setTwoFactorMessage('2FA enabled successfully!');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } catch (error: any) {
      setTwoFactorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    const code = prompt('Enter 2FA code or backup code:');
    if (!code) return;

    setSaving(true);

    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      setTwoFactorMessage('2FA disabled successfully');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } catch (error: any) {
      setTwoFactorMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 login-page">
        <div className="particles-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div className="login-form">
          <div className="terminal max-w-md w-full">
            <p className="text-accent text-center animate-pulse">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 login-page">
      {/* Floating Particles Background */}
      <div className="particles-container">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="login-form max-w-4xl mx-auto">
        {/* Header */}
        <div className="terminal mb-6">
          <div className="border-b-2 border-border pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
                  SETTINGS
                </h1>
                <p className="text-accent text-sm retro-text">
                  Manage your account preferences
                </p>
              </div>
              <Link href="/dashboard">
                <button className="retro-button">
                  ← Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title border-b border-border pb-2">
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <p className="text-xs text-muted uppercase tracking-wider mb-2 retro-muted">User ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p 
                      className="text-accent font-mono text-sm retro-text flex-1"
                      style={{ 
                        filter: showUserId ? 'none' : 'blur(3px)',
                        transition: 'filter 0.2s ease'
                      }}
                    >
                      {profile?.uid || '••••••••-••••-••••-••••-••••••••••••'}
                    </p>
                    <button
                      onClick={() => setShowUserId(!showUserId)}
                      className="text-accent hover:text-accent/70 transition-all p-1"
                      aria-label={showUserId ? 'Hide User ID' : 'Show User ID'}
                    >
                      {showUserId ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <p className="text-xs text-muted uppercase tracking-wider mb-2 retro-muted">Email</p>
                  <div className="flex items-center justify-between gap-2">
                    <p 
                      className="text-accent text-sm retro-text flex-1"
                      style={{ 
                        filter: showEmail ? 'none' : 'blur(3px)',
                        transition: 'filter 0.2s ease'
                      }}
                    >
                      {profile?.email || '••••••••@••••••••.com'}
                    </p>
                    <button
                      onClick={() => setShowEmail(!showEmail)}
                      className="text-accent hover:text-accent/70 transition-all p-1"
                      aria-label={showEmail ? 'Hide Email' : 'Show Email'}
                    >
                      {showEmail ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Settings */}
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title border-b border-border pb-2">
                Profile Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="retro-input w-full"
                    minLength={3}
                    maxLength={16}
                    pattern="[a-zA-Z0-9_]+"
                  />
                  <p className="text-xs text-muted mt-1 retro-muted">
                    3-16 characters, alphanumeric and underscore only
                  </p>
                </div>

                {message && (
                  <div className={`border p-3 rounded-lg ${
                    message.includes('success') 
                      ? 'border-success bg-success/10 text-success' 
                      : 'border-error bg-error/10 text-error'
                  }`}>
                    <p className="text-sm retro-text">{message}</p>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || nickname === profile?.nickname}
                  className="retro-button"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title border-b border-border pb-2">
                Change Password
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="retro-input w-full"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
                    New Password (min 12 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="retro-input w-full"
                    placeholder="••••••••••••"
                    minLength={12}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="retro-input w-full"
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                  />
                </div>

                {passwordMessage && (
                  <div className={`border p-3 rounded-lg ${
                    passwordMessage.includes('success') 
                      ? 'border-success bg-success/10 text-success' 
                      : 'border-error bg-error/10 text-error'
                  }`}>
                    <p className="text-sm retro-text">{passwordMessage}</p>
                  </div>
                )}

                <button
                  onClick={handlePasswordChange}
                  disabled={saving || !currentPassword || !newPassword || !confirmNewPassword}
                  className="retro-button"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>

            {/* System Settings */}
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title border-b border-border pb-2">
                System Settings
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <div className="flex-1">
                    <p className="text-accent text-sm retro-text">Sound Notifications</p>
                    <p className="text-xs text-muted retro-muted">Play terminal beep sound for new messages</p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !soundEnabled;
                      setSoundEnabled(newValue);
                      toggleSound(newValue);
                      if (newValue) {
                        playNotification();
                      }
                    }}
                    className={`px-4 py-2 border-2 transition-all ${
                      soundEnabled 
                        ? 'border-accent text-accent bg-accent/10' 
                        : 'border-muted text-muted bg-surface/30'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <div className="flex-1">
                    <p className="text-accent text-sm retro-text">Appear Offline</p>
                    <p className="text-xs text-muted retro-muted">Hide your online status from other users</p>
                  </div>
                  <button
                    onClick={() => {
                      setManualOffline(!isManualOffline);
                    }}
                    className={`px-4 py-2 border-2 transition-all ${
                      isManualOffline 
                        ? 'border-accent text-accent bg-accent/10' 
                        : 'border-muted text-muted bg-surface/30'
                    }`}
                  >
                    {isManualOffline ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title border-b border-border pb-2">
                Two-Factor Authentication
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <div className="flex-1">
                    <p className="text-accent text-sm retro-text">2FA Status</p>
                    <p className="text-xs text-muted retro-muted">Add extra security layer with TOTP</p>
                  </div>
                  <button
                    onClick={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                    disabled={saving}
                    className={`px-4 py-2 border-2 transition-all ${
                      twoFactorEnabled 
                        ? 'border-success text-success bg-success/10' 
                        : 'border-muted text-muted bg-surface/30'
                    }`}
                  >
                    {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {showTwoFactorSetup && twoFactorSecret && (
                  <div className="border border-accent bg-accent/5 p-4 rounded-lg space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-accent mb-3 retro-text">Scan QR Code with Authenticator App</p>
                      <img 
                        src={twoFactorSecret} 
                        alt="2FA QR Code" 
                        className="mx-auto border border-accent p-2"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="mt-4 p-3 bg-surface/30 border border-muted rounded">
                        <p className="text-xs text-muted mb-1">Or enter manually:</p>
                        <p className="text-accent font-mono text-sm break-all">{twoFactorSecretPlain}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-accent uppercase tracking-wider retro-text">
                        Enter 6-Digit Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="retro-input w-full text-center font-mono text-2xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <button
                      onClick={handleVerify2FA}
                      disabled={saving || verificationCode.length !== 6}
                      className="retro-button w-full"
                    >
                      {saving ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                )}

                {twoFactorMessage && (
                  <div className={`border p-3 rounded-lg ${
                    twoFactorMessage.includes('success') 
                      ? 'border-success bg-success/10 text-success' 
                      : 'border-error bg-error/10 text-error'
                  }`}>
                    <p className="text-sm retro-text">{twoFactorMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title border-b border-border pb-2">
                Privacy & Security
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <div>
                    <p className="text-accent text-sm retro-text">Auto-Purge</p>
                    <p className="text-xs text-muted retro-muted">Automatically delete account after 30 days of inactivity</p>
                  </div>
                  <span className="text-success text-sm retro-text">Enabled</span>
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg p-4 backdrop-blur-sm bg-surface/50">
                  <div>
                    <p className="text-accent text-sm retro-text">End-to-End Encryption</p>
                    <p className="text-xs text-muted retro-muted">All messages are encrypted</p>
                  </div>
                  <span className="text-success text-sm retro-text">Enabled</span>
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted retro-muted">
                Account Created: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="terminal border-error/30">
          <div className="border-b-2 border-error pb-4 mb-6">
            <h2 className="text-xl uppercase tracking-wider text-error retro-title">
              Danger Zone
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted retro-text">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Link href="/purge">
              <button className="retro-button border-error text-error hover:bg-error hover:text-background">
                Delete Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
