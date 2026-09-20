# Artifacts: submit → collect → demo

How code moves from devices to a running demo. Everything shared between Lambda invocations lives in the
stack's S3 bucket (`ArtifactsBucketName` output), because Lambda `/tmp` is per-instance.

```
device ──submit──▶ projects/{projectId}/tasks/{taskId}/{path}        (one folder per task)
master ──collect─▶ rooms/{roomId}/integrated/{path}                  (merged project)
                   rooms/{roomId}/integration-report.json            (files, per-device counts, conflicts)
master ──demo────▶ downloads integrated/ to /tmp, runs it, returns the output
```

Objects expire after 7 days.

## Submit: `POST /tasks/{projectId}%23TASK%23{taskId}/submit`

```json
{
  "deviceId": "slave_123",
  "leaseEpoch": 1,
  "artifacts": [
    { "path": "package.json", "content": "{ \"scripts\": { \"start\": \"node server.js\" } }" },
    { "path": "assets/logo.png", "content": "<base64>", "encoding": "base64" }
  ]
}
```

- `leaseEpoch` must match the task's current lease (fencing); a stale epoch is `409`.
- `path` is relative, uses `/`, and may not contain `.`/`..` segments or start with `/` (`400` otherwise).
- Limits: 200 files, 1 MB per file, 4 MB per submission. `encoding` is `utf8` (default) or `base64`.
- Files are stored before the task changes state, and a resubmission replaces the earlier files.
- `artifacts` is optional. A task that submits none still commits, it just contributes nothing to collect.

## Collect: `POST /projects/{projectId}/rooms/{roomId}/collect`

Merges the files of every **committed** task in the project, oldest commit first. If two tasks wrote the same path,
the later one wins and the overwrite is listed in `conflicts`. Running collect again rebuilds the folder from scratch.
With nothing to collect it returns `filesIntegrated: 0` and leaves the room untouched.

`verifyStatus` is `failed` when `package.json` is not valid JSON, `skipped` when there was nothing to merge.
It is a structural check, not a build.

## Demo: `POST /projects/{projectId}/rooms/{roomId}/demo`

| Project has | Runs |
|---|---|
| `package.json` | `npm install` if it lists dependencies and ships no `node_modules`, then `npm start` (else `npm run dev`, else `main`, else `index/server/app/main.js`) |
| `main.py` / `app.py` | `python3` — **not installed in the Lambda runtime**, so this returns a clear `400` |
| `index.html` only | reported as a static site, nothing executed |
| `go.mod`, `Cargo.toml`, `Dockerfile` | `400`: no such runtime in the sandbox |

Limits and safety:

- **Time:** API Gateway cuts REST calls at 29 s, so a run is budgeted to about 24 s. A server still running at the end
  is stopped and counts as a successful start (`timedOut: true`). `npm install` gets at most 14 s of that.
- **Isolation:** the project runs with a scrubbed environment (`PATH`, `HOME`, `PORT`, npm settings only). It cannot read
  the Lambda's AWS credentials. Install scripts are skipped (`--ignore-scripts`).
- **Output:** the last 4000 characters of stdout+stderr are returned and stored on the room (`demoStatus.outputTail`).
- The endpoints are unauthenticated, so anyone who can call them can run code that a device submitted. Add auth before
  exposing this beyond a demo.

## Live events

Every function that broadcasts (`device.joined`, `task.assigned`, `tasks.distributed`, `verify.passed`,
`code.collecting`, `code.collected`, `demo.starting`, `demo.completed`, …) needs the WebSocket endpoint and
`execute-api:ManageConnections`, both set in `template.yaml`. Without them `broadcast()` fails silently.

## Testing

```bash
AWS_PROFILE=crewdesk node services/api/scripts/e2e-airstream.mjs              # main pipeline + validation + events
AWS_PROFILE=crewdesk node services/api/scripts/e2e-airstream.mjs --extended   # + server, npm install, Python, isolation
```

Runs against the deployed stack and removes everything it creates.
