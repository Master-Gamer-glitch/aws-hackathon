# Kaam Chalau Frontend

Production-ready frontend for Airstream distributed device orchestration.

---

## 📁 Structure

```
frontend/
├── index.html           # Entry point (minimal UI - replace with your production UI)
├── config.js            # API endpoints configuration
├── styles/              # Add your stylesheets here
├── js/                  # Add your JavaScript here
└── assets/              # Images, fonts, etc.
```

---

## 🚀 Quick Start (UI Team)

### 1. Replace/Upgrade UI
- Keep `index.html` or replace with your production UI
- Update `config.js` with your design system
- Add your styles in `styles/` folder
- Add your scripts in `js/` folder

### 2. Use the API Endpoints
All endpoints are in `config.js`:

```javascript
const API_BASE_URL = 'https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod';
const WS_BASE_URL = 'wss://34gffaaf1a.execute-api.us-west-2.amazonaws.com/dev';
```

### 3. Deploy Frontend
```bash
./deploy-frontend.sh
```

This will:
- Create S3 bucket
- Upload all files
- Make bucket public
- Print live URL

---

## 🔗 API Integration Guide

### WebSocket (Real-Time Events)

```javascript
const ws = new WebSocket(`${WS_BASE_URL}?projectId=${projectId}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.message); // e.g., "device.joined", "✅ Device joined..."
};
```

**Event Types:**
- `device.joined` - Device connected to room
- `device.online` - Device heartbeat received
- `device.offline` - Device missed 30s heartbeat
- `task.assigned` - Task distributed to device
- `demo.completed` - Demo execution finished
- `code.collected` - Code merged from devices

### REST Endpoints

#### Create Room (Master Device)
```bash
POST /projects/{projectId}/rooms
{
  "deviceId": "master_123",
  "deviceName": "My Laptop"
}
→ { "roomId": "room_...", "masterId": "master_123" }
```

#### Join Room (Slave Device)
```bash
POST /projects/{projectId}/rooms/{roomId}/devices
{
  "deviceId": "slave_456",
  "deviceName": "Build Server"
}
→ { 
  "deviceId": "slave_456",
  "capabilities": {
    "platform": "linux",
    "cpuCount": 8,
    "memTotalGb": "15.6",
    "tools": ["node", "python", "docker", "go", "rust"]
  }
}
```

#### Device Heartbeat
```bash
POST /projects/{projectId}/rooms/{roomId}/devices/{deviceId}/heartbeat
{
  "status": "ok",
  "metrics": {
    "cpuUsage": 45,
    "memUsage": 12,
    "activeTaskCount": 2
  }
}
```

#### Get Room Status
```bash
GET /projects/{projectId}/rooms/{roomId}
→ {
  "roomId": "room_...",
  "status": "executing",
  "deviceStats": { "total": 3, "online": 3, "offline": 0 },
  "taskStats": { "ready": 5, "leased": 2, "committed": 0, "failed": 0 }
}
```

#### Distribute Tasks
```bash
POST /projects/{projectId}/rooms/{roomId}/distribute
→ { "tasksDistributed": 5, "tasksFailed": 0 }
```

#### Collect Code
```bash
POST /projects/{projectId}/rooms/{roomId}/collect
→ { "filesCollected": 42, "devicesProcessed": 3 }
```

#### Execute Demo
```bash
POST /projects/{projectId}/rooms/{roomId}/demo
→ { "status": "running", "projectType": "nodejs", "output": "..." }
```

---

## 🎨 Customization

### Change API Endpoints
Edit `config.js`:
```javascript
const API_BASE_URL = 'your-api-url';
const WS_BASE_URL = 'your-websocket-url';
```

### Add Custom Styling
Create `styles/custom.css` and import in your HTML:
```html
<link rel="stylesheet" href="styles/custom.css">
```

### Add Custom Scripts
Create `js/custom.js` and import:
```html
<script src="js/custom.js"></script>
```

---

## 📊 Example: Build a Room Status Dashboard

```javascript
async function getRoomStatus(roomId) {
  const response = await fetch(
    `${API_BASE_URL}/projects/proj_demo/rooms/${roomId}`
  );
  const data = await response.json();
  
  return {
    onlineDevices: data.deviceStats.online,
    totalDevices: data.deviceStats.total,
    taskProgress: `${data.taskStats.committed}/${data.taskStats.total}`,
    status: data.status
  };
}
```

---

## 🚢 Deployment

### Local Testing
```bash
# Option 1: Simple HTTP server
python3 -m http.server 8000
# Open: http://localhost:8000

# Option 2: Open in browser directly
file:///path/to/frontend/index.html
```

### Production (AWS S3)
```bash
./deploy-frontend.sh
```

### Alternative: Netlify (Fastest)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir .
```

---

## 🔒 Security

- All API calls use HTTPS (wss:// for WebSocket)
- CORS enabled for frontend domain
- No sensitive data in frontend code
- API keys managed server-side

---

## 📝 Notes for UI Team

1. **Don't modify API endpoints** in production - contact backend team if changes needed
2. **WebSocket events are real-time** - design UI to handle async updates
3. **Room IDs are shareable** - use URL hash to pass room ID between devices
4. **Device detection is automatic** - no manual capability selection needed
5. **Heartbeat is automatic** - slave devices send heartbeat every 8 seconds

---

## 🐛 Troubleshooting

**WebSocket not connecting?**
- Check browser console for errors
- Verify `WS_BASE_URL` is correct
- Check projectId in URL

**API calls returning 403?**
- Verify CORS headers are sent
- Check Content-Type is `application/json`
- Verify projectId and roomId format

**Room creation fails?**
- Check CloudWatch logs: `aws logs tail /aws/lambda/crewdesk-room-create --follow`
- Verify device IDs are unique

---

## 📞 Backend Team Contact
All API documentation: `AIRSTREAM.md`
Full testing guide: `AIRSTREAM_PROD_TEST.md`

---

**Ready to build production UI? Start with `index.html` and customize! 🚀**
