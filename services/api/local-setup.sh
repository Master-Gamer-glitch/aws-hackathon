#!/bin/bash

# CrewDesk Local Setup - Starts LocalStack and creates DynamoDB tables

set -e

echo "🚀 Starting CrewDesk local environment..."

# 1. Start LocalStack (if not running)
echo "📦 Checking LocalStack..."
if ! docker ps | grep -q localstack; then
  echo "Starting LocalStack..."
  docker run -d \
    --name localstack \
    -p 4566:4566 \
    -e SERVICES=dynamodb,s3,events \
    localstack/localstack:latest
  sleep 3
else
  echo "✅ LocalStack already running"
fi

# 2. Create DynamoDB tables
echo "📊 Creating DynamoDB tables..."

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

ENDPOINT="--endpoint-url http://localhost:4566"

# Tasks table
aws dynamodb create-table \
  --table-name crewdesk-tasks \
  --attribute-definitions \
    AttributeName=projectId,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=state,AttributeType=S \
    AttributeName=leaseOwner,AttributeType=S \
    AttributeName=leaseExpiry,AttributeType=N \
  --key-schema \
    AttributeName=projectId,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    'IndexName=StateIndex,KeySchema=[{AttributeName=state,KeyType=HASH},{AttributeName=sk,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    'IndexName=DeviceIndex,KeySchema=[{AttributeName=leaseOwner,KeyType=HASH},{AttributeName=leaseExpiry,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  $ENDPOINT 2>/dev/null || echo "✅ Tasks table exists"

# Projects table
aws dynamodb create-table \
  --table-name crewdesk-projects \
  --attribute-definitions \
    AttributeName=projectId,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=projectId,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  $ENDPOINT 2>/dev/null || echo "✅ Projects table exists"

# Devices table
aws dynamodb create-table \
  --table-name crewdesk-devices \
  --attribute-definitions \
    AttributeName=deviceId,AttributeType=S \
    AttributeName=roomId,AttributeType=S \
    AttributeName=lastHeartbeat,AttributeType=N \
  --key-schema \
    AttributeName=deviceId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    'IndexName=RoomIndex,KeySchema=[{AttributeName=roomId,KeyType=HASH},{AttributeName=lastHeartbeat,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  $ENDPOINT 2>/dev/null || echo "✅ Devices table exists"

# Checkpoints table
aws dynamodb create-table \
  --table-name crewdesk-checkpoints \
  --attribute-definitions \
    AttributeName=projectId,AttributeType=S \
    AttributeName=checkpointId,AttributeType=S \
    AttributeName=taskId,AttributeType=S \
  --key-schema \
    AttributeName=projectId,KeyType=HASH \
    AttributeName=checkpointId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    'IndexName=TaskIndex,KeySchema=[{AttributeName=taskId,KeyType=HASH}],Projection={ProjectionType=ALL}' \
  $ENDPOINT 2>/dev/null || echo "✅ Checkpoints table exists"

echo ""
echo "✅ Local environment ready!"
echo ""
echo "Environment variables set:"
echo "  AWS_REGION=us-east-1"
echo "  DYNAMODB_ENDPOINT=http://localhost:4566"
echo ""
echo "Next:"
echo "  1. npm install"
echo "  2. npm test (run unit tests)"
echo "  3. sam local start-api (start Lambda locally)"
echo ""
