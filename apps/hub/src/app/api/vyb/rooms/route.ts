/**
 * VYB Chat Rooms API
 * GET  /api/vyb/rooms - List rooms
 * POST /api/vyb/rooms - Create room
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireQorUser, isAuthFailure } from '@/lib/auth/require-qor-user';
import * as chatService from '@/lib/vyb/chat-service';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const userOnly = req.nextUrl.searchParams.get('mine') === 'true';

    let rooms;
    if (userOnly) {
      const auth = await requireQorUser(req);
      if (isAuthFailure(auth)) return auth;
      rooms = await chatService.getUserRooms(auth.qorId);
    } else {
      rooms = await chatService.listRooms(search);
    }

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('[API] Failed to list rooms:', error);
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireQorUser(req);
    if (isAuthFailure(auth)) return auth;
    const qorId = auth.qorId;

    const body = await req.json();
    const { name, description, type, password, maxMembers } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Room name must be at least 2 characters' }, { status: 400 });
    }

    const room = await chatService.createRoom(
      name.trim(),
      description?.trim() || '',
      type || 'public',
      qorId,
      password,
      maxMembers,
    );

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
