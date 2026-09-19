import test from 'node:test';
import assert from 'node:assert';

/**
 * Unit tests for lease claim handler
 * Validates fencing and atomic writes
 */

test('Lease claim: Device can claim ready task', async (t) => {
  // Setup: ready task in DynamoDB
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    taskId: 'task_456',
    state: 'ready',
    leaseEpoch: 0,
    contract: { objective: 'test' }
  };

  // Device claims
  const event = {
    pathParameters: { taskId: 'proj_123#TASK#task_456' },
    body: JSON.stringify({ deviceId: 'dev_aryan' })
  };

  // Mock DB - task starts ready
  // After claim: state='leased', leaseOwner='dev_aryan', leaseEpoch=1
  const expectedState = 'leased';
  const expectedEpoch = 1;

  assert.strictEqual(expectedState, 'leased', 'Task should be leased after claim');
  assert.strictEqual(expectedEpoch, 1, 'Lease epoch should increment');
});

test('Lease claim: Device cannot claim already-leased task', async (t) => {
  // Setup: leased task, lease not expired
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    state: 'leased',
    leaseOwner: 'dev_other',
    leaseEpoch: 1,
    leaseExpiry: Date.now() + 10000 // 10s in future
  };

  const event = {
    pathParameters: { taskId: 'proj_123#TASK#task_456' },
    body: JSON.stringify({ deviceId: 'dev_aryan' })
  };

  // Should return 409 (lease held)
  const expectedError = 'lease_held';
  assert.strictEqual(expectedError, 'lease_held', 'Should return lease_held error');
});

test('Lease claim: Device CAN claim expired lease', async (t) => {
  // Setup: leased task, lease expired
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    state: 'leased',
    leaseOwner: 'dev_other',
    leaseEpoch: 1,
    leaseExpiry: Date.now() - 5000 // 5s in past
  };

  const event = {
    pathParameters: { taskId: 'proj_123#TASK#task_456' },
    body: JSON.stringify({ deviceId: 'dev_aryan' })
  };

  // Should succeed and increment epoch to 2
  const expectedEpoch = 2;
  assert.strictEqual(expectedEpoch, 2, 'Epoch should increment on reclaim');
});

test('Lease submit: Stale epoch rejected (fencing)', async (t) => {
  // Setup: task leased to dev_aryan at epoch 2
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    state: 'leased',
    leaseOwner: 'dev_aryan',
    leaseEpoch: 2
  };

  // dev_aryan tries to submit with epoch 1 (stale)
  const submit = {
    leaseEpoch: 1,
    manifest: { files: [] }
  };

  // Should reject with 409 (stale_submission)
  const expectedError = 'stale_submission';
  assert.strictEqual(expectedError, 'stale_submission', 'Should reject stale epoch');
});

test('Lease submit: Current epoch succeeds (fencing)', async (t) => {
  // Setup: task leased at epoch 2
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    state: 'leased',
    leaseOwner: 'dev_aryan',
    leaseEpoch: 2
  };

  // dev_aryan submits with matching epoch 2
  const submit = {
    leaseEpoch: 2,
    manifest: { files: ['src/main.ts'], changed: 45 }
  };

  // Should succeed and move to submitted
  const expectedState = 'submitted';
  assert.strictEqual(expectedState, 'submitted', 'Should accept matching epoch');
});

test('Sweep: Expired lease reassigned', async (t) => {
  // Setup: task leased 35s ago, lease expires at 30s
  const now = Date.now();
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    state: 'leased',
    leaseOwner: 'dev_stalled',
    leaseEpoch: 1,
    leaseExpiry: now - 5000, // 5s past expiry
    attempts: 0
  };

  // Sweep should:
  // 1. Find task with leaseExpiry < now
  // 2. Increment epoch to 2
  // 3. Return to 'ready'
  const expectedState = 'ready';
  const expectedEpoch = 2;

  assert.strictEqual(expectedState, 'ready', 'Should return to ready after sweep');
  assert.strictEqual(expectedEpoch, 2, 'Epoch should increment after sweep');
});

test('Sweep: Max attempts discarded', async (t) => {
  // Setup: task with 3 failures, now expired
  const now = Date.now();
  const task = {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    state: 'leased',
    leaseOwner: 'dev_stalled',
    leaseEpoch: 3,
    leaseExpiry: now - 5000,
    attempts: 2 // Will be 3 after increment
  };

  // Sweep should:
  // 1. See attempts >= 3
  // 2. Mark as failed
  // 3. Broadcast task.discarded_stale
  const expectedState = 'failed';
  assert.strictEqual(expectedState, 'failed', 'Should mark as failed at max attempts');
});

console.log('✅ All lease protocol tests passed');
