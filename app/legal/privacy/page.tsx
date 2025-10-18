import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
              PRIVACY POLICY
            </h1>
            <p className="text-accent text-sm retro-text">
              Your privacy is our priority
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
                1. Introduction
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  Welcome to Deeps Rooms. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform.
                </p>
                <p>
                  Deeps Rooms is designed with privacy at its core. We believe in minimal data collection, maximum security, and complete transparency about how your information is handled.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                2. Information We Collect
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-accent retro-text">
                    2.1 Information You Provide
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted retro-text ml-4">
                    <li><strong className="text-accent">Email Address:</strong> Required for account creation and password recovery only. Your email is never displayed publicly.</li>
                    <li><strong className="text-accent">Nickname:</strong> A public display name (3-16 characters) that you choose during registration.</li>
                    <li><strong className="text-accent">Password:</strong> Stored using industry-standard bcrypt hashing. We never store or have access to your plain-text password.</li>
                    <li><strong className="text-accent">Messages:</strong> Chat messages you send in public rooms, private channels, or direct messages.</li>
                    <li><strong className="text-accent">Profile Settings:</strong> Optional preferences like notification settings and display preferences.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-accent retro-text">
                    2.2 Automatically Collected Information
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted retro-text ml-4">
                    <li><strong className="text-accent">User ID (UID):</strong> A unique identifier automatically generated for your account.</li>
                    <li><strong className="text-accent">Timestamps:</strong> Creation and last activity timestamps for security and auto-purge functionality.</li>
                    <li><strong className="text-accent">Session Data:</strong> Temporary session tokens for authentication (automatically expire).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-accent retro-text">
                    2.3 Information We DO NOT Collect
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted retro-text ml-4">
                    <li><strong className="text-accent">IP Addresses:</strong> We do not log or store IP addresses.</li>
                    <li><strong className="text-accent">Device Information:</strong> No device fingerprinting or tracking.</li>
                    <li><strong className="text-accent">Location Data:</strong> We never collect or track your location.</li>
                    <li><strong className="text-accent">Cookies:</strong> No third-party cookies or tracking pixels.</li>
                    <li><strong className="text-accent">Analytics:</strong> No Google Analytics, Facebook Pixel, or similar tracking tools.</li>
                    <li><strong className="text-accent">Advertising Data:</strong> We don't collect data for advertising purposes.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                3. How We Use Your Information
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>We use your information solely for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li><strong className="text-accent">Account Management:</strong> Creating and maintaining your account.</li>
                  <li><strong className="text-accent">Authentication:</strong> Verifying your identity when you log in.</li>
                  <li><strong className="text-accent">Communication:</strong> Delivering messages between users.</li>
                  <li><strong className="text-accent">Security:</strong> Protecting against unauthorized access and abuse.</li>
                  <li><strong className="text-accent">Service Improvement:</strong> Maintaining and improving platform functionality.</li>
                  <li><strong className="text-accent">Legal Compliance:</strong> Complying with applicable laws and regulations.</li>
                </ul>
              </div>
            </section>

            {/* Data Retention and Auto-Purge */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                4. Data Retention and Auto-Purge
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p className="text-accent font-semibold">
                  Deeps Rooms automatically deletes inactive accounts and data:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li><strong className="text-accent">30-Day Auto-Purge:</strong> Accounts with no activity for 30 days are automatically deleted, including all associated messages and data.</li>
                  <li><strong className="text-accent">Manual Purge:</strong> You can manually delete your account and all data at any time using the PURGE_DATA command.</li>
                  <li><strong className="text-accent">Immediate Deletion:</strong> Once purged, all data is permanently deleted from our databases and cannot be recovered.</li>
                  <li><strong className="text-accent">No Backups:</strong> We do not maintain backups of purged user data.</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                5. Data Security
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>We implement industry-standard security measures:</p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li><strong className="text-accent">Encryption:</strong> All data is encrypted in transit (HTTPS/TLS) and at rest.</li>
                  <li><strong className="text-accent">Password Hashing:</strong> Passwords are hashed using bcrypt with salt.</li>
                  <li><strong className="text-accent">Row-Level Security:</strong> Database-level access controls ensure users can only access their own data.</li>
                  <li><strong className="text-accent">Rate Limiting:</strong> Protection against brute-force attacks and abuse.</li>
                  <li><strong className="text-accent">Secure Infrastructure:</strong> Hosted on secure, compliant infrastructure (Supabase).</li>
                </ul>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                6. Data Sharing and Disclosure
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p className="text-accent font-semibold">
                  We do NOT sell, rent, or share your personal information with third parties.
                </p>
                <p>We may disclose information only in the following limited circumstances:</p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li><strong className="text-accent">Legal Requirements:</strong> When required by law, court order, or government request.</li>
                  <li><strong className="text-accent">Safety:</strong> To protect the rights, property, or safety of Deeps Rooms, our users, or the public.</li>
                  <li><strong className="text-accent">Service Providers:</strong> With trusted service providers (e.g., Supabase for hosting) who are contractually obligated to protect your data.</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                7. Your Rights
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>You have the following rights regarding your data:</p>
                <ul className="list-disc list-inside space-y-2 text-muted ml-4">
                  <li><strong className="text-accent">Access:</strong> View your account information in Settings.</li>
                  <li><strong className="text-accent">Correction:</strong> Update your nickname and preferences at any time.</li>
                  <li><strong className="text-accent">Deletion:</strong> Permanently delete your account and all data using PURGE_DATA.</li>
                  <li><strong className="text-accent">Export:</strong> Request a copy of your data by contacting us.</li>
                  <li><strong className="text-accent">Opt-Out:</strong> Disable optional features like AI chat (Oracle 0.0.8 Beta).</li>
                </ul>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                8. Children's Privacy
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  Deeps Rooms is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                9. Changes to This Privacy Policy
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of Deeps Rooms after changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl uppercase tracking-wider mb-4 text-accent retro-title">
                10. Contact Us
              </h2>
              <div className="space-y-3 text-sm retro-text">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
                </p>
                <div className="border border-border p-4 rounded-lg mt-3">
                  <p className="text-muted">
                    Email: <span className="text-accent">privacy@deepchat.app</span>
                  </p>
                  <p className="text-muted mt-2">
                    Response Time: Within 48 hours
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
                <Link href="/legal/tos">
                  <button className="retro-button">
                    Terms of Service
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
