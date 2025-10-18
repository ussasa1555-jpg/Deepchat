import Link from 'next/link';

export default function TermsOfServicePage() {
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
        <div className="terminal max-w-4xl w-full">
          {/* Header */}
          <div className="border-b-2 border-border pb-4 mb-6">
            <h1 className="text-3xl uppercase tracking-[0.2em] mb-2 text-accent retro-title">
              TERMS OF SERVICE
            </h1>
            <p className="text-accent text-sm retro-text">
              Please read these terms carefully
            </p>
          </div>

          <div className="space-y-8">
            {/* Last Updated */}
            <div className="border-b border-border pb-4">
              <p className="text-xs text-muted retro-muted">
                Last Updated: October 14, 2025
              </p>
              <p className="text-xs text-muted retro-muted mt-1">
                Effective Date: October 14, 2025
              </p>
            </div>

            {/* Introduction */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                1. Acceptance of Terms
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  By accessing and using Deeps Rooms, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our platform.
                </p>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                2. User Accounts
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li>You must provide a valid email address to create an account</li>
                  <li>You are responsible for maintaining the security of your password</li>
                  <li>You must choose a nickname that doesn't violate others' rights</li>
                  <li>One account per person - multiple accounts are prohibited</li>
                  <li>Accounts inactive for 30 days will be automatically deleted</li>
                </ul>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                3. Acceptable Use Policy
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p className="text-accent font-semibold">You agree NOT to use Deeps Rooms to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Share illegal content or engage in illegal activities</li>
                  <li>Spam, phish, or distribute malware</li>
                  <li>Impersonate others or misrepresent your identity</li>
                  <li>Attempt to hack, disrupt, or compromise platform security</li>
                  <li>Share child exploitation material (zero tolerance)</li>
                  <li>Engage in terrorism-related activities</li>
                </ul>
              </div>
            </section>

            {/* Content */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                4. User Content
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li>You retain ownership of content you post</li>
                  <li>You grant us license to store and transmit your messages</li>
                  <li>All messages are automatically deleted after 30 days</li>
                  <li>We do not monitor private messages unless legally required</li>
                  <li>You are solely responsible for your content</li>
                </ul>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                5. Privacy and Data
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  Your privacy is important to us. Please review our <Link href="/legal/privacy" className="text-accent underline">Privacy Policy</Link> to understand how we collect, use, and protect your data.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li>We collect minimal data (email, nickname, messages)</li>
                  <li>We do not sell or share your data with third parties</li>
                  <li>All data is encrypted in transit and at rest</li>
                  <li>You can delete your account and data at any time</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                6. Account Termination
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>We reserve the right to suspend or terminate accounts that:</p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li>Violate these Terms of Service</li>
                  <li>Engage in illegal activities</li>
                  <li>Abuse or harass other users</li>
                  <li>Compromise platform security</li>
                </ul>
                <p className="mt-3">
                  You may delete your account at any time using the PURGE_DATA command.
                </p>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                7. Disclaimer of Warranties
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p className="text-muted">
                  DEEPCHAT IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, SECURITY, OR ERROR-FREE OPERATION.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                8. Limitation of Liability
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p className="text-muted">
                  WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM YOUR USE OF DEEPCHAT, INCLUDING BUT NOT LIMITED TO DATA LOSS, PRIVACY BREACHES, OR SERVICE INTERRUPTIONS.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                9. Changes to Terms
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  We may update these Terms of Service from time to time. Continued use of Deeps Rooms after changes constitutes acceptance of the updated terms.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                10. Contact
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  For questions about these Terms of Service, contact us:
                </p>
                <div className="border border-border p-4 rounded-lg mt-3">
                  <p className="text-muted">
                    Email: <span className="text-accent">legal@deepchat.app</span>
                  </p>
                  <p className="text-muted mt-2">
                    Appeals: <span className="text-accent">support@deepchat.app</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t-2 border-border pt-6 mt-8">
              <div className="flex gap-4 flex-wrap">
                <Link href="/">
                  <button className="retro-button">
                    ← Return to Homepage
                  </button>
                </Link>
                <Link href="/legal/privacy">
                  <button className="retro-button">
                    Privacy Policy
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
