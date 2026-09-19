# Frontend-Backend Integration Guide

For UI team building production UI for Kaam Chalau.

---

## 🎯 Overview

The frontend is a **real-time WebSocket client** that orchestrates distributed device execution on AWS Lambda.

### Key Flows

1. **Master Device** → Creates a room → Gets room ID
2. **Slave Devices** → Join room with ID → Get capabilities detected
3. **Real-time streaming** → All events via WebSocket to all connected clients
4. **Task execution** → Backend handles, UI displays progress

---

## 🔌 WebSocket Integration

### Connect
```javascript
const projectId = 'proj_demo';
const ws = new WebSocket(`${WS_BASE_URL}?projectId=${projectId}`);

ws.onopen = () => {
  console.log('✅ Connected to live stream');
};
```

### Listen for Events
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'device.joined':
      // Device connected with capabilities
      console.log(data.message); // "✅ Device joined: Ubuntu Build (slave1) → node, python, docker"
      break;
    
    case 'device.online':
      // Heartbeat received
      updateDeviceStatus(data.message);
      break;
    
    case 'device.offline':
      // Device stopped sending heartbeats (30s timeout)
      markDeviceOffline(data.message);
      break;
    
    case 'task.assigned':
      // Task distributed to device
      updateTaskStatus(data.message);
      break;
    
    case 'demo.completed':
      // Demo execution finished
      showDemoResults(data.message);
      break;
    
    case 'code.collected':
      // Code merged from devices
      showCodeStatus(data.message);
      break;
  }
};
```

---

## 🎮 Room Management

### Create Room (Master)
```javascript
async function createRoom() {
  const response = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'master_' + Date.now(),
        deviceName: 'My Laptop'
      })
    }
  );
  
  const data = await response.json();
  const roomId = data.roomId;
  
  // Share this room ID with slaves
  console.log(`Share this room ID: ${roomId}`);
  
  return roomId;
}
```

### Join Room (Slave)
```javascript
async function joinRoom(roomId) {
  const response = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}/devices`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'slave_' + Date.now(),
        deviceName: 'Build Server'
      })
    }
  );
  
  const data = await response.json();
  
  return {
    deviceId: data.deviceId,
    capabilities: data.capabilities
  };
}
```

### Display Capabilities
```javascript
function displayCapabilities(capabilities) {
  return `
    Platform: ${capabilities.platform}
    CPU: ${capabilities.cpuCount} cores
    RAM: ${capabilities.memTotalGb} GB
    Available Tools: ${capabilities.tools.join(', ')}
    Benchmark Score: ${capabilities.benchScore}
  `;
}
```

---

## 💓 Heartbeat Loop (Slave Devices)

Auto-start when device joins:

```javascript
let heartbeatInterval;

function startHeartbeat(roomId, deviceId) {
  heartbeatInterval = setInterval(async () => {
    try {
      await fetch(
        `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}/devices/${deviceId}/heartbeat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ok',
            metrics: {
              cpuUsage: getCPUUsage(), // Your metric collection
              memUsage: getMemUsage(),
              activeTaskCount: 0
            }
          })
        }
      );
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, 8000); // Every 8 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}
```

---

## 📊 Room Status Dashboard

Fetch current state:

```javascript
async function getRoomStatus(roomId) {
  const response = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}`
  );
  
  const data = await response.json();
  
  return {
    // Device Stats
    totalDevices: data.deviceStats.total,
    onlineDevices: data.deviceStats.online,
    offlineDevices: data.deviceStats.offline,
    devicesList: data.deviceStats.devices, // Array of device objects
    
    // Task Stats
    readyTasks: data.taskStats.ready,
    leasedTasks: data.taskStats.leased,
    committedTasks: data.taskStats.committed,
    failedTasks: data.taskStats.failed,
    totalTasks: data.taskStats.total,
    progress: parseFloat(data.taskStats.progress), // 0-100%
    
    // Room Status
    roomStatus: data.status, // 'executing', 'demo_executed', etc.
    
    // Leases
    leases: data.leaseDistribution // Who has what task
  };
}
```

---

## 🎯 Task Distribution

Manual trigger (for testing):

```javascript
async function distributeTasks(roomId) {
  const response = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}/distribute`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  const data = await response.json();
  
  console.log(`
    Tasks distributed: ${data.tasksDistributed}
    Failed: ${data.tasksFailed}
  `);
}
```

---

## 📦 Code Collection

Merge code from all devices:

```javascript
async function collectCode(roomId) {
  const response = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}/collect`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  const data = await response.json();
  
  console.log(`
    Directory: ${data.masterDir}
    Files collected: ${data.filesCollected}
    Devices processed: ${data.devicesProcessed}
  `);
}
```

---

## 🚀 Demo Execution

Run the collected code:

```javascript
async function executeDemoWithPolling(roomId) {
  // Start demo
  const startResponse = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}/demo`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  const startData = await startResponse.json();
  
  // Poll for status
  const pollDemoStatus = async () => {
    const statusResponse = await fetch(
      `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}`
    );
    
    const roomData = await statusResponse.json();
    
    if (roomData.status === 'demo_executed') {
      console.log('✅ Demo complete!');
      console.log('Output:', startData.output);
      console.log('Exit code:', startData.exitCode);
      return;
    }
    
    // Still running, poll again
    setTimeout(pollDemoStatus, 2000);
  };
  
  pollDemoStatus();
}
```

---

## 🎨 Building UI Components

### Device List Component
```javascript
function renderDevices(devices) {
  return devices.map(device => `
    <div class="device-card">
      <h3>${device.deviceName}</h3>
      <p>Status: ${device.status === 'offline' ? '🔴' : '🟢'} ${device.status}</p>
      <p>CPU: ${device.metrics?.cpuUsage.toFixed(1)}%</p>
      <p>Memory: ${device.metrics?.memUsage.toFixed(1)}%</p>
      <p>Tools: ${device.capabilities?.tools.join(', ')}</p>
    </div>
  `).join('');
}
```

### Task Progress Component
```javascript
function renderProgress(roomStatus) {
  const completed = roomStatus.committedTasks;
  const total = roomStatus.totalTasks;
  const progress = roomStatus.progress;
  
  return `
    <div class="progress-container">
      <div class="progress-bar" style="width: ${progress}%"></div>
      <span>${completed}/${total} tasks completed (${progress.toFixed(1)}%)</span>
    </div>
  `;
}
```

### Live Event Feed Component
```javascript
function renderEventFeed(events) {
  return events.map(event => `
    <div class="event-item ${event.category}">
      <span class="event-time">${event.timestamp}</span>
      <span class="event-message">${event.message}</span>
    </div>
  `).join('');
}
```

---

## 🔒 Error Handling

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('API call failed:', error);
    
    // Show user-friendly error
    if (error instanceof TypeError) {
      console.error('Network error - backend unreachable');
    } else {
      console.error('API error:', error.message);
    }
    
    throw error;
  }
}
```

---

## 📱 Responsive Design Considerations

- **Mobile**: Stack devices/tasks vertically
- **Tablet**: 2-column layout (devices + tasks)
- **Desktop**: 3-column layout (devices + tasks + events)
- **Real-time updates**: Use WebSocket to avoid poll-based UI jank

---

## 🚦 State Management Pattern

```javascript
const STATE = {
  roomId: null,
  deviceId: null,
  devices: [],
  tasks: [],
  events: [],
  isConnected: false,
  roomStatus: null
};

function updateState(updates) {
  Object.assign(STATE, updates);
  renderUI(); // Re-render with new state
}

// Subscribe to WebSocket events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Update state based on event
  if (data.type === 'device.joined') {
    updateState({
      devices: [...STATE.devices, parseDeviceFromEvent(data)]
    });
  }
  
  // ... handle other events
};
```

---

## 📊 Polling Pattern (for components that need periodic updates)

```javascript
function startStatusPolling(roomId, intervalMs = 2000) {
  const poll = async () => {
    try {
      const status = await getRoomStatus(roomId);
      updateState({ roomStatus: status });
    } catch (error) {
      console.error('Poll failed:', error);
    }
    
    setTimeout(poll, intervalMs);
  };
  
  poll();
}
```

---

## 🎯 Next Steps

1. **Fork the UI** from `index.html` minimal version
2. **Integrate with your design system** (replace HTML with React/Vue/etc.)
3. **Keep the API calls** - don't change them
4. **Use WebSocket events** for real-time updates
5. **Test with real devices** before production

---

## 💡 Pro Tips

- **Use URL hash for room sharing**: `#room=room_123` 
- **Persist room ID in localStorage** for quick rejoin
- **Debounce WebSocket updates** to avoid UI thrashing
- **Show connection status** visually (green/red indicator)
- **Log all events** for debugging

---

**Questions? Check AIRSTREAM.md for complete API reference.**
