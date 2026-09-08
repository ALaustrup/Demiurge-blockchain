/**
 * VYB Real-Time Stream API (Server-Sent Events)
 * GET /api/vyb/stream - SSE endpoint for real-time events
 * 
 * Events sent:
 *   message    - New message in a room
 *   dm         - New direct message
 *   presence   - User presence update
 *   typing     - Typing indicator
 *   room       - Room update (member join/leave)
 */

import { NextRequest } from 'next/server';
import { requireQorUser, isAuthFailure } from '@/lib/auth/require-qor-user';
import { query } from '@/lib/db';
import { eventBus } from '@/lib/vyb/event-bus';

export async function GET(req: NextRequest) {
  // Identity comes from the validated token (EventSource sends the qor_token
  // cookie on same-origin requests); the `?qorId=` query param is ignored.
  const auth = await requireQorUser(req);
  if (isAuthFailure(auth)) return auth;
  const qorId = auth.qorId;

  // Get user's joined rooms for filtering
  let userRoomIds: string[] = [];
  try {
    const rooms = await query<{ room_id: string }>(`
      SELECT room_id FROM vyb_room_members WHERE qor_id = $1
    `, [qorId]);
    userRoomIds = rooms.map(r => r.room_id);
  } catch {
    // Ignore DB errors for SSE
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ qorId, rooms: userRoomIds })}\n\n`));

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Subscribe to events
      const unsubscribe = eventBus.subscribe(qorId, (event) => {
        // Filter: only send room events for rooms the user is in
        if (event.roomId && !userRoomIds.includes(event.roomId)) return;

        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`)
          );
        } catch {
          // Connection closed
        }
      });

      // Publish presence
      eventBus.publish({
        type: 'presence',
        data: { qorId, status: 'online' },
      });

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        eventBus.publish({
          type: 'presence',
          data: { qorId, status: 'offline' },
        });
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
