// Two ways to run this app:
//
//  - Node server (`npm run dev` / `npm start`): browser calls to /api/airstream/* are
//    proxied to the REST API below, so the browser never makes a cross-origin call.
//  - Static export (`STATIC_EXPORT=true npm run build` -> ./out, used for S3 + CloudFront):
//    there is no server, so the browser calls the REST API directly. That needs
//    NEXT_PUBLIC_API_BASE_URL and the CORS headers the backend now sends.
const STATIC_EXPORT = process.env.STATIC_EXPORT === "true";

// REST base URL of the deployed Airstream API (API Gateway REST API, SAM stage "Prod").
// This is NOT the WebSocket API — that one is NEXT_PUBLIC_WS_BASE_URL.
const AIRSTREAM_API_URL = (
  process.env.AIRSTREAM_API_URL || "https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod"
).replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  ...(STATIC_EXPORT
    ? { output: "export", trailingSlash: true }
    : {
        async rewrites() {
          return [{ source: "/api/airstream/:path*", destination: `${AIRSTREAM_API_URL}/:path*` }];
        },
      }),
  webpack: (config) => {
    // Tiled maps (.tmj) used by the live office are plain JSON text — load them as raw strings.
    config.module.rules.push({ test: /\.tmj$/, type: "asset/source" });
    return config;
  },
};

export default nextConfig;
