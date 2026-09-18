# CrewDesk Backend - Quick Start

**Status:** ✅ Foundation complete. Ready for integration testing.

## What's Built

```
services/api/
├── handlers/
│   ├── tasks/
│   │   ├── claim.mjs          ← Device claims task (lease protocol)
│   │   ├── submit.mjs         ← Device submits result (fencing check)
│   │   └── claim.test.mjs     ← Unit tests
│   ├── agents/
│   │   └── lead.mjs           ← Outcome → task contracts
│   └── events/
│       └── sweep.mjs          ← Auto-reassign expired leases
├── lib/
│   ├── dynamodb.mjs           ← DynamoDB client
│   ├── bedrock.mjs            ← Bedrock agent wrapper
│   └── broadcast.mjs          ← WebSocket events
├── schema.mjs                 ← DynamoDB table definitions
├── package.json               ← Dependencies
├── README.md                  ← Setup guide
└── local-setup.sh             ← LocalStack + tables

docs/
├── BACKEND_ARCHITECTURE.md    ← Full design doc
└── [FRONTEND_BACKEND_SYNC.md] ← Integration guide (TODO: from your docs)

template.yaml                  ← SAM template (full AWS)
QUICK_START.md                 ← This file
```

## Friday Evening (Right Now)

### Step 1: Install Dependencies
```bash
cd services/api
npm install
```

### Step 2: Start LocalStack
```bash
./local-setup.sh
```

This:
- Starts LocalStack (Docker)
- Creates all DynamoDB tables
- Sets environment variables

### Step 3: Run Tests
```bash
npm test
```

Validates:
- ✅ Device can claim ready task
- ✅ Device cannot claim already-leased task
- ✅ Device CAN claim expired lease (reassignment)
- ✅ Stale epoch rejected on submit (fencing)
- ✅ Current epoch accepted on submit
- ✅ Sweep finds expired leases
- ✅ Sweep discards max-attempt tasks

### Step 4: Start API Locally
```bash
sam local start-api
```

Then test:
```bash
# Claim a task
curl -X POST http://localhost:3001/tasks/proj_123%23TASK%23task_456/claim \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev_aryan"}'

# Response:
# {
#   "leaseEpoch": 1,
#   "leaseExpiry": 1697654430000,
#   "message": "Task claimed successfully"
# }
```

## Critical Files to Understand

1. **claim.mjs** (30 lines)
   - Load task from DynamoDB
   - Conditional write: only succeeds if state='ready' OR leaseExpiry < now
   - Returns leaseEpoch (fencing token)
   - Prevents two devices claiming same task

2. **submit.mjs** (50 lines)
   - Load task
   - Check: leaseEpoch matches (fencing)
   - Call tester agent
   - Update task with result
   - Broadcast event

3. **sweep.mjs** (40 lines)
   - Scan leased tasks
   - Find expired leases
   - Reassign (epoch++) or fail (max attempts)
   - Broadcast events

4. **lead.mjs** (80 lines)
   - Call Claude via Bedrock
   - Parse contracts
   - Validate schema
   - Create task records
   - Return plan

## Saturday Integration

### 1. Connect Real Bedrock (Omkar)
Replace mock in `lib/bedrock.mjs`:
```javascript
// Current: returns mock result
// Replace with: real InvokeModel call to Claude
```

Implement three agents:
- **Lead:** outcome → contracts ✅ (scaffolding done)
- **Coder:** reads repo + writes code
- **Tester:** scores success criteria
- **Reviewer:** judges output

### 2. Add WebSocket (Aryan)
In `broadcast.mjs`:
```javascript
// Current: logs events
// Replace with: send to API Gateway WebSocket connections
```

Each event broadcasts to all connected browsers:
```json
{ "type": "task.claimed", "taskId": "...", "deviceId": "..." }
```

### 3. Add Checkpoints (Human Approval)
Handler: POST /checkpoints/{id}
```javascript
{ "decision": "approve" | "deny", "note": "..." }
```

Pauses workflow on risky actions (publish, deploy, spend>cap).

### 4. Test with Real Devices
```bash
# Device 1 joins
curl -X POST http://localhost:3001/devices/join \
  -d '{"deviceId":"dev_aryan","roomId":"room_123"}'

# Device 1 claims task
curl -X POST .../claim

# Device 2 joins
curl -X POST .../devices/join -d '{"deviceId":"dev_omkar",...}'

# Device 1 stalls (no submit)
# Sweep runs → reassigns to Device 2
# Device 2 completes task
```

## Current Limitations (Will Fix Saturday)

- [ ] WebSocket events not sent (only logged)
- [ ] Bedrock agents return mocks (need real prompts)
- [ ] No checkpoints/approvals yet
- [ ] No wallet spending tracking
- [ ] No Cedar policy enforcement
- [ ] No camera S3 integration

## Key Metrics (Demo Saturday)

**Must Work:**
- ✅ Lease claim (fencing proven)
- ✅ Lease submit (epoch check)
- ✅ Sweep reassignment (expired lease)
- ✅ Lead agent (outcome → contracts)
- WebSocket events (in progress)
- Checkpoints (in progress)

**Demo Script:**
1. Photo → Lead agent plans (5s)
2. Confirm plan
3. Device 1 joins, Device 2 joins
4. Tasks distribute
5. Device 1 goes offline
6. Device 2 takes over (task reassigned)
7. Device 2 finishes
8. Tester scores criteria
9. Show verification results
10. Checkpoint: "Publish?" → approve

**Timeline:**
- Fri 23:00: Handlers working locally ✅
- Sat 10:00: Real Bedrock agents
- Sat 14:00: WebSocket + integration
- Sat 18:00: Full demo ready
- Sat 22:00: Recorded video
- Sun 15:00: Submit

## Troubleshooting

**LocalStack won't start:**
```bash
docker ps  # Check if running
docker logs localstack  # See errors
docker rm -f localstack && ./local-setup.sh  # Restart
```

**DynamoDB table already exists:**
```bash
# That's OK! Tables are idempotent. Script won't recreate.
```

**Handler errors:**
```bash
# Check environment variables
echo $DYNAMODB_ENDPOINT
echo $TASKS_TABLE

# SAM logs
sam local start-api --debug
```

## File Locations

- **Handlers:** `services/api/handlers/`
- **Tests:** `services/api/handlers/tasks/claim.test.mjs`
- **Schema:** `services/api/schema.mjs`
- **Docs:** `docs/BACKEND_ARCHITECTURE.md`
- **Setup:** `services/api/local-setup.sh`
- **Config:** `template.yaml`

---

## Next Actions

**Aryan:**
1. `cd services/api && npm install`
2. `./local-setup.sh`
3. `npm test` (verify lease protocol)
4. `sam local start-api` (start API)
5. Test /claim endpoint with curl

**Omkar:**
1. Read `docs/BACKEND_ARCHITECTURE.md`
2. Review `handlers/agents/lead.mjs`
3. Create Bedrock agent prompts for lead, coder, tester
4. Replace mock in `lib/bedrock.mjs` with real calls

**Frontend (Saransh + Kumar):**
- Continue building against mock API
- No changes needed for backend swap
- Tomorrow: swap endpoints to real Lambda

---

**All set.** The foundation is solid. The lease protocol works. Now integrate and ship. 🚀

Questions? Check `docs/BACKEND_ARCHITECTURE.md` or `services/api/README.md`.
