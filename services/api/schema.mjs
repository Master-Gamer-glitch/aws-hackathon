/**
 * DynamoDB Schema Setup
 * Tables: Projects, Tasks, Devices, Rooms, Wallet, Checkpoints, AuditLog
 */

export const TABLES = {
  TASKS: 'crewdesk-tasks',
  PROJECTS: 'crewdesk-projects',
  DEVICES: 'crewdesk-devices',
  ROOMS: 'crewdesk-rooms',
  WALLET: 'crewdesk-wallet',
  CHECKPOINTS: 'crewdesk-checkpoints',
  AUDIT_LOG: 'crewdesk-audit-log'
};

export const tableDefinitions = [
  {
    name: TABLES.TASKS,
    partitionKey: { name: 'projectId', type: 'S' },
    sortKey: { name: 'sk', type: 'S' }, // TASK#{taskId}
    gsi: [
      {
        name: 'DeviceIndex',
        partitionKey: 'leaseOwner',
        sortKey: 'leaseExpiry'
      },
      {
        name: 'StateIndex',
        partitionKey: 'state',
        sortKey: 'createdAt'
      }
    ],
    ttl: 'expiresAt'
  },
  {
    name: TABLES.PROJECTS,
    partitionKey: { name: 'projectId', type: 'S' },
    sortKey: { name: 'sk', type: 'S' }, // PROJ, OUTCOME, PLAN#{planId}
    ttl: 'expiresAt'
  },
  {
    name: TABLES.DEVICES,
    partitionKey: { name: 'deviceId', type: 'S' },
    gsi: [
      {
        name: 'RoomIndex',
        partitionKey: 'roomId',
        sortKey: 'lastHeartbeat'
      }
    ],
    ttl: 'expiresAt' // device goes offline after 30s no heartbeat
  },
  {
    name: TABLES.ROOMS,
    partitionKey: { name: 'roomId', type: 'S' }
  },
  {
    name: TABLES.WALLET,
    partitionKey: { name: 'projectId', type: 'S' },
    sortKey: { name: 'agentId', type: 'S' } // or 'TOTAL'
  },
  {
    name: TABLES.CHECKPOINTS,
    partitionKey: { name: 'projectId', type: 'S' },
    sortKey: { name: 'checkpointId', type: 'S' },
    gsi: [
      {
        name: 'TaskIndex',
        partitionKey: 'taskId',
        sortKey: 'createdAt'
      }
    ],
    ttl: 'expiresAt'
  },
  {
    name: TABLES.AUDIT_LOG,
    partitionKey: { name: 'projectId', type: 'S' },
    sortKey: { name: 'sk', type: 'S' }, // ts#{timestamp}##{eventId}
    ttl: 'expiresAt' // 30 days
  }
];

// Item shapes for reference
export const itemShapes = {
  task: {
    projectId: 'proj_123',
    sk: 'TASK#task_456',
    taskId: 'task_456',
    state: 'ready', // ready, leased, submitted, verifying, committed, failed

    // Lease fields
    leaseOwner: 'dev_aryan',
    leaseEpoch: 1,
    leaseExpiry: 1697654400000, // ms
    attempts: 0,

    // Contract
    contract: {
      objective: 'Implement user login',
      expectedOutput: 'Working /login endpoint',
      successCriteria: ['Returns JWT', 'Handles invalid credentials', 'Rate-limited'],
      allowedActions: ['read_repo', 'write_code'],
      budget: { usd: 1.5 },
      ownerAgent: 'coder'
    },

    // Result (after submit)
    manifest: { files: ['src/login.ts'], changed: 123 },
    resultDeviceId: 'dev_aryan',
    submittedAt: 1697654350000,

    // Verification
    verifyResult: {
      passed: true,
      criteria: [
        { name: 'Returns JWT', passed: true },
        { name: 'Handles invalid credentials', passed: true },
        { name: 'Rate-limited', passed: false, feedback: 'Missing rate limit header' }
      ]
    },

    createdAt: 1697654200000,
    expiresAt: 1697740600000 // 24h TTL
  },

  device: {
    deviceId: 'dev_aryan',
    roomId: 'room_123',
    name: 'aryan-macbook',
    platform: 'darwin',
    arch: 'arm64',
    cpuCount: 10,
    benchScore: 8.5, // 1-10, higher = faster
    lastHeartbeat: 1697654400000,
    isOnline: true,
    expiresAt: 1697654430000 // 30s after last heartbeat
  },

  checkpoint: {
    projectId: 'proj_123',
    checkpointId: 'chk_789',
    taskId: 'task_456',
    action: 'publish', // publish, push, deploy, spend>cap
    createdAt: 1697654350000,
    expiresAt: 1697654650000, // 5 min to approve

    decision: null, // 'approve' or 'deny'
    note: 'Publishing to production',
    resolvedAt: null,
    taskToken: 'arn:aws:states:...' // for Step Functions callback
  }
};
