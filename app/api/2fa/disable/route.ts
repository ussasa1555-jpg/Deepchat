import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, getClientIdentifier } from '@/lib/rateLimitMiddleware';
import { verifyTOTP } from '@/lib/twoFactor';

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  
  return withRateLimit(request, '2fa_disable', identifier, async () => {
    try {
      const { code, password } = await request.json();
      
      if (!code || !password) {
        return NextResponse.json({ error: 'Code and password required' }, { status: 400 });
      }

      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Verify password first
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      });

      if (passwordError) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
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

      // Verify TOTP code or backup code
      let isValid = false;
      
      if (profile.two_factor_secret) {
        isValid = verifyTOTP(profile.two_factor_secret, code);
      }
      
      if (!isValid && profile.backup_codes) {
        const backupCodes = profile.backup_codes as string[];
        isValid = backupCodes.includes(code.toUpperCase());
      }

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 403 });
      }

      // Disable 2FA
      const { error } = await supabase
        .from('users')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          backup_codes: [],
        })
        .eq('uid', user.id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('2FA disable error:', error);
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }
  });
}










