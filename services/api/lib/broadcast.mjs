import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const apiGw = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

export async function broadcast(event) {
  // In production: get connections from DynamoDB and post to each
  // For now: just log (will be replaced with real WebSocket impl)
  console.log('[BROADCAST]', JSON.stringify(event));

  // TODO: In integration, fetch connection IDs from DB and post to each
  // const connections = await db.queryTable('Connections', 'projectId = :projectId', { ':projectId': event.projectId });
  // for (const conn of connections) {
  //   await apiGw.send(new PostToConnectionCommand({
  //     ConnectionId: conn.connectionId,
  //     Data: JSON.stringify(event)
  //   }));
  // }
}

export default broadcast;
