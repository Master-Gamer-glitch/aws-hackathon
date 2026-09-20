# Airstream device worker

The piece that actually does the work. It runs on a real machine, joins a room, and builds the tasks the room
leases to it using that machine's own agent CLI. Without a worker, nothing produces files and collect and demo
have nothing to merge.

```
master:   create room ─▶ plan ─▶ (workers join) ─▶ distribute ─▶ … ─▶ collect ─▶ demo
worker:                           join, heartbeat ─▶ pick up leased tasks ─▶ build ─▶ submit files
```

Needs Node 22+ and no npm install. The `claude` executor also needs the [Claude Code](https://claude.com/claude-code)
CLI, signed in, on the machine that runs the worker.

## Quick start

```bash
# 1. a room (or use the /airstream page, which shows these commands with the room id filled in)
node worker/device-worker.mjs create-room --name "My laptop"            # prints a room id

# 2. split an outcome into tasks (once, on the master)
node worker/device-worker.mjs plan "a Node CLI that prints a multiplication table for 1 to 5" --room <roomId>

# 3. start a worker on every device that should help
node worker/device-worker.mjs run --room <roomId>

# 4. distribute, then collect and demo (buttons on /airstream, or:)
node worker/device-worker.mjs distribute --room <roomId>
node worker/device-worker.mjs collect --room <roomId>
node worker/device-worker.mjs demo --room <roomId>
```

`status --room <id>` shows the room, its devices and every task.

## What a worker does

1. **Joins** and reports its own hardware and tools (`node`, `python`, `docker`, `claude`, …). Distribution scores devices
   on what they report, so tasks that need a tool go to a device that has it.
2. **Heartbeats** every 8 seconds. A device silent for 30 seconds is marked offline and its tasks are reassigned.
3. **Polls** for tasks leased to it. For each one it makes a scratch folder, asks the model to write the task's files
   there, reads them back and submits them. The scratch folder is deleted afterwards (`--keep-workdir` to inspect it).
4. Files the task does not own are dropped, and a task whose required files are missing is retried once with feedback.

## Executors

| `--executor` | What it does |
|---|---|
| `claude` (default) | Runs `claude -p --restricted` in the scratch folder. `--restricted` removes every tool that runs commands and confines file access to that folder, so the agent can write files and nothing else. Each call is capped by `--max-usd` (default 1). |
| `mock` | Deterministic tasks and files, no model. For testing the pipeline without spending tokens. |

`--model sonnet|opus|…` is passed to the Claude CLI.

## Planning

`plan` asks the model for 2 to 6 tasks. Each task must own a disjoint list of files and carry the interface notes the
others rely on, because the devices cannot see each other's work. The backend rejects a plan where two tasks own the
same file, and the worker retries once with the reason. Planning again replaces the room's earlier plan.

## Options

`--api URL` (`AIRSTREAM_API_URL`), `--project ID` (`AIRSTREAM_PROJECT`, default `proj_demo`), `--room ID` (`AIRSTREAM_ROOM`),
`--executor`, `--model`, `--name`, `--max-tasks N`, `--idle-exit SECONDS`, `--max-usd X`, `--tasks N` (plan size), `--keep-workdir`.

## Limits

- A task has to finish inside its 5 minute lease; the worker gives each model call up to 4 minutes.
- Only Node.js projects are planned for and demoed reliably (see `docs/ARTIFACTS.md` for what the demo can run).
- Bedrock is not used: this AWS account cannot invoke Anthropic models, which is why the model runs on the device.
