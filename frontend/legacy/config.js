// Kaam Chalau Frontend Configuration
// Update these for your environment

const CONFIG = {
  // AWS Endpoints (Backend)
  API_BASE_URL: 'https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod',
  WS_BASE_URL: 'wss://34gffaaf1a.execute-api.us-west-2.amazonaws.com/dev',

  // Project ID
  PROJECT_ID: 'proj_demo',

  // Device Configuration
  DEVICE_HEARTBEAT_INTERVAL: 8000, // 8 seconds
  DEVICE_OFFLINE_THRESHOLD: 30000, // 30 seconds (backend default)

  // UI Configuration
  MAX_EVENTS_IN_LOG: 50,
  AUTO_RECONNECT_DELAY: 3000, // 3 seconds

  // Feature Flags
  FEATURES: {
    ENABLE_DEMO_EXECUTION: true,
    ENABLE_CODE_COLLECTION: true,
    ENABLE_TASK_DISTRIBUTION: true,
    ENABLE_OFFLINE_DETECTION: true
  }
};

// Don't modify below this line unless you know what you're doing

// Validate configuration
if (!CONFIG.API_BASE_URL || !CONFIG.WS_BASE_URL) {
  console.error('❌ Missing API endpoints in config.js');
  throw new Error('Configuration error');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
