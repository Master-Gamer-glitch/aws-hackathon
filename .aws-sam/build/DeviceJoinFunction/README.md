# CrewDesk Backend API

Core Lambda handlers for distributed task execution, agent orchestration, and device coordination.

## Critical Files

- **schema.mjs** — DynamoDB tables and item shapes
- **handlers/tasks/claim.mjs** — Device claims task (leasing)
- **handlers/tasks/submit.mjs** — Device submits result (fencing check)
- **handlers/agents/lead.mjs** — Lead agent: outcome → contracts
- **handlers/events/sweep.mjs** — Reassign expired leases
- **lib/dynamodb.mjs** — DynamoDB client
- **lib/bedrock.mjs** — Bedrock agent calls

## Setup (Friday Night)

### 1. Install dependencies
```bash
npm install
```

### 2. Create DynamoDB tables (LocalStack)

Install LocalStack:
```bash
docker pull localstack/localstack:latest
docker run -d -p 4566:4566 -e SERVICES=dynamodb,s3 localstack/localstack
```

Create tables:
```bash
aws dynamodb create-table \
  --table-name crewdesk-tasks \
  --attribute-definitions AttributeName=projectId,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=projectId,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566

# Repeat for other tables (see schema.mjs)
```

OR use SAM template (see below).

### 3. Set environment variables

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export DYNAMODB_ENDPOINT=http://localhost:4566
```

### 4. Test handlers locally

```bash
# Test claim
curl -X POST http://localhost:3001/tasks/proj_123%23TASK%23task_456/claim \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev_aryan"}'

# Test submit
curl -X POST http://localhost:3001/tasks/proj_123%23TASK%23task_456/submit \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId":"dev_aryan",
    "leaseEpoch":1,
    "manifest":{"files":["src/main.ts"],"changed":45}
  }'
```

## Architecture

```
┌─────────────────────────────────────────┐
│       API Gateway (REST + WebSocket)    │
└────────────────────┬────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    v                v                v
Claim/Submit    Lead Agent       Sweep
  Handlers       Handler         Handler
    │                │               │
    └────────────────┼───────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
         v                      v
      DynamoDB              Bedrock
      (Tasks)             (Agents)
```

### Lease Protocol

**Claim:**
1. Device sends POST /tasks/{id}/claim
2. Lambda checks: state='ready' OR leaseExpiry < now
3. If true: atomic write with (leaseOwner, leaseEpoch, leaseExpiry)
4. If false: return 409 (lease held)

**Submit:**
1. Device sends POST /tasks/{id}/submit with (leaseEpoch, manifest)
2. Lambda checks: leaseEpoch matches current (fencing)
3. If match: mark submitted, call tester agent
4. If mismatch: return 409 (stale submission - task was reassigned)

**Sweep:**
1. EventBridge triggers every 15s
2. Scan all leased tasks
3. For each with leaseExpiry < now:
   - If attempts < 3: set state='ready', increment epoch
   - If attempts >= 3: set state='failed'

## P0 Implementation Timeline

| Phase | What | Who | Done? |
|-------|------|-----|-------|
| **Now** | Claim + Submit + Sweep | Aryan | 🔨 |
| **Fri evening** | Lead agent | Omkar | 🔨 |
| **Sat morning** | Coder + Tester + Reviewer agents | Omkar | 🔨 |
| **Sat afternoon** | WebSocket + Live events | Aryan | 🔨 |
| **Sat evening** | Integration test | All | ✅ |

## Next Steps

1. **Aryan:** Deploy SAM template to AWS or LocalStack
2. **Omkar:** Implement Bedrock prompts for agents
3. **Verify:** Test lease protocol with 2 devices

## Key Principles

- **Atomic writes:** DynamoDB conditional expressions prevent race conditions
- **Fencing tokens:** leaseEpoch prevents stale submissions after reassignment
- **Resilient sweep:** Find expired leases every 15s, reassign or fail
- **Broadcast all:** Every action logged as event for UI real-time updates

## Testing

```bash
npm test
```

Runs unit tests for lease logic, fencing, and sweep algorithm.

---

**Ready to ship. Questions?** Check `/docs/BACKEND_BUILD_PLAN.md`
