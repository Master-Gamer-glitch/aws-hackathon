# Saturday Roadmap - From Foundation to Demo

**Timeline: 8am → 11pm (15 hours to shipped demo)**

---

## Current Status (Friday Evening)

✅ **Backend foundation complete:**
- Lease claim/submit/sweep handlers (tested, atomic, fencing proven)
- Lead agent scaffold (ready for real Claude prompts)
- DynamoDB schema (all 7 tables)
- Unit tests: 7/7 passing

✅ **Code committed to git:**
- 3 commits, all handlers ready
- 583 lines of core handler logic
- npm install works, dependencies resolved

---

## Saturday Morning (8am → 12pm)

### 8:00-8:30 — Context Sync
**Both:**
- Read `QUICK_START.md` (15 min)
- Read `docs/BACKEND_ARCHITECTURE.md` (15 min)
- Skim `services/api/README.md` (10 min)

### 8:30-9:30 — Architecture Review
**Omkar + Aryan together:**
```
Why is fencing critical?
  → Device 1 claims task at epoch 1
  → Device 1 crashes
  → Sweep increments to epoch 2, reassigns to Device 2
  → Device 1 restarts, tries to submit with old epoch 1
  → REJECTED! Prevents duplicate work

Why is atomic writes critical?
  → Only one device can win the DynamoDB conditional write
  → state='ready' OR leaseExpiry < now
  → Two devices never both claim same task
```

### 9:30-10:30 — Task Assignment

**OMKAR:** Bedrock Agents (2 hrs)
```
File: services/api/lib/bedrock.mjs

Current: Mocked (returns fake results)
  const testerResult = { passed: Math.random() > 0.3, criteria: [] }

Action: Implement real invokeBedrockAgent()
  1. Lead agent: Takes outcome → splits into 4-8 contracts
  2. Coder agent: Reads repo → writes code
  3. Tester agent: Scores success criteria
  4. Reviewer agent: Judges output quality

Pseudocode:
  export async function invokeBedrockAgent(agent, task) {
    const prompt = buildPrompt(agent, task);
    const response = await bedrock.InvokeModel({
      model: 'anthropic.claude-opus-5-sonnet-20241022',
      prompt
    });
    return parseResponse(response);
  }
```

**ARYAN:** WebSocket Events (2 hrs)
```
File: services/api/lib/broadcast.mjs

Current: Logs to console
  console.log('[BROADCAST]', JSON.stringify(event))

Action: Wire to API Gateway WebSocket
  1. Store connections in DynamoDB (Connections table)
  2. POST to API Gateway Management API
  3. Send event to all connected clients

Pseudocode:
  export async function broadcast(event) {
    const connections = await db.scan('Connections');
    for (const conn of connections) {
      await apiGateway.postToConnection({
        ConnectionId: conn.connectionId,
        Data: JSON.stringify(event)
      });
    }
  }
```

---

## Saturday Afternoon (12pm → 6pm)

### 12:00-2:00 — Deep Implementation

**OMKAR:** Bedrock Prompts
- [ ] Lead agent prompt (outcome → contracts)
- [ ] Coder agent prompt (write production code)
- [ ] Tester agent prompt (verify criteria)
- [ ] Reviewer agent prompt (quality check)

Test: `curl POST /projects/proj_123/outcomes` → returns contracts

**ARYAN:** API Gateway WebSocket
- [ ] Create Connections DynamoDB table
- [ ] API Gateway WebSocket setup (SAM template)
- [ ] Connect handler
- [ ] Disconnect handler
- [ ] Broadcast to all connections

Test: Open browser → connect WebSocket → should receive events

### 2:00-4:00 — Integration Test

**Both:**
```bash
# 1. Create a project (outline)
curl POST /projects/proj_123/outcomes \
  -d '{"outcome":"Build login system","deadline":"2026-09-20"}'

# Expected: Returns planId + 4-8 tasks

# 2. Get all tasks
aws dynamodb scan --table-name crewdesk-tasks

# Expected: Tasks with state='ready'

# 3. Device 1 joins
curl POST /devices/dev_aryan/join \
  -d '{"roomId":"room_123"}'

# Expected: Broadcasts task.device_joined

# 4. Device 1 claims task
curl POST /tasks/task_001/claim \
  -d '{"deviceId":"dev_aryan"}'

# Expected: Returns leaseEpoch=1, leaseExpiry=(now+30s)

# 5. Device 2 joins
curl POST /devices/dev_omkar/join \
  -d '{"roomId":"room_123"}'

# 6. Device 1 stalls (no submit for 35s)

# 7. Sweep triggers (every 15s)
# Finds: leaseExpiry < now, attempts < 3
# Action: Reassign to ready pool, epoch++

# 8. Device 2 claims (now at epoch 2)
curl POST /tasks/task_001/claim \
  -d '{"deviceId":"dev_omkar"}'

# Expected: Returns leaseEpoch=2

# 9. Device 2 submits (with correct epoch)
curl POST /tasks/task_001/submit \
  -d '{
    "deviceId":"dev_omkar",
    "leaseEpoch":2,
    "manifest":{"files":["src/login.ts"],"changed":45}
  }'

# Expected: Calls tester agent, returns verification results

# 10. Verify completion
aws dynamodb get-item --table-name crewdesk-tasks \
  --key '{"projectId":{"S":"proj_123"},"sk":{"S":"TASK#task_001"}}'

# Expected: state='committed' or 'failed'
```

### 4:00-6:00 — Polish & Dry Run

- [ ] Fix any integration test failures
- [ ] Add error handling to handlers
- [ ] Test all event types broadcast correctly
- [ ] Verify tester agent scoring works
- [ ] Document any custom env vars needed

---

## Saturday Evening (6pm → 11pm)

### 6:00-7:00 — Final Integration
- Deploy Lambda handlers to AWS (or keep SAM local)
- Verify endpoints are accessible
- Test with real devices (if available)

### 7:00-9:00 — Demo Walkthrough
```
Demo Script (5-10 minutes):

1. Show task plan (outcome → contracts)
   POST /projects/{id}/outcomes
   Returns: 4-8 tasks with contracts

2. Show device registry (Airstream)
   Device 1 joins (Linux, benchmark=8.5)
   Device 2 joins (Mac, benchmark=9.2)

3. Show task distribution
   Task 1 (coder) → Device 1
   Task 2 (tester) → Device 2

4. Show lease claim
   Device 1: POST /tasks/1/claim
   Response: { leaseEpoch: 1, leaseExpiry: (now+30s) }

5. Show device failover
   Device 1 stalls (no submit)
   Show heartbeat timeout (30s)
   Sweep reassigns to Device 2
   Device 2 takes over: leaseEpoch: 2

6. Show task completion
   Device 2 submits with epoch 2
   Tester agent scores criteria
   Show ✅ passes, ❌ fails

7. Show checkpoint (if time)
   Task requires "publish to prod"
   Checkpoint: "Approve?" → [Approve] [Deny]

8. Show wallet (if time)
   Spending meter: $2.50 / $5.00
```

### 9:00-11:00 — Recording & Submission

**Aryan:**
- Screen recording (Start with outcome, end with committed task)
- Voiceover explaining what's happening
- Upload to Google Drive / YouTube

**Omkar:**
- Prepare summary slide deck (3 slides max):
  - Architecture (what we built)
  - Fencing (why it matters)
  - Demo results (what works)

---

## Critical Checkpoints

### By 2pm (must have):
- [ ] Handlers compiling & tests passing
- [ ] Bedrock agent promises returning results
- [ ] WebSocket connections wiring

### By 6pm (must have):
- [ ] Full end-to-end test passing (claim → submit → verify)
- [ ] Device failover working (lease reassignment)
- [ ] Events broadcasting to connected clients

### By 9pm (must have):
- [ ] Demo script runs without errors
- [ ] Recording captured
- [ ] Code committed (final push)

---

## Troubleshooting Guide

**Bedrock agent calls timing out:**
```javascript
// Add timeout wrapper
const timeout = (fn, ms) => Promise.race([
  fn(),
  new Promise((_, rej) => setTimeout(() => rej('timeout'), ms))
]);

const result = await timeout(invokeBedrockAgent(agent, task), 30000);
```

**WebSocket connections not receiving events:**
```javascript
// Debug: Log every broadcast
export async function broadcast(event) {
  console.log('📡 Broadcasting:', event.type, event.projectId);
  // ... send to connections
}
```

**Lease claim returning 409 unexpectedly:**
```javascript
// Check: Is leaseExpiry still in future?
const task = await db.getItem(...);
console.log('Current time:', Date.now());
console.log('Lease expires:', task.leaseExpiry);
console.log('Expired?', task.leaseExpiry < Date.now());
```

**Sweep not finding expired leases:**
```javascript
// Verify EventBridge is triggering
// Check CloudWatch Logs: /aws/lambda/crewdesk-sweep
// Should see "[SWEEP]" log every 15 seconds
```

---

## Files to Edit Saturday

**Omkar (Bedrock agents):**
- `services/api/lib/bedrock.mjs` ← Main file
- `services/api/handlers/agents/lead.mjs` ← Test the lead agent
- `docs/BACKEND_ARCHITECTURE.md` ← Reference design

**Aryan (WebSocket):**
- `services/api/lib/broadcast.mjs` ← Main file
- `template.yaml` ← Add WebSocket API Gateway
- `services/api/schema.mjs` ← Add Connections table

**Both:**
- `services/api/handlers/tasks/submit.mjs` ← Integrate tester agent
- `services/api/handlers/events/sweep.mjs` ← Verify it works

---

## Final Commit Message (Sunday 3pm)

```
🎉 CrewDesk Demo - Fully Functional Distributed Task System

- Lease protocol: atomic writes + fencing tokens (zero data corruption)
- Auto-reassignment: devices fail over gracefully (sweep every 15s)
- Agent orchestration: outcome → contracts → execution → verification
- WebSocket events: real-time UI updates (live dashboard)
- Checkpoints: human approval gates (safe delegation)

Tested:
✅ Device 1 claims task at epoch 1
✅ Device 1 crashes, task expires
✅ Sweep reassigns to Device 2 at epoch 2
✅ Device 1 restarts, tries to submit with old epoch → REJECTED
✅ Device 2 submits and passes tester verification
✅ Checkpoint approves "publish to prod"
✅ Wallet meter caps spending at $5

All P0 features working. Ready for production.
```

---

**You've got this. The foundation is solid. Now ship it.** 🚀

Questions? Check:
- `QUICK_START.md` — Friday setup
- `docs/BACKEND_ARCHITECTURE.md` — Design docs
- `services/api/README.md` — Handler reference
