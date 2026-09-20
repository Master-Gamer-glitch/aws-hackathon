#!/bin/bash

# Kaam Chalau Frontend Deployment Script
# Deploys frontend to AWS S3 with public access

set -e

echo "🚀 Kaam Chalau Frontend Deployment"
echo "===================================="
echo ""

# Configuration
PROFILE=${AWS_PROFILE:-crewdesk}
REGION=${AWS_REGION:-us-west-2}
BUCKET_PREFIX="crewdesk-ui"

# Check AWS credentials
if ! aws sts get-caller-identity --profile $PROFILE > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured for profile: $PROFILE"
    echo "Run: aws configure --profile $PROFILE"
    exit 1
fi

# Get current directory (where this script is)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create unique bucket name
BUCKET="${BUCKET_PREFIX}-$(date +%s)"

echo "📍 AWS Account: $(aws sts get-caller-identity --profile $PROFILE --query Account --output text)"
echo "📍 Region: $REGION"
echo "📦 Bucket: $BUCKET"
echo ""

# Create bucket
echo "🔨 Creating S3 bucket..."
aws s3 mb s3://$BUCKET \
  --region $REGION \
  --profile $PROFILE

echo "✅ Bucket created"
echo ""

# Upload all files
echo "📤 Uploading files..."

for file in "$SCRIPT_DIR"/*; do
    if [ -f "$file" ]; then
        FILENAME=$(basename "$file")

        # Determine content type
        case $FILENAME in
            *.html)
                CONTENT_TYPE="text/html"
                ;;
            *.js)
                CONTENT_TYPE="application/javascript"
                ;;
            *.css)
                CONTENT_TYPE="text/css"
                ;;
            *.json)
                CONTENT_TYPE="application/json"
                ;;
            *.png)
                CONTENT_TYPE="image/png"
                ;;
            *.jpg|*.jpeg)
                CONTENT_TYPE="image/jpeg"
                ;;
            *.svg)
                CONTENT_TYPE="image/svg+xml"
                ;;
            *)
                CONTENT_TYPE="application/octet-stream"
                ;;
        esac

        echo "  • $FILENAME ($CONTENT_TYPE)"

        aws s3 cp "$file" s3://$BUCKET/$FILENAME \
          --content-type "$CONTENT_TYPE" \
          --region $REGION \
          --profile $PROFILE
    fi
done

# Upload subdirectories (styles, js, assets)
for dir in "$SCRIPT_DIR"/{styles,js,assets}; do
    if [ -d "$dir" ]; then
        DIRNAME=$(basename "$dir")
        echo "  📁 Uploading $DIRNAME/"
        aws s3 sync "$dir" s3://$BUCKET/$DIRNAME \
          --region $REGION \
          --profile $PROFILE
    fi
done

echo ""
echo "✅ Files uploaded"
echo ""

# Make bucket public
echo "🔓 Making bucket public..."

aws s3api put-bucket-policy \
  --bucket $BUCKET \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"PublicRead\",
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
      }
    ]
  }" \
  --region $REGION \
  --profile $PROFILE

echo "✅ Bucket is now public"
echo ""

# Print URLs
echo "===================================="
echo "✅ Deployment Complete!"
echo ""
echo "📍 Frontend Live URL:"
echo "   https://$BUCKET.s3.us-west-2.amazonaws.com/index.html"
echo ""
echo "📊 Other files:"
echo "   https://$BUCKET.s3.us-west-2.amazonaws.com/config.js"
echo ""
echo "💾 Save this bucket name to redeploy:"
echo "   $BUCKET"
echo ""
echo "🔧 To update files later:"
echo "   aws s3 sync . s3://$BUCKET --profile $PROFILE --region $REGION"
echo ""
