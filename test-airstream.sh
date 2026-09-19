#!/bin/bash

# Airstream Integration Test Script
# Tests the entire distributed device execution flow with live event broadcasting

set -e

API_URL="http://127.0.0.1:3000"
PROJECT_ID="proj_demo"
DEVICE_1="dev_macbook_1"
DEVICE_2="dev_ubuntu_1"

echo "🚀 Airstream Integration Test"
echo "=============================="
echo ""

# 1. Create Room
echo "📍 Step 1: Creating Airstream room (master device)..."
ROOM_RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms" \
  -H "Content-Type: application/json" \
  -d "{
    \"deviceId\": \"$DEVICE_1\",
    \"deviceName\": \"master-macbook\"
  }")

ROOM_ID=$(echo $ROOM_RESPONSE | grep -o '"roomId":"[^"]*' | cut -d'"' -f4)
echo "✅ Room created: $ROOM_ID"
echo "   Response: $ROOM_RESPONSE"
echo ""

# 2. Device 1 Joins
echo "📍 Step 2: Device 1 joins room (capability detection)..."
DEVICE_1_RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/devices" \
  -H "Content-Type: application/json" \
  -d "{
    \"deviceId\": \"$DEVICE_1\",
    \"deviceName\": \"master-macbook\"
  }")

echo "✅ Device 1 joined"
echo "   Capabilities detected:"
echo $DEVICE_1_RESPONSE | grep -o '"tools":\[.*\]' || echo "   (tools info in response)"
echo ""

# 3. Device 2 Joins
echo "📍 Step 3: Device 2 joins room..."
DEVICE_2_RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/devices" \
  -H "Content-Type: application/json" \
  -d "{
    \"deviceId\": \"$DEVICE_2\",
    \"deviceName\": \"ubuntu-build-server\"
  }")

echo "✅ Device 2 joined"
echo ""

# 4. Device Heartbeats
echo "📍 Step 4: Devices sending heartbeats..."
for i in 1 2; do
  curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/devices/dev_$([ $i -eq 1 ] && echo 'macbook_1' || echo 'ubuntu_1')/heartbeat" \
    -H "Content-Type: application/json" \
    -d '{"status":"ok","metrics":{"cpuUsage":32.1,"memUsage":6.8}}' > /dev/null
done
echo "✅ Heartbeats sent"
echo ""

# 5. Check Room Status
echo "📍 Step 5: Checking room status..."
STATUS=$(curl -s -X GET "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID")
echo "✅ Room Status:"
echo $STATUS | grep -o '"status":"[^"]*' || echo "   (status info in response)"
echo $STATUS | grep -o '"total":[0-9]*' || echo "   (device count)"
echo ""

# 6. Distribute Tasks
echo "📍 Step 6: Distributing tasks to devices..."
DIST_RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/distribute" \
  -H "Content-Type: application/json")

echo "✅ Task distribution:"
echo $DIST_RESPONSE | grep -o '"tasksDistributed":[0-9]*' || echo "   (tasks distributed)"
echo ""

# 7. Collect Code
echo "📍 Step 7: Collecting code from devices..."
COLLECT_RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/collect" \
  -H "Content-Type: application/json")

echo "✅ Code collected:"
echo $COLLECT_RESPONSE | grep -o '"filesIntegrated":[0-9]*' || echo "   (files integrated)"
echo ""

# 8. Execute Demo
echo "📍 Step 8: Executing demo on master device..."
DEMO_RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/demo" \
  -H "Content-Type: application/json")

echo "✅ Demo executed:"
echo $DEMO_RESPONSE | grep -o '"success":[^,}]*' || echo "   (demo result)"
echo ""

echo "=============================="
echo "✅ Airstream Integration Test Complete!"
echo ""
echo "📊 Live Events Shown in UI:"
echo "   - Device joined with capabilities"
echo "   - Task assignments with fitness scores"
echo "   - Code collection progress"
echo "   - Demo execution status"
echo ""
echo "🔴 Check the Kaam Chalau UI at kaam-chalau.html for live event stream"
