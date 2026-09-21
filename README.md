# Ultron

🧠 **The Virtual Office for Coders, Creators & Startups Without a Team**

Merging a real engineering org chart with AWS-native autonomous execution

<img width="674" height="243" alt="Screenshot 2026-09-21 at 9 00 01 AM" src="https://github.com/user-attachments/assets/0ec60aea-f9cc-4899-9d04-e1b592e06e36" />
<img width="1470" height="612" alt="Screenshot 2026-09-21 at 9 01 46 AM" src="https://github.com/user-attachments/assets/d6d48052-d672-4c47-bf8e-e50bc882034f" />
<img width="1470" height="835" alt="Screenshot 2026-09-21 at 9 01 10 AM" src="https://github.com/user-attachments/assets/7d79d53f-1e62-46d5-885c-8fa1ff04f108" />
<img width="1470" height="832" alt="Screenshot 2026-09-21 at 9 00 38 AM" src="https://github.com/user-attachments/assets/795ef4cb-c3a4-4776-833f-0959fd783c2a" />




🌐 **Live Demo:** https://fqbg5ksn4mhl6bes43xxlgkwzm0eqyht.lambda-url.us-west-2.on.aws/

**[Features](#-features) • [Installation](#-installation) • [Deployment](#-deployment) • [Documentation](#-documentation) • [Contributing](#-contributing)**

---

## 📖 About

**Ultron** is a control plane for AI-driven work — give it the work, keep the control. A college student shipping a side project, a two-person hackathon team, a three-person startup — they all need what a funded company has: someone on marketing, someone writing code, someone designing, someone researching, someone reviewing the work before it ships. They almost never have that.

Ultron hands them a mission and a budget — through the CLI, a webhook, voice, or the console — decomposes that outcome into verified task contracts, assigns each one to a specialist AI agent, and executes them autonomously across a distributed pool of devices — all visualized live in an "Office" workspace, with every risky action gated behind human approval.

⚡ **Built by: The Binary Brains 🧠**
A team of builders crafting AI systems that stay accountable, bounded, and safe to leave running unattended.

---

## ✨ Key Highlights

- 🤖 **6 Specialized AI Agents** — Lead, Engineer, Designer, Researcher, Reviewer & Marketer
- 🏢 **Live Office Visualization** — watch every agent work, in real time, as it happens
- 🖥️ **Airstream Device Pooling** — turn any laptop into a desk; run agents across multiple machines at once
- 🔒 **Verified, Bounded, Interruptible** — AWS Cedar permission boundaries + human checkpoints on every sensitive action
- 💰 **Wallet & Budget Circuit Breakers** — live spend tracking with automatic caps, never runs away unsupervised
- 📜 **Full Audit Trail** — replay exactly what every agent did, and why, down to the policy decision

---

## 🎯 Features

### 🤖 AI Agents

| Agent | Purpose |
|---|---|
| 🧭 **Lead** | Splits an outcome into 4–8 verified task contracts |
| 🧩 **Engineer** | Writes, builds & implements code against a contract |
| 🎨 **Designer** | Produces UI/visual work against a contract |
| 🔎 **Researcher** | Gathers the context and information a task depends on |
| ✅ **Reviewer** | Scores submitted output against explicit success criteria |
| 📣 **Marketer** | Writes and ships copy and positioning around the work |

**Smart execution:**
- Every output verified against explicit success criteria before it's accepted as done
- Every agent boundaried by an AWS Cedar policy — what it can and can't touch
- Sensitive actions (publish, deploy, spend past a threshold) pause for human approval
- Full replay/audit trail for every action taken

### 🖥️ Workspace & Device Pool (Airstream)

- **Lease & fencing protocol** — DynamoDB conditional writes + epoch tokens ensure no two devices ever double-claim the same task
- **Device pooling** — join a room from any device; capability + benchmark-based fitness scoring assigns work automatically
- **Heartbeat & auto-failover** — a device gone quiet for 30s has its tasks reclaimed and reassigned, no manual intervention
- **Scheduled sweep** — EventBridge reclaims stalled/expired leases every 60 seconds
- **Live "Office" dashboard** — see every agent, every task, every device, updating in real time over WebSocket

### 👥 Governance & Trust

- **Human checkpoints** — approve or deny any sensitive action from the console or your phone
- **Wallet meter** — budget cap, live spend, per-agent breakdown, automatic circuit breaker
- **Task replay** — a full timeline of every action, tool call, and policy decision behind it

### 📊 Mission Control Dashboard

- Real-time task board across the full pipeline: ready → leased → running → verifying → committed
- Plan review & editing before confirming a run
- Checkpoint approval queue, reachable from anywhere
- Wallet and device-pool views, all live

---

## 🧩 Tech Stack

### 🖥️ Frontend
- **Next.js + TypeScript** — Mission Control dashboard
- **Tailwind CSS** — styling
- **WebSocket client** — live task/agent state, no polling

### ⚙️ Backend
- **Node.js on AWS Lambda** — all business logic
- **AWS SAM** — infrastructure as code for the entire stack
- **AWS SDK for JavaScript v3** — DynamoDB, S3, Bedrock calls

### 🤖 AI
- **Amazon Bedrock (Claude)** — powers all six specialist agents
- **Amazon Bedrock Guardrails** — safety boundaries on agent output
- **AWS Cedar** — open-source policy language for agent permission boundaries

### ☁️ Infrastructure
- **Amazon DynamoDB** — task/agent state, conditional writes for the lease protocol
- **AWS Step Functions** — multi-step workflow orchestration
- **Amazon EventBridge** — scheduled lease-sweeper, cross-service events
- **Amazon ECS Fargate** — sandboxed, isolated agent execution
- **Amazon API Gateway** — REST + WebSocket APIs
- **Amazon Cognito** — authentication
- **Amazon CloudWatch** — logs & monitoring

### 🧰 Development Tools
- TypeScript, ESLint
- Git + GitHub
- AWS Amplify (frontend hosting) + AWS SAM CLI (backend deploy)

---

## 📋 Prerequisites

- Node.js ≥ 18
- npm / yarn / pnpm
- Git
- AWS CLI + AWS SAM CLI
- An AWS account with **Amazon Bedrock** model access enabled

---

## 🚀 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Master-Gamer-glitch/aws-hackathon.git
cd aws-hackathon
```

### 2️⃣ Install dependencies
```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd services/api
npm install
cd ..
```

### 3️⃣ Set up environment variables

**Frontend `.env.local`**
```bash
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_WS_URL=wss://your-ws-id.execute-api.us-east-1.amazonaws.com/dev
```

**Backend `env.json`** *(used by `sam local` / deploy)*
```json
{
  "Parameters": {
    "BEDROCK_MODEL": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "ENVIRONMENT": "dev"
  }
}
```

### 4️⃣ Configure AWS
```bash
aws configure
```
Make sure the IAM identity you configure has access to Bedrock, DynamoDB, Lambda, API Gateway, EventBridge, ECS, and Cognito — `deploy.sh` provisions all of them.

### 5️⃣ Start the development servers
```bash
# Backend — deploy or run locally via SAM
sam local start-api

# Frontend (in another terminal)
cd frontend
npm run dev
```

The app will be available at:
- **Frontend:** `http://localhost:3000`
- **Backend (local):** `http://localhost:3000` (SAM local API)

### Try it without a full setup

Open `kaam-chalau.html` directly in a browser for a minimal test client — chat-style prompt input, a live WebSocket event log, task status, and connected devices — no frontend build required.

---

## 🏃 Development Commands

**Frontend**
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint       # Run ESLint
```

**Backend**
```bash
sam build                 # Build Lambda functions
sam local start-api       # Run API locally
sam deploy --guided        # Deploy to AWS
npm test                  # Run lease-protocol unit tests
```

---

## 🚀 Deployment

### Quick Deployment (Recommended)
**Backend:** AWS SAM → Lambda + DynamoDB + API Gateway + EventBridge
**Frontend:** AWS Amplify

```bash
./deploy.sh
# or
sam build && sam deploy --guided
```
Time: ~5 minutes · Cost: ~$0.50 for testing

### Deployment Platforms

| Layer | Platform |
|---|---|
| Frontend | AWS Amplify |
| Backend | AWS SAM (Lambda + API Gateway) |
| AI | Amazon Bedrock |
| Compute isolation | Amazon ECS Fargate |

### Detailed Guides
- [`DEPLOY.md`](DEPLOY.md) — full deployment walkthrough
- [`QUICK_START.md`](QUICK_START.md) — fastest path to a running stack
- [`AIRSTREAM.md`](AIRSTREAM.md) — device pool API reference
- [`AIRSTREAM_PROD_TEST.md`](AIRSTREAM_PROD_TEST.md) — multi-device testing guide

---

## 🧪 API Overview

**Base URL**
- Development: `http://localhost:3000` (SAM local)
- Production: `https://<api-id>.execute-api.<region>.amazonaws.com/dev`

**Endpoints**

| Endpoint | Method | Description |
|---|---|---|
| `/projects/:id/outcomes` | POST | Submit a mission — Lead agent returns a draft plan |
| `/projects/:id/plan/confirm` | POST | Confirm the plan, queue tasks |
| `/projects/:id/rooms` | POST | Create an Airstream room for device pooling |
| `/projects/:id/rooms/:roomId/devices` | POST | A device joins the room, reports capabilities |
| `/projects/:id/rooms/:roomId/distribute` | POST | Distribute tasks across devices by fitness score |
| `/tasks/:id/claim` | POST | A device claims a task (lease + epoch fencing) |
| `/tasks/:id/submit` | POST | A device submits completed work (fencing-checked) |
| `/tasks/:id/replay` | GET | Full audit trail — every action, policy decision, cost |
| `/checkpoints/:id` | POST | Approve or deny a paused, sensitive action |
| `/projects/:id/wallet` | GET | Live spend vs. budget cap, per-agent breakdown |

**Example request**
```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/dev/projects/p_1/outcomes \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "Build a registration page for our event site",
    "deadline": "2026-09-22T20:00:00+05:30"
  }'
```

**Example response**
```json
{
  "planId": "pl_1",
  "estCostUsd": 0.8,
  "estMinutes": 22,
  "tasks": [
    {
      "taskId": "t_1042",
      "objective": "Build registration page",
      "ownerAgent": "engineer",
      "successCriteria": ["Form submits and validates", "Works at 375px"]
    }
  ]
}
```

---

## 🧭 Project Structure

```
aws-hackathon/
├── frontend/              # Next.js dashboard — Mission Control, task board, checkpoints, wallet
│   ├── src/
│   │   ├── components/    # Task cards, agent avatars, wallet meter, replay timeline
│   │   ├── pages/          # Dashboard, project, task detail, checkpoints, wallet
│   │   └── lib/             # API client, WebSocket hook
├── services/api/          # Lambda handlers
│   ├── handlers/
│   │   ├── tasks/          # claim, submit
│   │   ├── agents/         # lead, engineer, designer, researcher, reviewer, marketer
│   │   ├── airstream/      # rooms, devices, distribute
│   │   ├── checkpoint/     # decide
│   │   └── sweep.mjs        # lease-expiry sweeper
│   └── lib/                 # DynamoDB, Bedrock, WebSocket broadcast clients
├── worker/                 # Agent execution runtime (device-side)
├── docs/                   # Architecture, API, and integration guides
├── template.yaml            # AWS SAM template
├── samconfig.toml           # SAM deploy configuration
├── deploy.sh                 # One-command guided deployment
├── demo-ui.html               # Minimal standalone demo client
└── kaam-chalau.html           # Minimal test UI for live event/device debugging
```

---

## 📚 Documentation

**Setup & Architecture**
- [`README.md`](README.md) — you are here
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — lease/fencing protocol, Airstream scoring, data model
- [`QUICK_START.md`](QUICK_START.md) — fastest path to a running stack

**Feature Guides**
- [`AIRSTREAM.md`](AIRSTREAM.md) — device pool API reference
- [`AIRSTREAM_PROD_TEST.md`](AIRSTREAM_PROD_TEST.md) — multi-device testing
- [`BACKEND_READY.md`](BACKEND_READY.md) — shipped feature checklist & endpoint reference

**Deployment**
- [`DEPLOY.md`](DEPLOY.md) — full deployment guide

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/aws-hackathon.git
   cd aws-hackathon
   ```
2. **Create your feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** — clean, documented code, following the existing style
4. **Commit your work**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push and open a PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Contribution Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Document new endpoints/agents
- Test lease-protocol changes against the unit tests before opening a PR

---

## 📝 License

This project is licensed under the MIT License — see the [`LICENSE`](LICENSE) file for details.

---

## 🙏 Acknowledgments

**🤖 AI & Orchestration**
- [Amazon Bedrock](https://aws.amazon.com/bedrock/) — the reasoning engine behind every agent
- [AWS Cedar](https://www.cedarpolicy.com/) — open-source policy language for agent permission boundaries

**☁️ Infrastructure**
- [AWS SAM](https://aws.amazon.com/serverless/sam/) — infrastructure as code
- Amazon DynamoDB, Step Functions, EventBridge, ECS Fargate, API Gateway, Cognito, CloudWatch

**🖥️ Frontend**
- [Next.js](https://nextjs.org/) · [Tailwind CSS](https://tailwindcss.com/)

**🛠️ Development Tools**
- TypeScript · ESLint · Git · GitHub

**🌐 Inspiration**
- Real engineering orgs — the idea that a small team should be able to run like a fully-staffed one

---

## 👥 Contributors

Thank you to everyone who built Ultron:

| | |
|---|---|
| 🧭 **[@Code-Smokker](https://github.com/Code-Smokker)** | Team Lead — agent/workflow architecture, human-control design, integration |
| ⚙️ **[@Master-Gamer-glitch](https://github.com/Master-Gamer-glitch)** | Backend — APIs, agent execution flows, task routing, cloud infrastructure |
| 🎙️ **[@AayushKumarMishra-code](https://github.com/AayushKumarMishra-code)** | AI/Voice — speech input/output, agent communication, AWS AI integrations |
| 📊 **[@Inexpert-trifler](https://github.com/Inexpert-trifler)** | Data/Frontend — DynamoDB modeling, frontend integration, UI refinement |

**The Binary Brains Team** — core development team 🧠

---

## 🌟 Star the Repo

If you like what we're building — ⭐ **star this repo** to show your support and follow our journey!

Your stars help us reach more developers, get feedback, and keep improving Ultron.

---

## 📞 Support & Contact

- **GitHub Issues:** report bugs or request features

---

### 💡 Crafted with purpose by 🧠 The Binary Brains

**"Give it the work. Keep the control."**

Built for the WeMakeDevs × AWS First Commit Hackathon
