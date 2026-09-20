/**
 * Create Airstream room (master device)
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import { withCors } from '../../lib/cors.mjs';

async function createRoomHandlerImpl(event) {
  const { projectId } = event.pathParameters;
  const { deviceId, deviceName } = JSON.parse(event.body);

  const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();

  try {
    // Create room
    await db.putItem(TABLES.ROOMS, {
      roomId,
      projectId,
      masterDeviceId: deviceId,
      masterDeviceName: deviceName,
      status: 'waiting', // waiting -> executing -> done
      createdAt: now,
      devices: [deviceId],
      expiresAt: now + 86400000 // 24h TTL
    });

    // Register master device
    await db.putItem(TABLES.DEVICES, {
      deviceId,
      roomId,
      name: deviceName,
      isMaster: true,
      status: 'online',
      lastHeartbeat: now,
      expiresAt: now + 30000 // 30s TTL, renewed by heartbeat
    });

    console.log(`[ROOM] Created room ${roomId} (master: ${deviceId})`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        masterId: deviceId,
        message: 'Room created. Waiting for devices to join...'
      })
    };
  } catch (err) {
    console.error('Create room error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export const createRoomHandler = withCors(createRoomHandlerImpl);
export default createRoomHandler;
