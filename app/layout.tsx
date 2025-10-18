import type { Metadata } from 'next';
import { Fira_Code } from 'next/font/google';
import './globals.css';
import { PresenceProvider } from '@/lib/PresenceProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Script from 'next/script';

const firaCode = Fira_Code({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Deeps Rooms — Retro Privacy Chat',
  description: 'Privacy-focused chat platform with 1980s terminal aesthetics and ephemeral messaging',
  keywords: ['chat', 'privacy', 'retro', 'terminal', 'ephemeral', 'anonymous'],
  authors: [{ name: 'Deeps Rooms Team' }],
  openGraph: {
  title: 'Deeps Rooms',
  description: 'Privacy-focused retro chat platform',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Plausible Analytics - Privacy-friendly */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body className={firaCode.variable}>
        <ErrorBoundary>
          <PresenceProvider>
            {/* CRT Scanlines Overlay */}
            <div className="crt-overlay" aria-hidden="true" />
            
            {/* Main Content */}
            <main className="min-h-screen">
              {children}
            </main>
          </PresenceProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
