# Contributing to LocaTest

Welcome — contributions that improve localization test coverage, agent behavior, or the UI are appreciated.

---

## Development Setup

```bash
cp .env.example .env
# Fill in: GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GEMINI_MODEL

pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
uvicorn locatest.main:app --reload --port 8080
```

---

## How to Add a New Tool

1. Add a function to `locatest/tools/test_tools.py` with a Google-style docstring — ADK uses the docstring as the tool description.
2. Register the function in the `tools` list of the relevant agent in `locatest/agents/` (e.g., `test_suite_agent.py`).
3. If the tool needs fixture data, add it to `locatest/data/mock_data.py`.
4. Write a pytest test covering the new tool in `tests/test_tools.py`.

---

## How to Add a New Sub-Agent

1. Create `locatest/agents/my_agent.py` following the structure of an existing agent (e.g., `locale_agent.py`): define an `Agent` with a name, model, instruction, and tools list.
2. Register the agent in `locatest/agents/orchestrator.py` by adding it to the `sub_agents` list.
3. Add routing rules to the orchestrator's `_INSTRUCTION` string so it knows when to delegate to the new agent.

---

## How to Modify the Frontend

- Edit `frontend/src/App.jsx` (all 5 tabs live here) and `frontend/src/styles.css`.
- After any change, rebuild so FastAPI picks up the new static files:
  ```bash
  cd frontend && npm run build
  ```
  Vite outputs to `../static/`, which FastAPI serves directly.
- Hot-reload is not available in production mode; rebuild is required to see changes through the FastAPI server.

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Hindi locale validation tool
fix: correct SSE stream close on client disconnect
refactor: split RCA prompt into sub-steps
test: add coverage for simulation_agent routing
docs: update deployment section in README
chore: bump google-adk to 1.4.0
```

---

## PR Checklist

Before opening a pull request:

- [ ] All backend tests pass: `pytest`
- [ ] All frontend tests pass: `cd frontend && npm test`
- [ ] Frontend has been rebuilt: `cd frontend && npm run build`
- [ ] No `.env` file or credentials are committed
- [ ] PR description explains what changed and why

---

## Code Style

- **Python:** formatted with [black](https://black.readthedocs.io/) and linted with [ruff](https://docs.astral.sh/ruff/). Run `ruff check . && black .` before committing.
- **JavaScript/JSX:** follows the project's existing ESLint configuration. Run `cd frontend && npm run lint` to check.
