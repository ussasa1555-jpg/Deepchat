import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { withRateLimit, getClientIdentifier } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  
  return withRateLimit(request, 'private_room_key', identifier, async () => {
    try {
      const { roomKey } = await request.json();

    if (!roomKey || typeof roomKey !== 'string') {
      return NextResponse.json(
        { error: '[ERROR] INVALID_KEY_FORMAT' },
        { status: 400 }
      );
    }

    // Validate key format (XXXX-XXXX-XXXX)
    const keyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!keyRegex.test(roomKey)) {
      return NextResponse.json(
        { error: '[ERROR] INVALID_KEY_FORMAT' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '[ERROR] UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Find room with matching key hash
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('type', 'private');

    if (roomError) throw roomError;

    // Check each room's key hash
    for (const room of rooms || []) {
      if (room.key_hash) {
        const isMatch = await bcrypt.compare(roomKey, room.key_hash);
        if (isMatch) {
          return NextResponse.json({
            success: true,
            roomId: room.id,
            roomName: room.name,
          });
        }
      }
    }

    return NextResponse.json(
      { error: '[ERROR_403] ACCESS_DENIED' },
      { status: 403 }
    );
    } catch (error: any) {
      console.error('Key validation error:', error);
      return NextResponse.json(
        { error: '[ERROR] VALIDATION_FAILED' },
        { status: 500 }
      );
    }
  });
}


