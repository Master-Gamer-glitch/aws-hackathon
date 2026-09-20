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

## Screens

Every app screen has a small floating tab: **Live** (default, real data) and **See how it works** (the frontend
team's simulated demo, with made-up data, labelled "simulated data"). The mode is in the URL (`?mode=demo`).

| Route | Live tab | See how it works tab |
|---|---|---|
| `/start` | Your rooms: create a room, open one by id, live state of each room you know | The original mock workspace picker and sign-in |
| `/office?room=<id>` | The office floor for one backend room: real devices as characters, real tasks, real events | The simulated office with the fake crew, terminal and devices |
| `/airstream` | Console for one room: create/join, heartbeat, distribute, collect, demo, task list, event feed | n/a |
| `/`, `/prototype`, `/agent/*` | Marketing page; UI prototypes (all made-up data) | |

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

### The live office

`components/office/live/` is the real office. It watches one room (`useRoom`: devices and tasks polled every 3 s, plus the
WebSocket event stream, which triggers an immediate re-read) and pushes it into the same PixiJS floor the demo uses:

- **Devices are the characters.** The master device is the boss in the Command Center; every worker gets a desk.
  Roster, device strip and device panel show what each device reported when it joined (platform, cores, RAM, tools) and its
  live CPU/RAM load from its heartbeats. A device that stops heartbeating turns offline.
- **What a character is doing comes from the tasks**, on every poll (`live-office/bridge/liveRoster.ts`): a worker is
  "building" the task it reports in its heartbeat, "assigned" for other tasks it holds, idle otherwise. The master is
  coordinating while tasks are open, and shows collect and demo as they run.
- **Tasks** reach the wall boards through `bridge/liveLedger.ts`. **Events** are the backend's WebSocket messages.
- The Room tab says what the next step is for the room's current state, with the worker command to run when it needs one.

Live mode and the demo share one store. Entering live mode swaps in the room's devices and switches roster persistence
off, so real devices never overwrite the demo's saved roster; leaving restores it (`enterLiveRoster` / `leaveLiveRoster`).

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
The script bakes `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL` and `NEXT_PUBLIC_PROJECT_ID` into the bundle;
override any of them in the environment before running it.

CloudFront is not used: this AWS account has to be verified by AWS Support before it can create CloudFront resources.
Amplify serves over HTTPS without that. If the account is verified later, S3 + CloudFront is a drop-in alternative
for the `out/` folder (add a viewer-request function that maps `/path` to `/path/index.html`).

## Legacy static UI

The previous single-file UI is kept in `legacy/` (`index.html`, `config.js`, `deploy.sh`, docs). It is not part of the Next.js build.
