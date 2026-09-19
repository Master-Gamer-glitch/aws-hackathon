#!/bin/bash

# Airstream Production Deploy Script
# Builds, deploys to AWS, and updates UI with live endpoints

set -e

echo "🚀 Airstream Deployment Script"
echo "=============================="
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

# Get AWS account info
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

echo "📍 AWS Account: $ACCOUNT"
echo "📍 Region: $REGION"
echo ""

# Build
echo "🔨 Building SAM template..."
sam build

# Deploy
echo ""
echo "📤 Deploying to AWS..."
echo "(Stack name: crewdesk)"
echo ""

sam deploy --guided || sam deploy --region $REGION

# Get outputs
echo ""
echo "⏳ Getting API endpoints from CloudFormation..."
sleep 2

API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name crewdesk \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text 2>/dev/null || echo "")

WS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name crewdesk \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiEndpoint`].OutputValue' \
  --output text 2>/dev/null || echo "")

# Try alternate output names
if [ -z "$API_ENDPOINT" ]; then
  API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name crewdesk \
    --region $REGION \
    --query 'Stacks[0].Outputs[?contains(OutputKey, `Api`)].OutputValue' \
    --output text 2>/dev/null | head -1)
fi

if [ -z "$WS_ENDPOINT" ]; then
  WS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name crewdesk \
    --region $REGION \
    --query 'Stacks[0].Outputs[?contains(OutputKey, `WebSocket`)].OutputValue' \
    --output text 2>/dev/null | head -1)
fi

echo ""
if [ ! -z "$API_ENDPOINT" ] && [ ! -z "$WS_ENDPOINT" ]; then
    echo "✅ Endpoints Retrieved:"
    echo "   API: $API_ENDPOINT"
    echo "   WebSocket: $WS_ENDPOINT"
    echo ""

    # Update kaam-chalau.html
    echo "🔧 Updating kaam-chalau.html with live endpoints..."

    # Escape special characters for sed
    API_ENDPOINT_ESC=$(echo "$API_ENDPOINT" | sed 's/[\/&]/\\&/g')
    WS_ENDPOINT_ESC=$(echo "$WS_ENDPOINT" | sed 's/[\/&]/\\&/g')

    sed -i.bak \
      -e "s|const API_BASE_URL = '.*'|const API_BASE_URL = '$API_ENDPOINT_ESC'|" \
      -e "s|const WS_BASE_URL = '.*'|const WS_BASE_URL = '$WS_ENDPOINT_ESC'|" \
      kaam-chalau.html

    rm -f kaam-chalau.html.bak

    echo "✅ UI Updated"
else
    echo "⚠️  Could not retrieve endpoints automatically"
    echo "   Update manually in kaam-chalau.html:"
    echo "   Line 1: const API_BASE_URL = 'YOUR_API_URL'"
    echo "   Line 2: const WS_BASE_URL = 'YOUR_WEBSOCKET_URL'"
fi

echo ""
echo "=============================="
echo "✅ Deployment Complete!"
echo ""
echo "📊 Next Steps:"
echo "   1. Open kaam-chalau.html in browser"
echo "   2. On master device: Create room"
echo "   3. On slave devices: Join room"
echo "   4. Watch live events in UI"
echo ""
echo "📖 Full testing guide: AIRSTREAM_PROD_TEST.md"
echo ""
echo "🔗 DynamoDB Tables Created:"
aws dynamodb list-tables --region $REGION | grep crewdesk || echo "   (Tables listed above)"
echo ""
