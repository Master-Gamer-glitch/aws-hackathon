// CORS + error normalisation for Lambda proxy handlers.
//
// API Gateway's `Cors:` setting only answers the OPTIONS preflight. The real
// response must carry Access-Control-Allow-Origin itself, or the browser refuses to
// hand it to the page. Wrap a handler with withCors() and every return path —
// including thrown errors — gets the headers.

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

export function withCors(handler) {
  return async (event, context) => {
    try {
      const res = await handler(event, context);
      return { ...res, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(res?.headers || {}) } };
    } catch (err) {
      const bad = err instanceof SyntaxError; // JSON.parse of a malformed request body
      console.error('Unhandled handler error:', err);
      return {
        statusCode: bad ? 400 : 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ error: bad ? 'Invalid JSON body' : err.message }),
      };
    }
  };
}
