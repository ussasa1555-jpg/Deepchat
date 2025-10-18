import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logAdminAction } from '@/lib/adminActionLogger';

/**
 * API Route: Lock/Unlock Room (Management Only)
 * Allows management to lock rooms with a reason
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is management
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('uid', session.user.id)
      .single();

    if (!user || user.role !== 'management') {
      return NextResponse.json(
        { error: 'Management role required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const { room_id, action, reason, lock_type = 'soft' } = body;

    if (!room_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: room_id, action' },
        { status: 400 }
      );
    }

    if (action === 'lock' && (!reason || reason.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Lock reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get room details for logging
    const { data: room } = await supabase
      .from('rooms')
      .select('name, type')
      .eq('id', room_id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (action === 'lock') {
      // Lock the room
      const { error: lockError } = await supabase.rpc('lock_room', {
        p_room_id: room_id,
        p_locked_by: session.user.id,
        p_reason: reason,
        p_lock_type: lock_type,
      });

      if (lockError) {
        console.error('[LOCK-ROOM] Lock error:', lockError);
        return NextResponse.json(
          { error: `Failed to lock room: ${lockError.message}` },
          { status: 500 }
        );
      }

      // Log the action
      await logAdminAction({
        admin_uid: session.user.id,
        admin_role: user.role as 'admin' | 'management',
        action_type: 'room_lock' as any,
        action_category: 'critical',
        target_type: 'room',
        target_id: room_id,
        action_details: {
          room_name: room.name,
          room_type: room.type,
          reason: reason,
          lock_type: lock_type,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        success: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Room locked successfully',
      });
    } else if (action === 'unlock') {
      // Unlock the room
      const { error: unlockError } = await supabase.rpc('unlock_room', {
        p_room_id: room_id,
        p_unlocked_by: session.user.id,
        p_reason: reason || 'Manual unlock by management',
      });

      if (unlockError) {
        console.error('[LOCK-ROOM] Unlock error:', unlockError);
        return NextResponse.json(
          { error: `Failed to unlock room: ${unlockError.message}` },
          { status: 500 }
        );
      }

      // Log the action
      await logAdminAction({
        admin_uid: session.user.id,
        admin_role: user.role as 'admin' | 'management',
        action_type: 'room_unlock' as any,
        action_category: 'critical',
        target_type: 'room',
        target_id: room_id,
        action_details: {
          room_name: room.name,
          room_type: room.type,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        success: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Room unlocked successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "lock" or "unlock"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[LOCK-ROOM] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

