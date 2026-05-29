"""Semantic routing layer — deterministic intent classification for LocaTest queries."""
from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Routing rules
#
# Each agent entry has an ``intent_map`` dict: {intent_tag: [keyword, ...]}.
# Patterns are matched case-insensitively against the full user query.
#
# Priority tiers (matched before generic length-sorting):
#   0 — action verbs / unique identifiers (highest)
#   1 — domain nouns (medium)
#   2 — context words (lowest, fallback candidates)
# ---------------------------------------------------------------------------
_ROUTING_RULES: dict[str, dict] = {
    "test_suite_agent": {
        "intent_map": {
            # Priority -1 (super-high): test generation must win before any other rule
            "generate_tests": (-1, [
                "generate test cases", "generate test case",
                "create test cases", "create test case",
                "generate tests for", "generate test for",
                "new tests for", "new test cases for",
                "test generation",
            ]),
            "dashboard":      (0, ["dashboard", "overview", "summary", "how are we doing", "health score"]),
            "test_cases":     (1, ["test suite", "test suites", "test case", "test cases"]),
            "failures":       (1, ["failing tests", "failed tests", "failure"]),
            "generate_tests2":(0, ["generate test", "generate tests", "create test"]),
            "firmware":       (1, ["firmware build", "release blocker", "firmware"]),
            "overview":       (2, ["automation coverage", "pass rate"]),
        },
    },
    "locale_agent": {
        "intent_map": {
            "locale_health": (1, [
                "locale", "pt-br", "ar-sa", "de-de", "fr-fr", "ja-jp", "ko-kr",
                "zh-cn", "hi-in", "es-mx", "en-us",
                "portuguese", "arabic", "german", "french", "japanese", "korean",
                "chinese", "hindi", "spanish",
            ]),
            "coverage":  (1, ["coverage", "automation progress", "automation target", "latam", "emea", "apac"]),
            "sprint":    (2, ["sprint"]),
            "roadmap":   (0, ["roadmap"]),
            "comparison": (0, ["comparison", "compare locales", "compare"]),
        },
    },
    "simulation_agent": {
        "intent_map": {
            "simulate":       (0, ["simulate", "run simulation", "run the regression", "run the smoke"]),
            "regression":     (1, ["regression"]),
            "smoke":          (0, ["smoke test"]),
            "hil":            (0, ["human-in-the-loop", "human in the loop", "hil"]),
            "approval_queue": (0, ["approval queue", "pending approval"]),
        },
    },
    "rca_agent": {
        "intent_map": {
            "rca":           (0, ["root cause analysis", "root cause", "why is failing", "why failing", "why did", "why are", "why is", "rca"]),
            "buganizer":     (0, ["buganizer"]),
            "file_issue":    (0, ["file to buganizer", "file issue", "create issue", "bug report"]),
            "approve_reject": (0, ["reject", "approve"]),
        },
    },
}


def _build_compiled_rules() -> list[tuple[re.Pattern, str, str]]:
    """Return a flat sorted list of (compiled_regex, agent, intent).

    Sort key: (priority_tier ASC, pattern_length DESC) so that high-priority
    action verbs are matched first, and within the same priority the longer
    (more specific) pattern wins.
    """
    entries: list[tuple[int, int, re.Pattern, str, str]] = []

    for agent, rules in _ROUTING_RULES.items():
        seen: set[str] = set()
        for intent, (priority, patterns) in rules["intent_map"].items():
            for pattern_str in patterns:
                if pattern_str in seen:
                    continue
                seen.add(pattern_str)
                regex = re.compile(
                    r"(?<![a-zA-Z0-9\-])" + re.escape(pattern_str) + r"(?![a-zA-Z0-9\-])",
                    re.IGNORECASE,
                )
                # Sort key: priority ascending, length descending (negate length)
                entries.append((priority, -len(pattern_str), regex, agent, intent))

    entries.sort(key=lambda e: (e[0], e[1]))
    return [(regex, agent, intent) for _, _, regex, agent, intent in entries]


_COMPILED_RULES: list[tuple[re.Pattern, str, str]] = _build_compiled_rules()


# ---------------------------------------------------------------------------
# SemanticRouter
# ---------------------------------------------------------------------------

class SemanticRouter:
    """Deterministic keyword-based router for LocaTest agent queries.

    Classifies a free-text user query into an agent name and intent tag
    without any ML dependencies — pure Python regex / string matching.
    """

    def __init__(self) -> None:
        # Reference the module-level compiled rules (built once at import time).
        self._compiled = _COMPILED_RULES

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    def route(self, query: str) -> dict:
        """Classify *query* and return routing metadata.

        Returns:
            {
                "agent":      str,   # sub-agent name
                "intent":     str,   # intent tag
                "confidence": str,   # "high" | "low"
            }
        """
        query = query.strip()
        if not query:
            return {"agent": "test_suite_agent", "intent": "general", "confidence": "low"}

        for regex, agent, intent in self._compiled:
            if regex.search(query):
                return {"agent": agent, "intent": intent, "confidence": "high"}

        # Fallback
        return {"agent": "test_suite_agent", "intent": "general", "confidence": "low"}

    def hint(self, query: str) -> str:
        """Return a routing hint string to prepend to the user message.

        Example:
            "[ROUTE: locale_agent | intent: locale_health]"
        """
        result = self.route(query)
        return f"[ROUTE: {result['agent']} | intent: {result['intent']}]"
