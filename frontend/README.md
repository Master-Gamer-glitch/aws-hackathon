# CrewDesk / Ultron frontend

Next.js 14 (App Router) + TypeScript + Tailwind. Integrated with the Airstream backend in `../services/api`.

## Run

```bash
cd frontend
cp .env.example .env.local   # then adjust if needed
npm ci
npm run dev                  # http://localhost:3000
```

Node server: `npm run build && npm start`. Hosted build: see "Hosting" below.

## Routes

| Route | What it is |
|---|---|
| `/` | Marketing / scroll experience |
| `/office` | Live office floor (PixiJS) with mission-control sidebar |
| `/airstream` | Device rooms: create/join, heartbeat, distribute → collect → demo, live event feed |
| `/prototype`, `/start`, `/agent/*` | UI prototype and onboarding |

## Backend integration

```
src/lib/airstream/
  config.ts   env-driven URLs, project id, live-mode flag
  api.ts      typed REST client (rooms, devices, heartbeat, tasks, distribute, collect, demo)
  socket.ts   reconnecting WebSocket client for the event stream
src/live-office/bridge/
  liveLedger.ts   backend tasks -> office task ledger (polling + WebSocket nudges)
src/components/airstream/AirstreamConsole.tsx   the /airstream page
```

### Two modes for the office floor

- **Simulated** (`NEXT_PUBLIC_LIVE_BACKEND` unset/false): built-in mock events and ledger. No backend needed.
- **Live** (`NEXT_PUBLIC_LIVE_BACKEND=true`): the floor shows the real task list from `GET /projects/{id}/tasks`,
  refreshed every 5s and immediately on `task.*`, `tasks.*`, `code.*`, `demo.*`, `status.*` events. The simulation is off,
  so an empty backend means an idle floor.

Backend task state maps to card state: `ready`→todo, `leased/submitted/verifying`→doing, `committed`→done,
`failed`→blocked (acknowledging it archives the card; there is nothing to approve server-side).
A card animates a character only when the backend names an agent id that exists on the roster
(`ownerAgent`, `leaseOwner` or `resultDeviceId`). Tasks are owned by devices, so most cards show without an assignee.
Messages typed into the office queue stay local — the backend has no "add card" endpoint (`POST /outcomes` runs the lead agent on Bedrock).

### Two different APIs, two URLs

The stack exposes a **REST** API and a **WebSocket** API with different ids. They must not be mixed up:

| | Value | Env var |
|---|---|---|
| REST | `https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod` | `AIRSTREAM_API_URL` (server) |
| WebSocket | `wss://34gffaaf1a.execute-api.us-west-2.amazonaws.com/dev` | `NEXT_PUBLIC_WS_BASE_URL` |

The REST id is not a stack output; look it up with
`aws apigateway get-rest-apis --region us-west-2 --profile crewdesk`.

### REST proxy (Node server only)

On `npm run dev` / `npm start`, `next.config.mjs` rewrites `/api/airstream/*` to `AIRSTREAM_API_URL` and the client calls that
same-origin path by default, so no cross-origin call is made. The Lambdas now also send CORS headers on real responses
(`services/api/lib/cors.mjs`), so setting `NEXT_PUBLIC_API_BASE_URL` to the REST URL and calling it directly works too.
The static export always calls it directly.

## Hosting (AWS Amplify, static export)

Live: https://main.d15tcfml8y1sep.amplifyapp.com

```bash
./deploy.sh                # build static export -> zip -> Amplify manual deployment
SKIP_BUILD=1 ./deploy.sh   # re-publish the existing ./out
```

The hosted build is `STATIC_EXPORT=true` (`output: "export"`), so there is no Node server and no `/api/airstream` proxy.
The browser calls the REST API directly, which works because the Lambdas now return CORS headers on real responses.
The script bakes `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL`, `NEXT_PUBLIC_PROJECT_ID` and
`NEXT_PUBLIC_LIVE_BACKEND` into the bundle; override any of them in the environment before running it.

CloudFront is not used: this AWS account has to be verified by AWS Support before it can create CloudFront resources.
Amplify serves over HTTPS without that. If the account is verified later, S3 + CloudFront is a drop-in alternative
for the `out/` folder (add a viewer-request function that maps `/path` to `/path/index.html`).

## Legacy static UI

The previous single-file UI is kept in `legacy/` (`index.html`, `config.js`, `deploy.sh`, docs). It is not part of the Next.js build.
