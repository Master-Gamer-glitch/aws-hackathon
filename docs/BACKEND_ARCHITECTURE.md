# CrewDesk Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway + WebSocket                    │
│              (Handles auth, routes, connections)             │
└──────┬──────────────────────┬──────────────────────┬─────────┘
       │                      │                      │
       v                      v                      v
┌──────────────┐      ┌─────────────────┐    ┌──────────────┐
│  Claim/      │      │  Lead Agent     │    │ Device       │
│  Submit      │      │  (Outcome →     │    │ Heartbeat    │
│  Handlers    │      │   Contracts)    │    │              │
└──────┬───────┘      └────────┬────────┘    └──────┬───────┘
       │                       │                     │
       └───────────────┬───────┴──────────┬──────────┘
                       │                  │
                       v                  v
                  ┌────────────────────────────┐
                  │    DynamoDB Tables:        │
                  │  - Tasks (state machine)   │
                  │  - Projects (plans)        │
                  │  - Devices (registry)      │
                  │  - Checkpoints (approvals) │
                  └──────────┬─────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                v                         v
            ┌────────────┐          ┌──────────┐
            │ Bedrock    │          │EventBridge
            │ Agents     │          │ (Sweep)
            └────────────┘          └──────────┘
```

## Core Entities

### Task (DynamoDB)
```
{
  projectId: "proj_123",
  sk: "TASK#task_456",
  state: "ready" | "leased" | "submitted" | "verifying" | "committed" | "failed",
  
  // Lease fields (enable claim/submit/reassign)
  leaseOwner: "dev_aryan",
  leaseEpoch: 2,               // fencing token
  leaseExpiry: 1697654400000,  // ms
  attempts: 0,
  
  // Contract (what needs to be done)
  contract: {
    objective: "Implement user login",
    expectedOutput: "Working /login endpoint",
    successCriteria: ["Returns JWT", "Handles invalid credentials"],
    allowedActions: ["read_repo", "write_code"],
    budget: { usd: 1.5 },
    ownerAgent: "coder"
  },
  
  // Result (after device submits)
  manifest: { files: ["src/login.ts"], changed: 45 },
  resultDeviceId: "dev_aryan",
  submittedAt: 1697654350000,
  
  // Verification
  verifyResult: {
    passed: true,
    criteria: [...]
  },
  
  createdAt: 1697654200000,
  expiresAt: 1697740600000
}
```

### Device
```
{
  deviceId: "dev_aryan",
  roomId: "room_123",
  name: "aryan-macbook",
  platform: "darwin",
  arch: "arm64",
  cpuCount: 10,
  benchScore: 8.5,  // 1-10
  lastHeartbeat: 1697654400000,
  isOnline: true,
  expiresAt: 1697654430000  // TTL after no heartbeat
}
```

### Checkpoint (Human approval gate)
```
{
  projectId: "proj_123",
  checkpointId: "chk_789",
  taskId: "task_456",
  action: "publish" | "push" | "deploy" | "spend>cap",
  
  decision: "approve" | "deny" | null,
  note: "Publishing to production",
  resolvedAt: null,
  
  taskToken: "arn:aws:states:..."  // for Step Functions callback
}
```

## Request Flow

### 1. Claim Task
```
Device:
  POST /tasks/{id}/claim
  { deviceId: "dev_aryan" }

Lambda:
  1. Load task: state='ready' OR leaseExpiry < now?
  2. Yes → conditional write:
     { leaseOwner: "dev_aryan", leaseEpoch: 2, leaseExpiry: now+30s, state: "leased" }
  3. No → return 409 (lease_held)

Result: {
  statusCode: 200,
  leaseEpoch: 2,
  leaseExpiry: 1697654430000
}
```

### 2. Submit Task (with Fencing)
```
Device:
  POST /tasks/{id}/submit
  { deviceId: "dev_aryan", leaseEpoch: 2, manifest: {...} }

Lambda:
  1. Load task
  2. Check: leaseEpoch == 2? (fencing — rejects stale submissions)
  3. Yes → mark submitted, call tester agent
  4. No → return 409 (stale_submission)

Tester Agent:
  Score criteria: ["Returns JWT", "Handles invalid credentials"]
  Return: { passed: true, criteria: [...] }

Result: {
  statusCode: 200,
  passed: true,
  verifyResult: {...}
}
```

### 3. Sweep (Auto-reassign expired leases)
```
EventBridge: Every 15 seconds

Lambda:
  1. Scan all state='leased' tasks
  2. For each with leaseExpiry < now:
     - If attempts < 3: leaseOwner=null, state='ready', epoch++
     - If attempts >= 3: state='failed'
  3. Broadcast events (task.reassigned, task.discarded_stale)

Result: {
  reassigned: 2,
  exhausted: 1,
  errors: []
}
```

## Lease Protocol (The Critical Part)

### Why Leases?
Without leases, two devices could both claim and submit the same task, causing data corruption.

### How It Works

**State Machine:**
```
ready → (device claims) → leased → (device submits) → submitted → verifying → committed
          ↑                          ↑
          └──(sweep: expired)────────┘
           (or stays leased until timeout)
```

**Atomic Writes (DynamoDB ConditionExpression):**
```javascript
// Only one device can succeed on claim
UpdateExpression: 'SET state=:leased, leaseOwner=:dev, leaseEpoch=:ep, leaseExpiry=:exp',
ConditionExpression: '(state = :ready OR leaseExpiry < :now)',
// If condition fails → ConditionalCheckFailedException → return 409
```

**Fencing Token (leaseEpoch):**
```javascript
// Device 1 claims task at epoch 1
// Device 1 stalls; lease expires
// Sweep increments to epoch 2, returns to ready
// Device 2 claims at epoch 2
// Device 1 tries to submit with old epoch 1 → REJECTED (stale_submission)
```

## P0 Features (MVP)

| Feature | Handler | Status | Impact |
|---------|---------|--------|--------|
| **F1: Lease Claim** | claim.mjs | ✅ | Devices can claim tasks without collision |
| **F2: Lease Submit** | submit.mjs | ✅ | Fencing prevents stale submissions |
| **F3: Lease Sweep** | sweep.mjs | ✅ | Expired leases auto-reassigned |
| **F4: Lead Agent** | lead.mjs | ✅ | Outcome → 4-8 task contracts |
| **F5: Verification** | bedrock | 🔨 | Tester scores criteria |
| **F6: Checkpoints** | TBD | 🔨 | Human approval gate |
| **F7: WebSocket Events** | TBD | 🔨 | Real-time UI updates |
| **F8: Wallet** | TBD | 🔨 | Per-agent spend tracking |

## Testing Checklist (Friday Evening)

- [ ] LocalStack runs
- [ ] DynamoDB tables created
- [ ] npm test passes (claim, submit, sweep)
- [ ] curl POST /claim returns 200 + leaseEpoch
- [ ] curl POST /submit with stale epoch returns 409
- [ ] EventBridge rule triggers sweep every 15s
- [ ] Lead agent returns valid contracts

## Deployment

### Local (Testing)
```bash
cd services/api
./local-setup.sh
npm install
npm test
sam local start-api
```

### AWS (Saturday)
```bash
sam build
sam deploy --guided
```

SAM handles:
- Lambda packaging
- DynamoDB table creation
- EventBridge rule
- API Gateway wiring
- IAM roles

---

**Next:** Read `services/api/README.md` for setup instructions.
