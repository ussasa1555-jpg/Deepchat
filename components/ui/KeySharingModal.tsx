'use client';

import { useState, useEffect } from 'react';
import { generateShareableKeyData, parseSharedKeyData, importSharedKey, ShareableKey } from '@/lib/keySharing';
import QRCode from 'qrcode';

interface KeySharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  encryptionKey: string;
  keyVersion: number;
  expiresAt: number;
}

export function KeySharingModal({
  isOpen,
  onClose,
  roomId,
  encryptionKey,
  keyVersion,
  expiresAt,
}: KeySharingModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [mode, setMode] = useState<'share' | 'import'>('share');
  const [importData, setImportData] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen && mode === 'share') {
      generateQRCode();
    }
  }, [isOpen, mode]);

  const generateQRCode = async () => {
    const shareableKey: ShareableKey = {
      roomId,
      key: encryptionKey,
      version: keyVersion,
      expiresAt,
      sharedAt: Date.now(),
    };

    const data = generateShareableKeyData(shareableKey);

    try {
      const url = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 4,
        color: {
          dark: '#00ff41',
          light: '#0a0e0a',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('QR generation error:', error);
    }
  };

  const handleImport = () => {
    const parsed = parseSharedKeyData(importData);

    if (!parsed) {
      setImportStatus('error');
      return;
    }

    const success = importSharedKey(parsed);

    if (success) {
      setImportStatus('success');
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to apply new key
      }, 2000);
    } else {
      setImportStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="terminal max-w-lg w-full">
        {/* Header */}
        <div className="border-b-2 border-border pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl uppercase tracking-wider text-accent retro-title">
              KEY SYNC
            </h2>
            <button onClick={onClose} className="retro-button text-sm">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('share')}
            className={`flex-1 retro-button ${mode === 'share' ? 'bg-accent/20' : ''}`}
          >
            Share Key
          </button>
          <button
            onClick={() => setMode('import')}
            className={`flex-1 retro-button ${mode === 'import' ? 'bg-accent/20' : ''}`}
          >
            Import Key
          </button>
        </div>

        {/* Share Mode */}
        {mode === 'share' && (
          <div className="space-y-4">
            <p className="text-sm text-accent/70">
              Scan this QR code with another device to sync the encryption key.
            </p>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="flex justify-center p-6 bg-bg/50 border-2 border-accent/30 rounded">
                <img src={qrCodeUrl} alt="Key Sharing QR Code" className="w-80 h-80" />
              </div>
            )}

            {/* Info */}
            <div className="bg-retro-amber/10 border-2 border-retro-amber/30 rounded p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-retro-amber flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-retro-amber">
                  <p className="font-semibold mb-1">SECURITY NOTES:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>QR expires in 24 hours</li>
                    <li>Only share with your own devices</li>
                    <li>Anyone with this QR can decrypt messages</li>
                    <li>Key version: v{keyVersion}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Mode */}
        {mode === 'import' && (
          <div className="space-y-4">
            <p className="text-sm text-accent/70">
              Paste the key data from another device or scan a QR code.
            </p>

            <div>
              <label className="block text-sm font-semibold text-accent mb-2 uppercase">
                Key Data
              </label>
              <textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setImportStatus('idle');
                }}
                placeholder="deepchat://key?data=..."
                className="w-full h-32 bg-bg border-2 border-border p-3 text-accent font-mono text-sm focus:border-accent focus:outline-none resize-none"
              />
            </div>

            {/* Status Messages */}
            {importStatus === 'success' && (
              <div className="bg-accent/10 border-2 border-accent rounded p-3 text-accent text-sm">
                ✓ Key imported successfully! Reloading...
              </div>
            )}

            {importStatus === 'error' && (
              <div className="bg-retro-amber/10 border-2 border-retro-amber rounded p-3 text-retro-amber text-sm">
                ✗ Invalid or expired key data
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!importData || importStatus === 'success'}
              className="retro-button w-full"
            >
              {importStatus === 'success' ? 'Importing...' : 'Import Key'}
            </button>

            {/* Alternative: Camera Scanner (future enhancement) */}
            <div className="text-center pt-4 border-t-2 border-border">
              <p className="text-xs text-accent/50">
                Camera QR scanner coming soon
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}







