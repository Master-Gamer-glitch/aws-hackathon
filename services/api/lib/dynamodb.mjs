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

/**
 * Update an item. Two call styles:
 *  - expression:  updateItem(table, key, 'SET #a = :a', { '#a': 'a' }, { ':a': 1 }, 'optional condition')
 *  - fields:      updateItem(table, key, { status: 'online', lastHeartbeat: 123 })
 * The fields form SETs every key (null stores a DynamoDB NULL; undefined is skipped) and uses
 * placeholders throughout, so reserved words such as `status` and `state` are safe.
 */
export async function updateItem(TableName, Key, UpdateExpression, ExpressionAttributeNames = {}, ExpressionAttributeValues = {}, ConditionExpression = null) {
  let expr = UpdateExpression;
  let names = ExpressionAttributeNames;
  let values = ExpressionAttributeValues;

  if (expr && typeof expr === 'object') {
    names = {};
    values = {};
    const sets = [];
    Object.entries(expr).forEach(([field, value], i) => {
      if (value === undefined) return;
      names[`#f${i}`] = field;
      values[`:v${i}`] = value;
      sets.push(`#f${i} = :v${i}`);
    });
    if (sets.length === 0) return null;
    expr = `SET ${sets.join(', ')}`;
  }

  const params = {
    TableName,
    Key,
    UpdateExpression: expr,
    ExpressionAttributeNames: Object.keys(names).length > 0 ? names : undefined,
    ExpressionAttributeValues: Object.keys(values).length > 0 ? values : undefined,
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

/**
 * Query a table or index with an options object. Follows pagination, so callers
 * always get every matching item.
 *   query(table, { indexName, keyConditionExpression, filterExpression,
 *                  expressionAttributeNames, expressionAttributeValues, limit })
 */
export async function query(TableName, opts = {}) {
  const {
    indexName, keyConditionExpression, filterExpression,
    expressionAttributeNames, expressionAttributeValues, scanIndexForward, limit
  } = opts;
  const nonEmpty = (o) => (o && Object.keys(o).length > 0 ? o : undefined);

  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await doc.send(new QueryCommand({
      TableName,
      IndexName: indexName || undefined,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeNames: nonEmpty(expressionAttributeNames),
      ExpressionAttributeValues: nonEmpty(expressionAttributeValues),
      ScanIndexForward: scanIndexForward,
      ExclusiveStartKey
    }));
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey && (!limit || items.length < limit));

  return limit ? items.slice(0, limit) : items;
}

export const db = {
  getItem,
  putItem,
  updateItem,
  scanTable,
  queryTable,
  query
};
