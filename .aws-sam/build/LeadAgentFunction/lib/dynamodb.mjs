import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const clientConfig = {
  region: process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  };
}

const client = new DynamoDBClient(clientConfig);
const doc = DynamoDBDocumentClient.from(client);

export async function getItem(TableName, Key) {
  try {
    const result = await doc.send(new GetCommand({ TableName, Key }));
    return result.Item;
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') return null;
    throw err;
  }
}

export async function putItem(TableName, Item) {
  await doc.send(new PutCommand({ TableName, Item }));
}

export async function updateItem(TableName, Key, UpdateExpression, ExpressionAttributeNames = {}, ExpressionAttributeValues = {}, ConditionExpression = null) {
  const params = {
    TableName,
    Key,
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  if (ConditionExpression) {
    params.ConditionExpression = ConditionExpression;
  }

  try {
    const result = await doc.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      throw new Error('CONDITION_FAILED');
    }
    throw err;
  }
}

export async function scanTable(TableName, FilterExpression = null, ExpressionAttributeValues = {}, ExpressionAttributeNames = {}) {
  const params = {
    TableName,
    ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? ExpressionAttributeValues : undefined,
    ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
    FilterExpression
  };

  const result = await doc.send(new ScanCommand(params));
  return result.Items || [];
}

export async function queryTable(TableName, KeyConditionExpression, ExpressionAttributeValues, IndexName = null) {
  const params = {
    TableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
    IndexName
  };

  const result = await doc.send(new QueryCommand(params));
  return result.Items || [];
}

export const db = {
  getItem,
  putItem,
  updateItem,
  scanTable,
  queryTable
};
