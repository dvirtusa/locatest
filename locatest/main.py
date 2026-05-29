"""FastAPI app — SSE streaming endpoint, REST helpers, and static UI serving."""
from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger("locatest").setLevel(logging.INFO)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from sse_starlette.sse import EventSourceResponse

from locatest.agents.orchestrator import build_orchestrator
from locatest.config.settings import settings
from locatest.routing.semantic_router import SemanticRouter
from locatest.data.mock_data import (
    BUGANIZER_ISSUES, LOCALES, RCA_REPORTS,
    SIMULATION_SCENARIOS, SPRINTS, TEST_CASES, TEST_SUITES,
    get_dashboard_metrics,
)
from locatest.tools.test_tools import approve_issue_filing

# ── Semantic router ────────────────────────────────────────────────────────
_router = SemanticRouter()

# ── Agent bootstrap ────────────────────────────────────────────────────────
_session_service = InMemorySessionService()
_APP_NAME = "locatest"

_runner = Runner(
    agent=build_orchestrator(),
    app_name=_APP_NAME,
    session_service=_session_service,
)

# ── Tool → SSE card mapping ────────────────────────────────────────────────
_TOOL_TO_CARD: dict[str, str] = {
    "get_dashboard_summary":     "dashboard.summary",
    "get_test_suite_summary":    "suite.summary",
    "get_test_cases":            "test.list",
    "get_failing_tests":         "test.failures",
    "search_test_cases":         "test.search",
    "get_locale_coverage":       "locale.coverage",
    "get_locale_comparison":     "locale.comparison",
    "get_sprint_summary":        "sprint.summary",
    "get_automation_roadmap":    "roadmap.overview",
    "run_test_simulation":       "simulation.result",
    "get_rca_report":            "rca.report",
    "create_buganizer_issue":    "issue.draft",
    "approve_issue_filing":      "issue.filed",
    "get_hil_pending_approvals": "hil.queue",
    "generate_test_cases":       "test.generated",
    "get_generated_tests":       "test.generated",
    "get_firmware_builds":       "firmware.list",
}

_PROGRESS_TOOLS: dict[str, str] = {
    "get_dashboard_summary":     "Loading dashboard…",
    "get_test_suite_summary":    "Fetching suite stats…",
    "get_test_cases":            "Loading test cases…",
    "get_failing_tests":         "Analysing failures…",
    "search_test_cases":         "Searching test cases…",
    "get_locale_coverage":       "Checking locale coverage…",
    "get_sprint_summary":        "Loading sprint data…",
    "get_automation_roadmap":    "Fetching roadmap…",
    "run_test_simulation":       "Running simulation…",
    "get_rca_report":            "Generating RCA report…",
    "create_buganizer_issue":    "Drafting Buganizer issue…",
    "approve_issue_filing":      "Processing approval…",
    "get_hil_pending_approvals": "Checking approval queue…",
    "generate_test_cases":       "Generating test cases…",
    "get_firmware_builds":       "Loading firmware builds…",
    "get_generated_tests":       "Loading generated tests…",
}

app = FastAPI(title="LocaTest Agent")


# ── SSE streaming endpoint ─────────────────────────────────────────────────
@app.post("/run_sse")
async def run_sse(request: Request) -> EventSourceResponse:
    """Stream agent responses as Server-Sent Events.

    Body: { "message": str, "session_id": str?, "user_id": str? }

    SSE event types:
        message  { type: "message_delta", text, session_id, done }
        message  { type: "progress", tool, label, session_id }
        message  { type: "card", card_type, data, session_id }
        error    { type: "error", message }
    """
    body = await request.json()
    user_message: str = body.get("message", "")
    session_id: str   = body.get("session_id") or uuid.uuid4().hex
    user_id: str      = body.get("user_id", "default_user")

    logger.info("[SSE] session=%s  msg=%r", session_id[:8], user_message[:100])

    # Prepend semantic routing hint so the orchestrator has a strong signal
    if user_message.strip():
        routing_hint = _router.hint(user_message)
        routed_message = f"{routing_hint}\n\nUser: {user_message}"
        logger.info("[SSE] routing hint: %s", routing_hint)
    else:
        routed_message = user_message

    existing = await _session_service.get_session(
        app_name=_APP_NAME, user_id=user_id, session_id=session_id,
    )
    if existing is None:
        await _session_service.create_session(
            app_name=_APP_NAME, user_id=user_id, session_id=session_id,
        )

    content = types.Content(
        role="user",
        parts=[types.Part(text=routed_message)],
    )

    async def event_generator():
        try:
            async for event in _runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=content,
            ):
                if not event.content:
                    continue

                for part in event.content.parts:
                    func_call = getattr(part, "function_call", None)
                    func_resp = getattr(part, "function_response", None)

                    if func_call and getattr(func_call, "name", None):
                        tool_name = func_call.name
                        label = _PROGRESS_TOOLS.get(tool_name)
                        if label:
                            yield {
                                "event": "message",
                                "data": json.dumps({
                                    "type": "progress",
                                    "tool": tool_name,
                                    "label": label,
                                    "session_id": session_id,
                                }),
                            }

                    elif func_resp and getattr(func_resp, "name", None):
                        tool_name = func_resp.name
                        raw = getattr(func_resp, "response", {})
                        data = raw if isinstance(raw, dict) else {"result": raw}

                        card_type = _TOOL_TO_CARD.get(tool_name)
                        if card_type:
                            yield {
                                "event": "message",
                                "data": json.dumps({
                                    "type": "card",
                                    "card_type": card_type,
                                    "data": data,
                                    "session_id": session_id,
                                }),
                            }

                    elif part.text:
                        yield {
                            "event": "message",
                            "data": json.dumps({
                                "type": "message_delta",
                                "text": part.text,
                                "session_id": session_id,
                                "done": False,
                            }),
                        }

        except Exception as exc:
            logger.exception("[SSE] error: %s", exc)
            yield {
                "event": "error",
                "data": json.dumps({"type": "error", "message": str(exc)}),
            }
            return

        # Done sentinel
        yield {
            "event": "message",
            "data": json.dumps({
                "type": "message_delta",
                "text": "",
                "session_id": session_id,
                "done": True,
            }),
        }

    return EventSourceResponse(event_generator())


# ── REST data endpoints (for initial page load) ────────────────────────────

@app.get("/api/dashboard")
def api_dashboard() -> dict:
    return get_dashboard_metrics()


@app.get("/api/suites")
def api_suites() -> dict:
    return {"suites": list(TEST_SUITES.values())}


@app.get("/api/locales")
def api_locales() -> dict:
    return {"locales": list(LOCALES.values())}


@app.get("/api/sprints")
def api_sprints() -> dict:
    return {"sprints": list(SPRINTS.values())}


@app.get("/api/test_cases")
def api_test_cases(
    suite: str = "",
    locale: str = "",
    status: str = "",
    limit: int = 50,
) -> dict:
    results = list(TEST_CASES)
    if suite:
        results = [tc for tc in results if suite.lower() in tc["suite"].lower()]
    if locale:
        results = [tc for tc in results if locale.lower() in tc["locale"].lower()]
    if status:
        results = [tc for tc in results if tc["status"].upper() == status.upper()]
    return {"cases": results[:limit], "count": len(results)}


@app.get("/api/rca")
def api_rca() -> dict:
    return {"reports": RCA_REPORTS}


@app.get("/api/issues")
def api_issues() -> dict:
    return {"issues": BUGANIZER_ISSUES}


@app.get("/api/simulations")
def api_simulations() -> dict:
    return {"simulations": SIMULATION_SCENARIOS}


@app.post("/api/approve")
async def api_approve(request: Request) -> dict:
    """HIL approval endpoint — called directly from the UI approve buttons."""
    body = await request.json()
    issue_id = body.get("issue_id", "")
    approved = bool(body.get("approved", False))
    notes    = body.get("notes", "")
    return approve_issue_filing(issue_id, approved, notes)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "app": "locatest"}


# ── Serve static HTML SPA ──────────────────────────────────────────────────
static_dir = Path(settings.STATIC_FILES_DIR)
if static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="ui")
