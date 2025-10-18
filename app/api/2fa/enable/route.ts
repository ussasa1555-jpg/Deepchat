import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, getClientIdentifier } from '@/lib/rateLimitMiddleware';
import { generateSecret, generateBackupCodes, generateQRCodeUrl } from '@/lib/twoFactor';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  
  return withRateLimit(request, '2fa_enable', identifier, async () => {
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Check if already enabled
      const { data: profile } = await supabase
        .from('users')
        .select('two_factor_enabled, email')
        .eq('uid', user.id)
        .single();

      if (profile?.two_factor_enabled) {
        return NextResponse.json({ error: '2FA already enabled' }, { status: 400 });
      }

      // Generate secret and backup codes
      const secret = generateSecret();
      const backupCodes = generateBackupCodes(10);
      const email = profile?.email || user.email || 'user@deepchat.app';

      // Generate QR code URL
      const otpauthUrl = generateQRCodeUrl(secret, email);
      
      console.log('[2FA] Secret:', secret);
      console.log('[2FA] Email:', email);
      console.log('[2FA] OTPAuth URL:', otpauthUrl);
      
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'H',  // High error correction for better scanning
        type: 'image/png',
        width: 400,                  // Larger size for better readability
        margin: 4,                   // Add margin for camera focus
        color: {
          dark: '#000000',           // Pure black
          light: '#FFFFFF'           // Pure white for maximum contrast
        }
      });

      // Store secret temporarily (not enabled yet, requires verification)
      const { error } = await supabase
        .from('users')
        .update({
          two_factor_secret: secret,
          backup_codes: backupCodes,
        })
        .eq('uid', user.id);

      if (error) throw error;

      return NextResponse.json({
        secret,
        qrCode: qrCodeDataUrl,
        backupCodes,
      });
    } catch (error: any) {
      console.error('2FA enable error:', error);
      return NextResponse.json(
        { error: 'Failed to enable 2FA' },
        { status: 500 }
      );
    }
  });
}


