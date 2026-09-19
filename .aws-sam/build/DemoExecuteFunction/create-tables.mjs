/**
 * Creates all DynamoDB tables in LocalStack
 * Run: node create-tables.mjs
 */
import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
});

async function createTable(params) {
  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created: ${params.TableName}`);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log(`⏭️  Exists:  ${params.TableName}`);
    } else {
      console.error(`❌ Failed:  ${params.TableName} — ${err.message}`);
    }
  }
}

await createTable({
  TableName: 'crewdesk-tasks',
  AttributeDefinitions: [
    { AttributeName: 'projectId', AttributeType: 'S' },
    { AttributeName: 'sk',        AttributeType: 'S' },
    { AttributeName: 'state',     AttributeType: 'S' },
    { AttributeName: 'leaseOwner',AttributeType: 'S' },
    { AttributeName: 'leaseExpiry',AttributeType:'N' },
  ],
  KeySchema: [
    { AttributeName: 'projectId', KeyType: 'HASH' },
    { AttributeName: 'sk',        KeyType: 'RANGE' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'StateIndex',
      KeySchema: [
        { AttributeName: 'state', KeyType: 'HASH' },
        { AttributeName: 'sk',    KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'DeviceIndex',
      KeySchema: [
        { AttributeName: 'leaseOwner',  KeyType: 'HASH' },
        { AttributeName: 'leaseExpiry', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
});

await createTable({
  TableName: 'crewdesk-projects',
  AttributeDefinitions: [
    { AttributeName: 'projectId', AttributeType: 'S' },
    { AttributeName: 'sk',        AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'projectId', KeyType: 'HASH' },
    { AttributeName: 'sk',        KeyType: 'RANGE' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
});

await createTable({
  TableName: 'crewdesk-devices',
  AttributeDefinitions: [
    { AttributeName: 'deviceId',      AttributeType: 'S' },
    { AttributeName: 'roomId',        AttributeType: 'S' },
    { AttributeName: 'lastHeartbeat', AttributeType: 'N' },
  ],
  KeySchema: [
    { AttributeName: 'deviceId', KeyType: 'HASH' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'RoomIndex',
      KeySchema: [
        { AttributeName: 'roomId',        KeyType: 'HASH' },
        { AttributeName: 'lastHeartbeat', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
});

await createTable({
  TableName: 'crewdesk-connections',
  AttributeDefinitions: [
    { AttributeName: 'projectId',    AttributeType: 'S' },
    { AttributeName: 'connectionId', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'projectId',    KeyType: 'HASH' },
    { AttributeName: 'connectionId', KeyType: 'RANGE' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
});

await createTable({
  TableName: 'crewdesk-checkpoints',
  AttributeDefinitions: [
    { AttributeName: 'projectId',    AttributeType: 'S' },
    { AttributeName: 'checkpointId', AttributeType: 'S' },
    { AttributeName: 'taskId',       AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'projectId',    KeyType: 'HASH' },
    { AttributeName: 'checkpointId', KeyType: 'RANGE' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'TaskIndex',
      KeySchema: [
        { AttributeName: 'taskId', KeyType: 'HASH' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
});

// List all tables to confirm
const { TableNames } = await client.send(new ListTablesCommand({}));
console.log('\n📋 All tables in LocalStack:');
TableNames.forEach(t => console.log(`   • ${t}`));
