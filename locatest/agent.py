"""ADK entry point — exposes root_agent for `adk web` discovery."""
import os
os.environ.setdefault("ENVIRONMENT", "adk")

from locatest.agents.orchestrator import build_orchestrator
root_agent = build_orchestrator()
