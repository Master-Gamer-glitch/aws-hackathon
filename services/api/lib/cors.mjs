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
      // SyntaxError = JSON.parse of a malformed body; errors carrying a 4xx statusCode
      // (e.g. ArtifactError) are the caller's fault and keep their message.
      const status = err instanceof SyntaxError ? 400
        : (Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 500);
      console.error('Unhandled handler error:', err);
      return {
        statusCode: status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ error: err instanceof SyntaxError ? 'Invalid JSON body' : err.message }),
      };
    }
  };
}
