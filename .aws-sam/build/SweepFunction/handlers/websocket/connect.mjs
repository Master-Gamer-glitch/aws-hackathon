/**
 * WebSocket $connect handler
 * Stores connection ID for later broadcasting
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';

export async function connectHandler(event) {
  const connectionId = event.requestContext.connectionId;
  const projectId = event.queryStringParameters?.projectId || 'default';
  const now = Date.now();

  try {
    // Store connection for broadcasting
    await db.putItem(TABLES.CONNECTIONS, {
      projectId,
      connectionId,
      createdAt: now,
      expiresAt: now + 3600000 // 1 hour TTL
    });

    console.log(`[CONNECT] ${projectId}:${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' })
    };
  } catch (err) {
    console.error('Connect error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default connectHandler;
