# Airstream: Distributed Device Execution

Airstream is a **master-slave distributed development system** that allows multiple devices to collaborate on building a project in parallel. The master device orchestrates task distribution based on device capabilities, collects results, integrates code, and runs a live demo.

## Architecture

```
┌─────────────────┐
│ Master Device   │ ← Takes user prompt, distributes tasks
│  (Creator)      │   Integrates code, runs demo
└────────┬────────┘
         │
    ┌────┴─────┬──────────┐
    │           │          │
┌───▼──┐   ┌───▼──┐  ┌───▼──┐
│Slave │   │Slave │  │Slave │
│Dev 1 │   │Dev 2 │  │Dev 3 │
└──────┘   └──────┘  └──────┘

Tasks assigned based on:
- Available CPU cores
- Free memory
- Installed tools (node, python, git, etc)
- Benchmark score
```

## API Endpoints

### 1. Create Room (Master Device)
```bash
POST /projects/{projectId}/rooms

Body:
{
  "deviceId": "master_device_id",
  "deviceName": "master-macbook"
}

Response:
{
  "roomId": "room_1696000000_abc123",
  "masterId": "master_device_id",
  "message": "Room created. Waiting for devices to join..."
}
```

### 2. Device Joins Room (Slave Devices)
```bash
POST /projects/{projectId}/rooms/{roomId}/devices

Body:
{
  "deviceId": "slave_device_1",
  "deviceName": "build-server-1"
}

Response:
{
  "deviceId": "slave_device_1",
  "roomId": "room_...",
  "capabilities": {
    "platform": "linux",
    "arch": "x86_64",
    "cpuCount": 8,
    "cpuModel": "Intel(R) Core(TM) i7-9700K",
    "memTotalGb": "15.6",
    "memFreeGb": "8.2",
    "memUsedPercent": "47.4",
    "benchScore": 7.3,
    "tools": ["node", "python", "git", "docker"],
    "nodeVersion": "v22.0.0"
  }
}
```

### 3. Device Heartbeat (Continuous - every 5-10 seconds)
```bash
POST /projects/{projectId}/rooms/{roomId}/devices/{deviceId}/heartbeat

Body:
{
  "status": "ok",
  "metrics": {
    "cpuUsage": 45.2,
    "memUsage": 6.5,
    "activeTaskCount": 2
  }
}

Response:
{
  "deviceId": "slave_device_1",
  "timestamp": 1696000000000,
  "onlineDeviceCount": 4,
  "offlineDeviceCount": 0,
  "tasksRedistributed": false
}
```

**Offline Detection**: If a device doesn't send heartbeat for **30 seconds**, it's marked offline and its tasks are redistributed.

### 4. Distribute Tasks (Master Device)
```bash
POST /projects/{projectId}/rooms/{roomId}/distribute

Response:
{
  "roomId": "room_...",
  "tasksDistributed": 5,
  "tasksFailed": 1,
  "timestamp": 1696000000000
}
```

Task assignment uses a **greedy bin-packing algorithm**:
- Calculates fitness score for each device (0-1)
- Considers: CPU cores, available memory, required tools, benchmark score
- Assigns to best-fit device with score > 0.3
- Penalty if critical tools are missing

### 5. Collect Code (Master Device)
```bash
POST /projects/{projectId}/rooms/{roomId}/collect

Response:
{
  "roomId": "room_...",
  "masterDir": "/tmp/crewdesk_room_xyz_timestamp",
  "filesIntegrated": 42,
  "taskCount": 5,
  "verifyStatus": "passed",
  "message": "Code collected and integrated on master device"
}
```

This:
1. Fetches artifacts from all completed tasks
2. Merges files into master's working directory
3. Runs build verification
4. Prepares for demo execution

### 6. Execute Demo (Master Device)
```bash
POST /projects/{projectId}/rooms/{roomId}/demo

Response:
{
  "roomId": "room_...",
  "projectType": "nodejs",
  "command": "npm run dev",
  "exitCode": 0,
  "runtime": 45000,
  "success": true,
  "outputLength": 12456
}
```

Auto-detects project type and launch command:
- **Node.js**: `npm run dev` or `npm start`
- **Go**: `go run .`
- **Rust**: `cargo run --release`
- **Python**: `python3 main.py`
- **Docker**: `docker-compose up`

Runs for max **2 minutes**, then terminates automatically.

### 7. Room Status (Any Device)
```bash
GET /projects/{projectId}/rooms/{roomId}

Response:
{
  "roomId": "room_...",
  "projectId": "proj_demo",
  "status": "executing",
  "masterDevice": {
    "deviceId": "master_id",
    "name": "master-macbook"
  },
  "deviceStats": {
    "total": 4,
    "online": 3,
    "offline": 1,
    "devices": [
      {
        "deviceId": "dev_1",
        "name": "build-1",
        "status": "online",
        "isMaster": false,
        "capabilities": {...},
        "lastHeartbeat": 1696000000000
      }
    ]
  },
  "taskStats": {
    "ready": 2,
    "leased": 3,
    "committed": 5,
    "failed": 0,
    "total": 10,
    "progress": "50.0"
  },
  "leaseDistribution": {
    "dev_1": 2,
    "dev_2": 1
  },
  "demoStatus": {
    "projectType": "nodejs",
    "command": "npm run dev",
    "exitCode": 0,
    "success": true,
    "runtime": 45000
  }
}
```

## Usage Flow

### Master Device Setup
```bash
# 1. Create a room
curl -X POST http://localhost:3000/projects/proj_demo/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "master_m1_pro",
    "deviceName": "my-macbook"
  }'

# Response: roomId = room_1696000000_abc123
```

### Slave Devices Join
```bash
# Run this on each slave device
curl -X POST http://localhost:3000/projects/proj_demo/rooms/room_1696000000_abc123/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "build_server_1",
    "deviceName": "linux-build-box"
  }'
```

### Heartbeat Loop (Continuous)
```bash
# Each slave device sends heartbeat every 5-10 seconds
# (Master can also implement this for itself)
curl -X POST http://localhost:3000/projects/proj_demo/rooms/room_.../devices/build_server_1/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ok",
    "metrics": {
      "cpuUsage": 32.1,
      "memUsage": 6.8
    }
  }'
```

### Orchestration (Master Device)
```bash
# 1. User submits prompt (creates tasks)
# 2. Distribute tasks to devices
curl -X POST http://localhost:3000/projects/proj_demo/rooms/room_.../distribute

# 3. Wait for tasks to complete (check status)
curl -X GET http://localhost:3000/projects/proj_demo/rooms/room_...

# 4. Collect code from all devices
curl -X POST http://localhost:3000/projects/proj_demo/rooms/room_.../collect

# 5. Execute demo on master
curl -X POST http://localhost:3000/projects/proj_demo/rooms/room_.../demo
```

## Offline Device Handling

When a device goes offline:

1. **Detection**: Master detects no heartbeat for **30 seconds**
2. **Threshold Timer**: Device stays in "offline" state
3. **Redistribution Trigger**: If device still offline after threshold, all its leased tasks are:
   - Reset to `ready` state
   - Assigned to next available device
   - Lease epoch incremented (tracks reassignments)
4. **Recovery**: If device comes back online, it can claim new tasks

Example flow:
```
t=0s   : Device D1 leases task T1
t=15s  : D1 heartbeat ✓
t=30s  : D1 offline (no heartbeat for 30s)
t=35s  : D1 still offline → T1 reset to ready
t=40s  : Master redistributes T1 to device D2
t=45s  : D1 comes back online, gets assigned new tasks
```

## Capability Scoring

Each device gets a fitness score for each task (0-1):

```
score = 0.15×cpuScore + 0.15×memScore + 0.5×toolScore + 0.2×benchScore

cpuScore   = min(1, deviceCpuCores / taskRequiredCores)
memScore   = min(1, deviceFreeMem / taskRequiredMem)
toolScore  = (toolsAvailable / toolsRequired)
benchScore = deviceBenchScore / 10

Penalty: If missing critical tools, score *= 0.5

Assignment: If score >= 0.3, device can take task
            Best-fit device wins assignment
```

## Integration & Code Merging

The code collection phase:

1. **Fetch**: Pulls artifacts from each slave device
2. **Merge**: Writes files to master's working directory
3. **Conflict Resolution**: Last-write-wins for conflicting files
4. **Verify**: Runs build script if found
5. **Ready**: Master can now run demo or ship code

## Notes

- **Real-time Monitoring**: Check room status endpoint for live progress
- **Task Retry**: Failed tasks can be retried with incremented epoch
- **Scalability**: Works with 1-N devices (scales linearly)
- **Network Resilient**: Heartbeat system handles intermittent network
- **Cost Efficient**: Distributes work across available hardware

## Development & Testing

```bash
# Local testing with sam local
sam local start-api

# Test device join with capability detection
curl -X POST http://127.0.0.1:3000/projects/proj_demo/rooms/room_xyz/devices \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test_dev","deviceName":"test-machine"}'

# Watch device capabilities get detected automatically
```
