/**
 * WebSocket $disconnect handler
 * Removes connection ID from broadcast list
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';

export async function disconnectHandler(event) {
  const connectionId = event.requestContext.connectionId;
  const projectId = event.queryStringParameters?.projectId || 'default';

  try {
    // Remove connection from broadcast list
    // Note: In production, use deleteItem. For now, mark with TTL expiry.
    await db.putItem(TABLES.CONNECTIONS, {
      projectId,
      connectionId,
      disconnectedAt: Date.now(),
      expiresAt: Date.now() // Immediate expiry via TTL
    });

    console.log(`[DISCONNECT] ${projectId}:${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' })
    };
  } catch (err) {
    console.error('Disconnect error:', err);
    // Don't fail - disconnect should be resilient
    return {
      statusCode: 200,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default disconnectHandler;
