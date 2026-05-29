# LocaTest — AI-Powered Localization QA Platform

A multi-agent AI platform for Google Nest firmware localization quality assurance, built with Google ADK and Gemini 2.5 Flash.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        User                             │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              React 18 SPA (Frontend)                    │
│   Workspace · Simulation · RCA · Test Gen · Builds      │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP + SSE (/api/chat)
                            ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI + SSE Backend                     │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│            locatest_orchestrator (ADK Agent)            │
│                  ┌──────────────────┐                   │
│                  │ Gemini 2.5 Flash │                   │
│                  │   (Vertex AI)    │                   │
│                  └──────────────────┘                   │
└──────┬──────────┬──────────┬───────────────┬────────────┘
       │          │          │               │
       ▼          ▼          ▼               ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐
│test_suite│ │ locale │ │simulation│ │  rca    │
│  _agent  │ │ _agent │ │  _agent  │ │ _agent  │
└────┬─────┘ └───┬────┘ └────┬─────┘ └────┬────┘
     │           │           │             │
     └───────────┴───────────┴─────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   ADK Tools (18 tools)   │
              │  locatest/tools/         │
              │  test_tools.py           │
              └──────────────────────────┘
```

---

## Features

- **Workspace** — Agent chat feed with real-time SSE streaming, session context panel, and Human-in-the-Loop (HIL) overlay for agent intervention
- **Simulation** — Run and inspect test scenarios step-by-step, browse execution traces, use the debug inspector, and apply HIL interventions mid-run
- **RCA & Issues** — Root cause analysis of localization failures with automated Buganizer issue filing
- **Test Generation** — AI-powered form for generating new localization test cases from natural language prompts
- **Firmware Builds** — Per-build quality statistics, locale-level breakdown, and a dedicated agent chat panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SSE streaming |
| AI Framework | Google ADK (`google-adk==1.3.0`) |
| Model | Gemini 2.5 Flash via Vertex AI |
| Frontend | React 18, Vite |
| Deployment | GCP Cloud Run, Cloud Build, GitHub Actions |
| Testing | pytest (backend), Vitest (frontend) |

---

## Quick Start (Local Dev)

```bash
# 1. Configure environment
cp .env.example .env
# Fill in: GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GEMINI_MODEL

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Build the frontend
cd frontend && npm install && npm run build && cd ..

# 4. Start the server
uvicorn locatest.main:app --reload --port 8080
```

Open http://localhost:8080

---

## Running Tests

**Backend:**
```bash
pytest
```

**Frontend:**
```bash
cd frontend && npm test
```

---

## Deployment

**Automatic:** Push to `main` → GitHub Actions triggers Cloud Build → deploys to Cloud Run.

**Manual:**
```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=gcp-poc-investment-219973-ce \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

**Live URL:** https://locatest-agent-kbzorzbpaa-uc.a.run.app

GCP project: `gcp-poc-investment-219973-ce` · Region: `us-central1` · Service: `locatest-agent`

---

## Project Structure

```
LocaTest/
├── locatest/
│   ├── main.py              # FastAPI app + SSE /api/chat endpoint
│   ├── agents/              # Orchestrator + 4 sub-agents
│   ├── tools/
│   │   └── test_tools.py    # 18 ADK tools
│   ├── data/
│   │   └── mock_data.py     # Nest-themed mock data
│   └── config/
│       └── settings.py
├── frontend/
│   └── src/
│       ├── App.jsx          # React SPA (~2400 lines, all 5 tabs)
│       └── styles.css
├── static/                  # Vite build output (served by FastAPI)
├── tests/                   # pytest backend + Vitest frontend
├── Dockerfile               # Multi-stage: Node build → Python serve
├── cloudbuild.yaml          # GCP Cloud Build + Cloud Run deploy
└── .github/workflows/
    └── deploy.yml           # GitHub Actions → Cloud Build on push to main
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

---

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.
