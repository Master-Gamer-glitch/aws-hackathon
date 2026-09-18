import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { db } from './dynamodb.mjs';
import { TABLES } from '../schema.mjs';

const apiGw = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

export async function broadcast(event) {
  const projectId = event.projectId || 'default';

  try {
    // Fetch all active connections for this project
    const connections = await db.queryTable(
      TABLES.CONNECTIONS,
      'projectId = :projectId',
      { ':projectId': projectId }
    );

    console.log(`[BROADCAST] ${event.type} → ${connections.length} connections`);

    const message = JSON.stringify(event);
    const payload = new TextEncoder().encode(message);

    // Send to each connection
    const results = await Promise.allSettled(
      connections.map(conn =>
        apiGw.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: payload
        }))
      )
    );

    // Log failures (connection might be dead)
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.log(`[BROADCAST] ${failures.length} failures (dead connections)`);
    }

    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: failures.length
    };
  } catch (err) {
    console.error('[BROADCAST] Error:', err);
    // Don't fail - broadcast is best-effort
    return { sent: 0, failed: 0, error: err.message };
  }
}

export default broadcast;
