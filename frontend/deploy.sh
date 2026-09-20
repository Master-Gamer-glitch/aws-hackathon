#!/usr/bin/env bash
# Build the frontend as a static export and publish it to AWS Amplify Hosting (HTTPS).
#
#   ./deploy.sh                 build + upload + publish (creates the Amplify app on first run)
#   SKIP_BUILD=1 ./deploy.sh    publish the existing ./out without rebuilding
#
# Needs: aws CLI, node/npm, zip. Override any variable below via the environment.
set -euo pipefail

PROFILE="${AWS_PROFILE:-crewdesk}"
REGION="${AWS_REGION:-us-west-2}"
APP_NAME="${AMPLIFY_APP_NAME:-crewdesk-frontend}"
BRANCH="${AMPLIFY_BRANCH:-main}"

# Backend endpoints baked into the build. REST and WebSocket are different APIs.
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod}"
export NEXT_PUBLIC_WS_BASE_URL="${NEXT_PUBLIC_WS_BASE_URL:-wss://34gffaaf1a.execute-api.us-west-2.amazonaws.com/dev}"
export NEXT_PUBLIC_PROJECT_ID="${NEXT_PUBLIC_PROJECT_ID:-proj_demo}"

cd "$(dirname "${BASH_SOURCE[0]}")"
AWS=(aws --profile "$PROFILE" --region "$REGION")

echo "Account: $("${AWS[@]}" sts get-caller-identity --query Account --output text)  Region: $REGION"

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "==> Building static export"
  [ -d node_modules ] || npm ci --no-audit --no-fund
  rm -rf out .next
  STATIC_EXPORT=true npm run build
fi
[ -f out/index.html ] || { echo "out/index.html missing - build failed?"; exit 1; }

echo "==> Finding Amplify app '$APP_NAME'"
APP_ID="$("${AWS[@]}" amplify list-apps --query "apps[?name=='$APP_NAME']|[0].appId" --output text)"
if [ -z "$APP_ID" ] || [ "$APP_ID" = "None" ]; then
  echo "    not found - creating"
  APP_ID="$("${AWS[@]}" amplify create-app --name "$APP_NAME" --platform WEB --query app.appId --output text)"
  "${AWS[@]}" amplify create-branch --app-id "$APP_ID" --branch-name "$BRANCH" --stage PRODUCTION >/dev/null
fi
echo "    app id: $APP_ID"

ZIP="$(mktemp -d)/site.zip"
(cd out && zip -qr "$ZIP" .)
echo "==> Uploading $(du -h "$ZIP" | cut -f1) bundle"
DEP="$("${AWS[@]}" amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --query '[jobId,zipUploadUrl]' --output text)"
JOB="$(echo "$DEP" | cut -f1)"; UPLOAD_URL="$(echo "$DEP" | cut -f2)"
curl -fsS -o /dev/null -H "Content-Type: application/zip" -T "$ZIP" "$UPLOAD_URL"
"${AWS[@]}" amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB" >/dev/null

echo "==> Publishing (job $JOB)"
for _ in $(seq 1 60); do
  STATUS="$("${AWS[@]}" amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB" --query job.summary.status --output text)"
  case "$STATUS" in
    SUCCEED) break ;;
    FAILED|CANCELLED) echo "Deployment $STATUS"; exit 1 ;;
  esac
  sleep 5
done
[ "$STATUS" = "SUCCEED" ] || { echo "Timed out waiting for deployment (last status: $STATUS)"; exit 1; }

DOMAIN="$("${AWS[@]}" amplify get-app --app-id "$APP_ID" --query app.defaultDomain --output text)"
echo
echo "Live at: https://$BRANCH.$DOMAIN"
echo "Pages:   https://$BRANCH.$DOMAIN/office/   https://$BRANCH.$DOMAIN/airstream/"
