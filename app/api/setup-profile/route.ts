import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, getClientIdentifier } from '@/lib/rateLimitMiddleware';

/**
 * API route to create user profile after registration
 * Called automatically on first login
 */
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  
  return withRateLimit(request, 'setup_profile', identifier, async () => {
  try {
    const supabase = createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if profile already exists (use auth user.id as uid)
    const { data: existing } = await supabase
      .from('users')
      .select('uid')
      .eq('uid', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ uid: existing.uid, exists: true });
    }

    // Get nickname from user metadata (set during registration)
    const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || 'User';

    // Create profile with auth user ID as uid
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        uid: user.id,  // Use Supabase auth user ID
        email: user.email,
        nickname,
      })
      .select('uid')
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ uid: newUser.uid, exists: false });
  } catch (error: any) {
    console.error('Profile setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  });
}


