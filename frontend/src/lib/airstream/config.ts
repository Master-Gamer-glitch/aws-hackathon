// Airstream backend configuration. Everything is overridable from env so the same
// build can target dev, staging or prod (see frontend/.env.example).
//
// REST and WebSocket are two DIFFERENT API Gateway APIs with different ids, so they
// need separate URLs:
//   REST      https://<rest-id>.execute-api.<region>.amazonaws.com/Prod
//   WebSocket wss://<ws-id>.execute-api.<region>.amazonaws.com/dev

/**
 * Where REST calls go from the browser.
 *
 * Defaults to `/api/airstream`, a same-origin path that next.config.mjs rewrites to
 * the real REST API. That avoids CORS: the room/device handlers do not send
 * `Access-Control-Allow-Origin` on their real responses, so a direct browser call
 * from another origin could not read them. Set NEXT_PUBLIC_API_BASE_URL to a full
 * URL only once the backend sends CORS headers (or for a static, server-less host).
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api/airstream').replace(/\/+$/, '');

export const WS_BASE_URL = (
  process.env.NEXT_PUBLIC_WS_BASE_URL || 'wss://34gffaaf1a.execute-api.us-west-2.amazonaws.com/dev'
).replace(/\/+$/, '');

export const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'proj_demo';

/** Slave devices must heartbeat well inside the backend's 30s offline threshold. */
export const HEARTBEAT_INTERVAL_MS = 8_000;

/** How often a watched room re-reads its devices and tasks when no live event nudges it sooner. */
export const ROOM_POLL_MS = 3_000;

export const WS_RECONNECT_MS = 3_000;
