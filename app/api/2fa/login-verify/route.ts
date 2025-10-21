import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, getClientIdentifier } from '@/lib/rateLimitMiddleware';
import { verifyTOTP } from '@/lib/twoFactor';

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  
  return withRateLimit(request, '2fa_login_verify', identifier, async () => {
    try {
      const { code } = await request.json();
      
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
      }

      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Get user's 2FA secret
      const { data: profile } = await supabase
        .from('users')
        .select('two_factor_secret, two_factor_enabled, backup_codes')
        .eq('uid', user.id)
        .single();

      if (!profile?.two_factor_enabled) {
        return NextResponse.json({ error: '2FA not enabled' }, { status: 400 });
      }

      // Verify TOTP code
      let isValid = false;
      let usedBackupCode = false;

      if (profile.two_factor_secret) {
        isValid = verifyTOTP(profile.two_factor_secret, code);
      }
      
      // If TOTP fails, check backup codes
      if (!isValid && profile.backup_codes) {
        const backupCodes = profile.backup_codes as string[];
        const codeIndex = backupCodes.indexOf(code.toUpperCase());
        
        if (codeIndex !== -1) {
          // Remove used backup code
          const updatedCodes = backupCodes.filter((_, i) => i !== codeIndex);
          await supabase
            .from('users')
            .update({ backup_codes: updatedCodes })
            .eq('uid', user.id);
          
          isValid = true;
          usedBackupCode = true;
        }
      }

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 403 });
      }

      return NextResponse.json({ 
        success: true,
        usedBackupCode 
      });
    } catch (error: any) {
      console.error('2FA login verify error:', error);
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 500 }
      );
    }
  });
}












