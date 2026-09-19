# Airstream Production Testing Guide

Deploy to AWS and test with real devices in real-time. Live event streaming to UI.

## 🚀 Deploy to AWS (5 minutes)

### 1. Build & Deploy

```bash
cd /home/starrlord/Desktop/aws-hackathon-project

# Build SAM template (includes new Airstream handlers)
sam build

# Deploy to AWS (first time)
sam deploy --guided

# Prompts:
# Stack name: crewdesk
# Region: us-east-1 (or your region)
# Capabilities: Y (for IAM roles)
```

### 2. Save Outputs

After deploy, you'll see:
```
Outputs:
  ApiEndpoint: https://xxx.execute-api.us-east-1.amazonaws.com/dev
  WebSocketApiEndpoint: wss://xxx.execute-api.us-east-1.amazonaws.com/dev
  RoomsTableName: crewdesk-rooms
  DevicesTableName: crewdesk-devices
```

**Save these URLs** - you'll need them for testing.

---

## 📱 Real-Time Multi-Device Test

### Setup: 2+ Physical Machines

You need:
- **Master Device** (your laptop/desktop)
- **Slave Devices** (2+ other machines on same network or with internet)

All devices need:
- `curl` or `wget` (for HTTP requests)
- Network connectivity to AWS API Gateway

### Test Flow (15 minutes)

#### Step 1: Master Creates Room
```bash
# Run on MASTER device
API_URL="https://xxx.execute-api.us-east-1.amazonaws.com/dev"
PROJECT_ID="proj_demo"

curl -X POST "$API_URL/projects/$PROJECT_ID/rooms" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "master_macbook",
    "deviceName": "My MacBook Pro"
  }'

# Response:
# {
#   "roomId": "room_1696000000_abc123",
#   "masterId": "master_macbook",
#   "message": "Room created. Waiting for devices to join..."
# }

# SAVE THIS roomId - you'll need it on slave devices
ROOM_ID="room_1696000000_abc123"
```

#### Step 2: Slave Devices Join
```bash
# Run on SLAVE DEVICE 1 (e.g., another laptop)
API_URL="https://xxx.execute-api.us-east-1.amazonaws.com/dev"
ROOM_ID="room_1696000000_abc123"  # From master
PROJECT_ID="proj_demo"

curl -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/devices" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "slave_ubuntu_1",
    "deviceName": "Build Server Ubuntu"
  }'

# Response:
# {
#   "deviceId": "slave_ubuntu_1",
#   "roomId": "room_1696000000_abc123",
#   "capabilities": {
#     "platform": "linux",
#     "cpuCount": 8,
#     "memTotalGb": "15.6",
#     "memFreeGb": "12.1",
#     "benchScore": 7.8,
#     "tools": ["node", "python", "git", "docker", "go"]
#   }
# }
```

**Repeat for SLAVE DEVICE 2+** (change deviceId/deviceName)

#### Step 3: Open UI and Watch Live Events
```bash
# On ANY device with a browser:
1. Open: file:///.../kaam-chalau.html
2. Update API_BASE_URL: "https://xxx.execute-api.us-east-1.amazonaws.com/dev"
3. Update WS_BASE_URL: "wss://xxx.execute-api.us-east-1.amazonaws.com/dev"
4. Open browser console (DevTools)

# You should see:
# 🟢 Connected to live event stream
```

#### Step 4: Simulate Device Heartbeats (Continuous Loop)

Run this on each slave device in a loop (or as a cron job):

```bash
#!/bin/bash
# heartbeat.sh - Run every 5-10 seconds

API_URL="https://xxx.execute-api.us-east-1.amazonaws.com/dev"
ROOM_ID="room_1696000000_abc123"
PROJECT_ID="proj_demo"
DEVICE_ID="slave_ubuntu_1"

while true; do
  curl -s -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/devices/$DEVICE_ID/heartbeat" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "ok",
      "metrics": {
        "cpuUsage": '$((RANDOM % 80))',
        "memUsage": '$((RANDOM % 20 + 5))',
        "activeTaskCount": 0
      }
    }' > /dev/null
  
  echo "❤️ Heartbeat sent at $(date)"
  sleep 8
done
```

Save as `heartbeat.sh`, run: `bash heartbeat.sh`

**In UI, you'll see:**
```
🟢 Device online: Build Server Ubuntu (slave_ubuntu_1)
📊 Status: executing | Devices: 2/2 | Tasks: 0/0
```

#### Step 5: Distribute Tasks (Master)

```bash
curl -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/distribute" \
  -H "Content-Type: application/json"

# Response:
# {
#   "tasksDistributed": 0,
#   "tasksFailed": 0
# }

# (No tasks yet, but distributer is working!)
```

**In UI, you'll see:**
```
🎯 Distributed 0 tasks (0 unassigned)
```

#### Step 6: Test Offline Detection

Stop heartbeat on a slave device:

```bash
# Ctrl+C the heartbeat.sh loop
```

Wait 35 seconds. In UI, you'll see:
```
🔴 Device offline: Build Server Ubuntu (slave_ubuntu_1)
```

Restart heartbeat:

```bash
bash heartbeat.sh
```

In UI, you'll see:
```
🟢 Device online: Build Server Ubuntu (slave_ubuntu_1)
```

#### Step 7: Get Room Status

```bash
curl -X GET "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID"

# Response:
# {
#   "roomId": "room_...",
#   "status": "executing",
#   "deviceStats": {
#     "total": 2,
#     "online": 2,
#     "offline": 0,
#     "devices": [...]
#   },
#   "taskStats": {
#     "ready": 0,
#     "leased": 0,
#     "committed": 0,
#     "failed": 0,
#     "total": 0,
#     "progress": "0.0"
#   }
# }
```

---

## 🔴 Live Event Examples

### Device Events
```
✅ Device joined: Build Server Ubuntu (slave_ubuntu_1) → node, python, git, docker, go
🟢 Device online: Build Server Ubuntu (slave_ubuntu_1)
🔴 Device offline: Build Server Ubuntu (slave_ubuntu_1)
```

### Task Events
```
📋 Task: "Implement login endpoint" → Build Server (fit: 0.92)
📋 Task: "Setup database schema" → Ubuntu Box (fit: 0.88)
🎯 Distributed 5 tasks (0 unassigned)
✨ Task done: "Implement login endpoint" on slave_ubuntu_1
🔄 Task reassigned: "Implement login..." slave_ubuntu_1 → slave_macos_1
```

### Code & Demo Events
```
📦 Collecting code from 2 devices (5 completed tasks)...
📂 Code integrated: 42 files merged on master
🚀 Demo starting (nodejs)...
✅ Demo complete (nodejs) in 45234ms [exit: 0]
```

### Status Updates
```
📊 Status: executing | Devices: 2/2 | Tasks: 5/10
📊 Status: demo_executed | Devices: 2/2 | Tasks: 10/10
```

---

## 🧪 Full Integration Test (30 minutes)

For a complete test with actual task execution:

### 1. Submit Prompt (Creates Tasks)

```bash
# This would be from the UI, but for testing:
curl -X POST "$API_URL/projects/$PROJECT_ID/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_demo",
    "objective": "Build a simple REST API",
    "contract": "M",
    "budget": { "usd": 10 }
  }'

# Tasks are created in DB automatically
```

### 2. Devices Claim Tasks

On slave devices, periodically check for available tasks:

```bash
#!/bin/bash
# claim-tasks.sh

API_URL="https://xxx.execute-api.us-east-1.amazonaws.com/dev"
PROJECT_ID="proj_demo"
DEVICE_ID="slave_ubuntu_1"

while true; do
  # Get available tasks
  TASKS=$(curl -s -X GET "$API_URL/projects/$PROJECT_ID/tasks" | jq '.tasks[] | select(.state=="ready")')
  
  if [ ! -z "$TASKS" ]; then
    # Claim first available task
    TASK_ID=$(echo "$TASKS" | head -1 | jq -r '.taskId')
    echo "📋 Claiming task: $TASK_ID"
    
    curl -X POST "$API_URL/tasks/$TASK_ID/claim" \
      -H "Content-Type: application/json" \
      -d "{\"deviceId\":\"$DEVICE_ID\"}"
  fi
  
  sleep 5
done
```

### 3. Distribute & Watch Real-Time

```bash
# Every 10 seconds, distribute
curl -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/distribute"

# UI shows live:
# 📋 Task assigned to each device
# 📊 Progress bar updating
```

### 4. Collect & Execute Demo

```bash
# Collect all completed work
curl -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/collect"

# Execute demo
curl -X POST "$API_URL/projects/$PROJECT_ID/rooms/$ROOM_ID/demo"

# UI shows:
# 📦 Collecting code...
# 📂 42 files integrated
# 🚀 Demo starting
# ✅ Demo complete
```

---

## 📊 Monitoring

### CloudWatch Logs (Real-Time)

```bash
# Watch all Airstream handlers
aws logs tail /aws/lambda/crewdesk-device-join --follow
aws logs tail /aws/lambda/crewdesk-task-distribute --follow
aws logs tail /aws/lambda/crewdesk-device-heartbeat --follow
aws logs tail /aws/lambda/crewdesk-code-collect --follow
aws logs tail /aws/lambda/crewdesk-demo-execute --follow
```

### DynamoDB Data

```bash
# Check devices in room
aws dynamodb query --table-name crewdesk-devices \
  --index-name RoomIndex \
  --key-condition-expression "roomId = :roomId" \
  --expression-attribute-values "{\":roomId\":{\"S\":\"room_1696000000_abc123\"}}"

# Check room status
aws dynamodb get-item --table-name crewdesk-rooms \
  --key "{\"roomId\":{\"S\":\"room_1696000000_abc123\"}}"

# Check tasks
aws dynamodb query --table-name crewdesk-tasks \
  --key-condition-expression "projectId = :pid" \
  --expression-attribute-values "{\":pid\":{\"S\":\"proj_demo\"}}"
```

### WebSocket Connections

```bash
# Check live connections
aws dynamodb scan --table-name crewdesk-connections | jq '.Items | length'
```

---

## 🐛 Troubleshooting

**Device join fails:**
```bash
aws logs tail /aws/lambda/crewdesk-device-join --follow
# Check: Device capability detection (may fail if tools detection has issues)
```

**Heartbeat not updating:**
```bash
# Check device in DB:
aws dynamodb get-item --table-name crewdesk-devices \
  --key "{\"deviceId\":{\"S\":\"slave_ubuntu_1\"}}"
# Look at: lastHeartbeat, status
```

**Live events not appearing in UI:**
```bash
# Check WebSocket connection in browser console
# Check if WebSocket URL is correct
# Verify projectId matches
```

**Demo execution fails:**
```bash
aws logs tail /aws/lambda/crewdesk-demo-execute --follow
# Common: Project type not detected, no launch command found
```

---

## 💡 Tips

- **Use `tmux` or `screen`** on each device to run heartbeat loop continuously
- **Create a simple shell script** to automate device setup
- **Watch CloudWatch logs in parallel** with UI for debugging
- **Test offline detection** by killing heartbeat process, not network (easier to control)
- **Use `jq`** to parse JSON responses: `curl ... | jq .`

---

## Ready to Test?

1. **Deploy:** `sam deploy --guided`
2. **Update URLs** in `kaam-chalau.html`
3. **Open UI** in browser
4. **Start master** device
5. **Join slave** devices (use real machines!)
6. **Watch live events** appear in real-time
7. **Test offline** scenarios
8. **Collect code** & execute demo

That's it! Real-time distributed device orchestration live in AWS. 🚀
