import Link from 'next/link';

export default function HomePage() {
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
        <div className="terminal max-w-2xl w-full">
          {/* Header */}
          <div className="border-b-2 border-border pb-4 mb-6">
            <h1 className="text-3xl uppercase tracking-[0.3em] mb-2 text-accent retro-title">
              Deeps Rooms version 0.8
            </h1>
            <p className="text-accent text-sm retro-text">
              Secure Communication Platform
            </p>
          </div>

          {/* System Info */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <span className="text-accent mr-2">{'>'}</span>
              <div>
                <p className="text-sm retro-text">
                  Retro terminal chat with modern security.
                </p>
                <p className="text-sm mt-1 text-muted retro-text">
                  Anonymous by design. Auto-purge after 30 days.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-accent mr-2">{'>'}</span>
              <div>
                <p className="text-sm retro-text">
                  No tracking. No ads. No bullshit.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="border-t-2 border-border pt-4 mb-8">
            <p className="text-accent text-xs uppercase tracking-wider mb-3 retro-text">
              Platform Features
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-accent">• </span>
                <span className="text-muted retro-text">Public rooms</span>
              </div>
              <div>
                <span className="text-accent">• </span>
                <span className="text-muted retro-text">Private channels (CLI key)</span>
              </div>
              <div>
                <span className="text-accent">• </span>
                <span className="text-muted retro-text">Direct messages</span>
              </div>
              <div>
                <span className="text-accent">• </span>
                <span className="text-muted retro-text">Oracle 0.8 AI Beta</span>
              </div>
              <div>
                <span className="text-accent">• </span>
                <span className="text-muted retro-text">Auto-purge (30d)</span>
              </div>
              <div>
                <span className="text-accent">• </span>
                <span className="text-muted retro-text">Manual PURGE_DATA</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 flex-wrap">
            <Link href="/auth/register">
              <button className="retro-button">
                Create Account
              </button>
            </Link>
            
            <Link href="/auth/login">
              <button className="retro-button">
                Sign In
              </button>
            </Link>

            <Link href="/legal/privacy" className="ghost-link text-sm self-center">
              Privacy Policy
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-border mt-8 pt-4">
            <p className="text-xs text-muted retro-muted">
              System Status: <span className="text-success">Online</span>
            </p>
            <p className="text-xs text-muted mt-1 retro-muted">
              Version: 0.8.0 • 2025-01-14
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
