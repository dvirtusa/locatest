"""ADK-compatible tools that query the mock data semantic layer.

All functions return plain dicts/lists so ADK can serialise them as
JSON tool responses. Functions are imported directly as tool references
in the agent constructors.
"""
from __future__ import annotations

import random
from typing import Optional

from locatest.data.mock_data import (
    BUGANIZER_ISSUES,
    FIRMWARE_BUILDS,
    GENERATED_TEST_CASES,
    LOCALES,
    RCA_REPORTS,
    ROADMAP,
    SIMULATION_SCENARIOS,
    SPRINTS,
    TEST_CASES,
    TEST_SUITES,
    get_dashboard_metrics,
    register_generated_test,
)


# ─────────────────────────────────────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────────────────────────────────────

def get_dashboard_summary() -> dict:
    """Return an overall health summary of the LocaTest localization QA system.

    Includes: total test cases, automation coverage %, pass rate,
    active sprint stats, pending approvals, and roadmap progress.
    """
    return get_dashboard_metrics()


# ─────────────────────────────────────────────────────────────────────────────
# Test Suites
# ─────────────────────────────────────────────────────────────────────────────

def get_test_suite_summary(suite_name: str = "") -> dict:
    """Return statistics for one or all test suites.

    Args:
        suite_name: Partial or full suite name (e.g. 'checkout', 'navigation').
                    Leave blank to return all suites.
    Returns:
        dict with 'suites' list and 'totals' aggregate.
    """
    if suite_name:
        key = suite_name.lower().replace(" ", "_").replace("&", "").replace("-", "_")
        # fuzzy match
        matches = {
            k: v for k, v in TEST_SUITES.items()
            if key in k or key in v["name"].lower()
        }
    else:
        matches = TEST_SUITES

    suites = []
    for k, s in matches.items():
        suites.append({
            "id": s["id"],
            "name": s["name"],
            "total": s["total"],
            "automated": s["automated"],
            "manual": s["manual"],
            "passed": s["passed"],
            "failed": s["failed"],
            "automation_pct": s["automation_pct"],
            "pass_rate": s["pass_rate"],
            "health_score": s["health_score"],
            "priority": s["priority"],
            "critical_locales": s["critical_locales"],
            "automation_target_pct": s["automation_target_pct"],
        })

    return {
        "suites": suites,
        "totals": {
            "total": sum(s["total"] for s in matches.values()),
            "automated": sum(s["automated"] for s in matches.values()),
            "failed": sum(s["failed"] for s in matches.values()),
            "avg_health": round(
                sum(s["health_score"] for s in matches.values()) / max(len(matches), 1), 1
            ),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Test Cases
# ─────────────────────────────────────────────────────────────────────────────

def get_test_cases(
    suite: str = "",
    locale: str = "",
    status: str = "",
    priority: str = "",
    limit: int = 20,
) -> dict:
    """Return a filtered list of individual test cases.

    Args:
        suite:    Filter by suite name or id (e.g. 'checkout').
        locale:   Filter by locale code (e.g. 'pt-BR').
        status:   Filter by status: PASS | FAIL | SKIP.
        priority: Filter by priority: P0 | P1 | P2 | P3.
        limit:    Max results (default 20).
    Returns:
        dict with 'cases' list and 'count'.
    """
    results = list(TEST_CASES)

    if suite:
        s = suite.lower()
        results = [tc for tc in results if s in tc["suite"] or s in tc.get("name", "").lower()]
    if locale:
        results = [tc for tc in results if locale.lower() in tc["locale"].lower()]
    if status:
        results = [tc for tc in results if tc["status"].upper() == status.upper()]
    if priority:
        results = [tc for tc in results if tc.get("priority", "").upper() == priority.upper()]

    return {
        "cases": results[:limit],
        "count": len(results),
        "filters_applied": {
            "suite": suite, "locale": locale,
            "status": status, "priority": priority,
        },
    }


def get_failing_tests(
    locale: str = "",
    suite: str = "",
    priority: str = "",
    sprint: str = "",
) -> dict:
    """Return all currently failing test cases, optionally filtered.

    Args:
        locale:   Locale code to filter (e.g. 'pt-BR').
        suite:    Suite name to filter (e.g. 'checkout').
        priority: Priority level to filter (P0/P1/P2/P3).
        sprint:   Sprint name to filter (e.g. 'Sprint 43').
    Returns:
        dict with 'failures' list, grouped counts, and severity breakdown.
    """
    failures = [tc for tc in TEST_CASES if tc["status"] == "FAIL"]

    if locale:
        failures = [tc for tc in failures if locale.lower() in tc["locale"].lower()]
    if suite:
        failures = [tc for tc in failures if suite.lower() in tc["suite"].lower()]
    if priority:
        failures = [tc for tc in failures if tc.get("priority", "").upper() == priority.upper()]
    if sprint:
        failures = [tc for tc in failures if sprint.lower() in tc.get("sprint", "").lower()]

    p0 = [tc for tc in failures if tc.get("priority") == "P0"]
    p1 = [tc for tc in failures if tc.get("priority") == "P1"]

    return {
        "failures": failures,
        "total_failures": len(failures),
        "p0_count": len(p0),
        "p1_count": len(p1),
        "locales_affected": list({tc["locale"] for tc in failures}),
        "suites_affected": list({tc["suite"] for tc in failures}),
    }


def search_test_cases(query: str) -> dict:
    """Semantic search across test cases by keyword, error message, or tag.

    Args:
        query: Free-text query (e.g. 'missing translation pt-BR', 'RTL layout').
    Returns:
        dict with 'results' list and relevance summary.
    """
    q = query.lower()
    scored = []
    for tc in TEST_CASES:
        score = 0
        fields = [
            tc.get("name", ""), tc.get("description", ""),
            tc.get("error", ""), tc.get("locale", ""), tc.get("suite", ""),
            " ".join(tc.get("tags", [])), tc.get("actual", ""), tc.get("expected", ""),
        ]
        for field in fields:
            if q in field.lower():
                score += 2
            for word in q.split():
                if word in field.lower():
                    score += 1
        if score > 0:
            scored.append((score, tc))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = [tc for _, tc in scored[:15]]

    return {
        "results": results,
        "count": len(results),
        "query": query,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Locales
# ─────────────────────────────────────────────────────────────────────────────

def get_locale_coverage(locale: str = "") -> dict:
    """Return coverage and health stats for one or all locales.

    Args:
        locale: Locale code (e.g. 'pt-BR') or blank for all.
    Returns:
        dict with locale stats, health scores, and gap analysis.
    """
    if locale:
        lc = locale.upper()
        matches = {
            k: v for k, v in LOCALES.items()
            if k.upper() == lc or lc in v["name"].upper()
        }
        # fallback to partial match
        if not matches:
            matches = {
                k: v for k, v in LOCALES.items()
                if locale.lower() in k.lower() or locale.lower() in v["name"].lower()
            }
    else:
        matches = LOCALES

    locales_out = []
    for code, d in matches.items():
        locales_out.append({
            "code": code,
            "name": d["name"],
            "region": d["region"],
            "total": d["total"],
            "automated": d["automated"],
            "automation_pct": d["automation_pct"],
            "passed": d["passed"],
            "failed": d["failed"],
            "pass_rate": d["pass_rate"],
            "health_score": d["health_score"],
            "active_issues": d["active_issues"],
            "critical_issues": d["critical_issues"],
            "trend": d["trend"],
            "notes": d.get("notes", ""),
        })

    locales_out.sort(key=lambda x: x["health_score"])  # worst first

    return {
        "locales": locales_out,
        "worst_locale": locales_out[0] if locales_out else None,
        "total_locales": len(locales_out),
        "locales_below_90": [l for l in locales_out if l["health_score"] < 90],
    }


def get_locale_comparison(locales: str) -> dict:
    """Compare coverage metrics across a comma-separated list of locales.

    Args:
        locales: Comma-separated locale codes (e.g. 'pt-BR,es-MX,de-DE').
    Returns:
        Side-by-side comparison dict with ranking by health score.
    """
    codes = [c.strip() for c in locales.split(",")]
    comparison = []
    for code in codes:
        if code in LOCALES:
            d = LOCALES[code]
            comparison.append({
                "code": code,
                "name": d["name"],
                "automation_pct": d["automation_pct"],
                "pass_rate": d["pass_rate"],
                "health_score": d["health_score"],
                "failed": d["failed"],
                "active_issues": d["active_issues"],
                "trend": d["trend"],
            })

    comparison.sort(key=lambda x: x["health_score"], reverse=True)
    return {
        "comparison": comparison,
        "best": comparison[0] if comparison else None,
        "worst": comparison[-1] if comparison else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Sprints
# ─────────────────────────────────────────────────────────────────────────────

def get_sprint_summary(sprint: str = "") -> dict:
    """Return test results for one or all sprints.

    Args:
        sprint: Sprint name (e.g. 'Sprint 43') or blank for all.
    Returns:
        dict with sprint stats and trend analysis.
    """
    if sprint:
        key = next(
            (k for k in SPRINTS if sprint.lower() in k.lower()),
            None,
        )
        matches = {key: SPRINTS[key]} if key else {}
    else:
        matches = SPRINTS

    sprints_out = []
    for name, s in matches.items():
        sprints_out.append({
            "name": name,
            "start": s["start"], "end": s["end"],
            "total_run": s["total_run"],
            "passed": s["passed"], "failed": s["failed"],
            "new_failures": s["new_failures"], "fixed": s["fixed"],
            "automation_pct": s["automation_pct_at_end"],
            "locales_with_failures": s["locales_with_failures"],
            "highlights": s["highlights"],
            "status": s["status"],
        })

    return {
        "sprints": sprints_out,
        "active_sprint": next(
            (s for s in sprints_out if s["status"] == "active"), None
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Automation Roadmap
# ─────────────────────────────────────────────────────────────────────────────

def get_automation_roadmap() -> dict:
    """Return the 5-month automation roadmap and current progress vs. targets.

    Returns:
        dict with monthly milestones, actual vs target %, risks, and forecast.
    """
    current = next((r for r in ROADMAP if r["status"] == "in_progress"), None)
    completed = [r for r in ROADMAP if r["status"] == "completed"]
    planned   = [r for r in ROADMAP if r["status"] == "planned"]

    return {
        "roadmap": ROADMAP,
        "total_months": len(ROADMAP),
        "current_month": current,
        "completed_months": len(completed),
        "automation_target_pct": 70.0,
        "current_pct": current["actual_pct"] if current else ROADMAP[-2]["actual_pct"],
        "on_track": all(
            r.get("variance", 0) >= -1.0 for r in completed
        ),
        "overall_variance": sum(r.get("variance", 0) for r in completed),
        "risks": [r.get("risk") for r in ROADMAP if r.get("risk")],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Simulation
# ─────────────────────────────────────────────────────────────────────────────

def run_test_simulation(
    suite: str,
    locale: str,
    scenario_type: str = "regression",
) -> dict:
    """Simulate running a test suite for a given locale and return results.

    This triggers the simulation engine. For scenarios with failures,
    a HIL (Human-in-the-Loop) checkpoint is automatically raised.

    Args:
        suite:         Suite name (e.g. 'checkout') or 'all'.
        locale:        Locale code (e.g. 'pt-BR').
        scenario_type: Type of run — regression | smoke | full_regression.
    Returns:
        dict with simulation results, failure list, and HIL status.
    """
    # Check if a pre-run scenario matches
    existing = next(
        (s for s in SIMULATION_SCENARIOS
         if suite.lower() in s["suite"].lower()
         and locale.lower() in s["locale"].lower()),
        None,
    )

    if existing:
        result = dict(existing)
    else:
        # Generate synthetic result
        suite_data  = next(
            (v for k, v in TEST_SUITES.items() if suite.lower() in k), None
        )
        locale_data = LOCALES.get(locale, {})
        total = min(suite_data["total"] if suite_data else 50, 100)
        fail_rate = locale_data.get("failed", 0) / max(locale_data.get("total", 1800), 1)
        failed = round(total * fail_rate)
        passed = total - failed

        result = {
            "id": f"SIM-{random.randint(100,999)}",
            "name": f"{suite.title()} {scenario_type.replace('_',' ').title()} — {locale}",
            "suite": suite, "locale": locale, "type": scenario_type,
            "total_cases": total, "passed": passed, "failed": failed,
            "duration_seconds": total * 3,
            "status": "completed",
            "hil_triggered": failed > 0,
            "hil_reason": "Failures detected — RCA required before filing." if failed > 0 else None,
            "rca_id": None,
            "run_at": "2026-05-28T12:00:00",
        }

    failures = [
        tc for tc in TEST_CASES
        if tc["status"] == "FAIL"
        and suite.lower() in tc["suite"].lower()
        and locale.lower() in tc["locale"].lower()
    ]

    result["failure_details"] = failures
    result["hil_action_required"] = result.get("hil_triggered", False)

    return result


# ─────────────────────────────────────────────────────────────────────────────
# RCA
# ─────────────────────────────────────────────────────────────────────────────

def get_rca_report(test_case_id: str = "", issue_id: str = "") -> dict:
    """Return an RCA report for failing test cases or a Buganizer issue.

    Args:
        test_case_id: Test case ID (e.g. 'LOC-RG-11198').
        issue_id:     Buganizer issue ID (e.g. 'b/337821049') or RCA ID.
    Returns:
        dict with root cause, proposed fix, confidence, and Buganizer draft.
    """
    report = None

    if test_case_id:
        report = next(
            (r for r in RCA_REPORTS if test_case_id in r["test_cases"]),
            None,
        )
    if not report and issue_id:
        report = next(
            (r for r in RCA_REPORTS
             if issue_id in r.get("buganizer_draft", {}).get("id", "")
             or issue_id == r["id"]),
            None,
        )
    if not report and RCA_REPORTS:
        report = RCA_REPORTS[0]

    if not report:
        return {"error": "No RCA report found for the given identifiers."}

    return {
        "rca": report,
        "test_cases": [
            tc for tc in TEST_CASES if tc["id"] in report["test_cases"]
        ],
        "buganizer_issue": next(
            (i for i in BUGANIZER_ISSUES
             if i["id"] == report["buganizer_draft"]["id"]),
            None,
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Buganizer / Issue Filing
# ─────────────────────────────────────────────────────────────────────────────

def create_buganizer_issue(
    title: str,
    severity: str,
    component: str,
    test_case_ids: str,
    rca_id: str = "",
    assignee: str = "",
) -> dict:
    """Draft a new Buganizer issue from an RCA report. Requires HIL approval before filing.

    Args:
        title:         Issue title.
        severity:      P0 | P1 | P2 | P3.
        component:     Android component path (e.g. Android/Checkout/Localization).
        test_case_ids: Comma-separated test case IDs.
        rca_id:        RCA report ID to attach.
        assignee:      Developer email or @handle.
    Returns:
        dict with draft issue preview and HIL approval required flag.
    """
    existing = next(
        (i for i in BUGANIZER_ISSUES if rca_id and rca_id in (i.get("rca_id") or "")),
        None,
    )

    if existing:
        issue = dict(existing)
        issue["status"] = "DRAFT"
    else:
        import uuid
        issue = {
            "id": f"b/{random.randint(330000000, 339999999)}",
            "title": title,
            "severity": severity,
            "component": component,
            "assignee": assignee or "@unassigned",
            "reporter": "locatest-agent@google.com",
            "test_cases": [t.strip() for t in test_case_ids.split(",")],
            "rca_id": rca_id,
            "status": "DRAFT",
            "approved": False,
        }

    return {
        "issue": issue,
        "hil_required": True,
        "hil_message": (
            "Issue drafted successfully. **Human approval is required** before this issue "
            "is filed to Buganizer. Review the details and click 'Approve & File'."
        ),
        "preview_url": f"https://buganizer.corp.google.com/issues/{issue['id'].replace('b/', '')}",
    }


def approve_issue_filing(issue_id: str, approved: bool, notes: str = "") -> dict:
    """Record a HIL approval or rejection for a pending Buganizer issue.

    Args:
        issue_id: Buganizer issue ID (e.g. 'b/337821049').
        approved: True to approve and file, False to reject.
        notes:    Optional reviewer notes.
    Returns:
        dict with action result and next steps.
    """
    issue = next(
        (i for i in BUGANIZER_ISSUES if i["id"] == issue_id), None
    )

    if not issue:
        return {"error": f"Issue {issue_id} not found."}

    if approved:
        issue["approved"] = True
        issue["status"] = "FILED"
        return {
            "result": "approved",
            "issue_id": issue_id,
            "message": f"Issue {issue_id} filed successfully to Buganizer. Assignee notified.",
            "filed_at": "2026-05-28T12:30:00",
            "notes": notes,
            "next_steps": [
                "Developer assigned and notified.",
                "Fix expected by end of sprint.",
                "Re-run failing test cases after fix lands.",
            ],
        }
    else:
        issue["status"] = "REJECTED"
        return {
            "result": "rejected",
            "issue_id": issue_id,
            "message": f"Issue {issue_id} rejected. Not filed. RCA returned for revision.",
            "notes": notes,
            "next_steps": ["Revise RCA or test case details.", "Re-submit for approval."],
        }


def get_hil_pending_approvals() -> dict:
    """Return all items currently awaiting Human-in-the-Loop approval.

    Returns:
        dict with pending RCAs, draft issues, and simulation decisions.
    """
    pending_issues = [i for i in BUGANIZER_ISSUES if not i["approved"] and i["status"] == "DRAFT"]
    pending_rcas   = [r for r in RCA_REPORTS if r["status"] == "pending_approval"]

    return {
        "pending_issues": pending_issues,
        "pending_rcas": pending_rcas,
        "total_pending": len(pending_issues) + len(pending_rcas),
        "requires_action": len(pending_issues) + len(pending_rcas) > 0,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Firmware Builds
# ─────────────────────────────────────────────────────────────────────────────

def get_firmware_builds(device: str = "", status: str = "") -> dict:
    """Return Nest firmware builds currently under test.

    Args:
        device: Filter by device name (e.g. 'Nest Hub', 'Nest Thermostat').
        status: Filter by status — QA | staging | released.
    Returns:
        dict with builds list and release blocker summary.
    """
    builds = list(FIRMWARE_BUILDS.values())
    if device:
        builds = [b for b in builds if device.lower() in b["device"].lower()]
    if status:
        builds = [b for b in builds if b["status"].lower() == status.lower()]

    return {
        "builds": builds,
        "release_blockers": [b for b in builds if b.get("release_blocker")],
        "blocker_count": sum(1 for b in builds if b.get("release_blocker")),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Test Generation
# ─────────────────────────────────────────────────────────────────────────────

def generate_test_cases(
    feature_name: str,
    suite: str,
    locales: str = "pt-BR,es-MX,de-DE,fr-FR,ja-JP",
    device: str = "Nest Hub (2nd gen)",
    firmware: str = "",
    priority: str = "P1",
    description: str = "",
) -> dict:
    """Generate localization test cases for a new Nest UI feature.

    Creates test case stubs covering all specified locales for the given feature.
    Generated tests are added to the live test registry and appear in the workflow.

    Args:
        feature_name: Human-readable feature name (e.g. 'Sleep Sounds Night Mode').
        suite:        Target test suite (e.g. 'home_screen', 'assistant_ui').
        locales:      Comma-separated locale codes to generate tests for.
        device:       Nest device the feature targets.
        firmware:     Firmware version (optional, defaults to current sprint build).
        priority:     Default priority for generated tests: P0 | P1 | P2.
        description:  Optional feature description / acceptance criteria.
    Returns:
        dict with list of generated test cases, count, and workflow integration status.
    """
    import uuid
    from datetime import datetime

    locale_list = [l.strip() for l in locales.split(",")]
    if not firmware:
        firmware = "4.1.0.12-rc3" if "hub" in device.lower() else "6.4.0.3-rc1"

    # Derive suite key
    suite_key = suite.lower().replace(" ", "_").replace("&", "").replace("-", "_")
    suite_meta = next(
        (v for k, v in TEST_SUITES.items() if suite_key in k or suite_key in v["name"].lower()),
        {"key_prefix": "feature.", "priority": priority},
    )
    key_prefix = suite_meta.get("key_prefix", "feature.")

    # Template test case patterns for localization
    patterns = [
        {
            "name_template": "{feature} — primary label / CTA",
            "key_suffix": "primary_label",
            "description_template": "Verify the main '{feature}' CTA or label is correctly translated.",
            "tags": ["cta", "label"],
        },
        {
            "name_template": "{feature} — confirmation dialog",
            "key_suffix": "confirm_dialog",
            "description_template": "Verify confirmation dialog text for '{feature}' is translated.",
            "tags": ["dialog", "confirmation"],
        },
        {
            "name_template": "{feature} — error / empty state",
            "key_suffix": "error_state",
            "description_template": "Verify error and empty state messages for '{feature}' are translated.",
            "tags": ["error-state", "empty-state"],
        },
        {
            "name_template": "{feature} — accessibility labels",
            "key_suffix": "a11y_label",
            "description_template": "Verify accessibility (content description) labels for '{feature}' are translated.",
            "tags": ["accessibility", "a11y"],
        },
    ]

    generated = []
    now = datetime.utcnow().isoformat()

    for locale in locale_list:
        for pattern in patterns:
            tc_id = f"LOC-GEN-{uuid.uuid4().hex[:6].upper()}"
            key_name = f"{key_prefix}{feature_name.lower().replace(' ', '_')}.{pattern['key_suffix']}"
            tc = {
                "id": tc_id,
                "suite": suite_key,
                "locale": locale,
                "device": device,
                "firmware": firmware,
                "name": pattern["name_template"].format(feature=feature_name) + f" — {locale}",
                "description": pattern["description_template"].format(feature=feature_name),
                "expected": f"[{locale} translation of key: {key_name}]",
                "actual": None,
                "status": "PENDING",
                "type": "automated",
                "priority": priority,
                "sprint": "Sprint 44",
                "string_key": key_name,
                "duration_ms": None,
                "last_run": None,
                "created_by": "locatest-agent",
                "created_at": now,
                "component": f"{device.replace(' ', '')}/{suite_key}/Localization",
                "tags": ["generated", feature_name.lower().replace(" ", "-"), locale] + pattern["tags"],
                "generated": True,
            }
            generated.append(tc)
            register_generated_test(tc)

    # Update suite counts
    if suite_key in TEST_SUITES:
        TEST_SUITES[suite_key]["total"] += len(generated)
        TEST_SUITES[suite_key]["manual"] += len(generated)  # start as manual until automated

    return {
        "generated_tests": generated,
        "count": len(generated),
        "feature": feature_name,
        "suite": suite_key,
        "device": device,
        "locales_covered": locale_list,
        "patterns_generated": [p["name_template"].format(feature=feature_name) for p in patterns],
        "status": "added_to_workflow",
        "message": (
            f"Generated {len(generated)} test cases for '{feature_name}' across "
            f"{len(locale_list)} locales. Tests added to '{suite}' suite and visible "
            f"in the Workspace. Mark as PASS/FAIL after first run, then automate."
        ),
        "next_steps": [
            f"Add {key_prefix}{feature_name.lower().replace(' ', '_')}.* keys to all locale bundles.",
            "Run first manual validation pass against Sprint 44 firmware build.",
            "Automate via NestLocaleTestHarness after initial validation.",
        ],
    }


def get_generated_tests(suite: str = "", locale: str = "") -> dict:
    """Return all agent-generated test cases (created via generate_test_cases).

    Args:
        suite:  Filter by suite name.
        locale: Filter by locale code.
    Returns:
        dict with generated test cases and count.
    """
    results = list(GENERATED_TEST_CASES)
    if suite:
        results = [t for t in results if suite.lower() in t.get("suite", "").lower()]
    if locale:
        results = [t for t in results if locale.lower() in t.get("locale", "").lower()]

    return {
        "generated_tests": results,
        "count": len(results),
        "suites_covered": list({t["suite"] for t in results}),
        "locales_covered": list({t["locale"] for t in results}),
    }
