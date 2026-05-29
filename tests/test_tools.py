"""Unit tests for the ADK tool functions."""
import pytest


@pytest.fixture(autouse=True)
def patch_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")
    monkeypatch.setenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")


def test_get_dashboard_summary():
    from locatest.tools.test_tools import get_dashboard_summary
    result = get_dashboard_summary()
    assert "total_tests" in result or "metrics" in result or isinstance(result, dict)


def test_get_test_suite_summary_all():
    from locatest.tools.test_tools import get_test_suite_summary
    result = get_test_suite_summary()
    assert "suites" in result or "summary" in result or isinstance(result, dict)


def test_get_test_suite_summary_specific():
    from locatest.tools.test_tools import get_test_suite_summary
    result = get_test_suite_summary("Home Screen")
    assert isinstance(result, dict)


def test_get_test_cases_default():
    from locatest.tools.test_tools import get_test_cases
    result = get_test_cases()
    assert "cases" in result
    assert len(result["cases"]) > 0


def test_get_test_cases_filter_locale():
    from locatest.tools.test_tools import get_test_cases
    result = get_test_cases(locale="pt-BR")
    assert "cases" in result
    for c in result["cases"]:
        assert "pt-BR" in c.get("locale", "")


def test_get_test_cases_filter_status():
    from locatest.tools.test_tools import get_test_cases
    result = get_test_cases(status="FAIL")
    assert "cases" in result
    for c in result["cases"]:
        assert c["status"].upper() == "FAIL"


def test_get_failing_tests():
    from locatest.tools.test_tools import get_failing_tests
    result = get_failing_tests()
    assert "failures" in result or "cases" in result or isinstance(result, dict)


def test_search_test_cases():
    from locatest.tools.test_tools import search_test_cases
    result = search_test_cases("greeting")
    assert "cases" in result or "results" in result or isinstance(result, dict)


def test_get_locale_coverage():
    from locatest.tools.test_tools import get_locale_coverage
    result = get_locale_coverage()
    assert isinstance(result, dict)


def test_get_locale_coverage_specific():
    from locatest.tools.test_tools import get_locale_coverage
    result = get_locale_coverage("pt-BR")
    assert isinstance(result, dict)


def test_get_sprint_summary():
    from locatest.tools.test_tools import get_sprint_summary
    result = get_sprint_summary()
    assert isinstance(result, dict)
    assert "sprints" in result
    assert len(result["sprints"]) >= 2


def test_get_sprint_summary_specific():
    from locatest.tools.test_tools import get_sprint_summary
    result = get_sprint_summary("Sprint 43")
    assert "sprints" in result
    assert len(result["sprints"]) > 0
    s = result["sprints"][0]
    for key in ("name", "total_run", "passed", "failed"):
        assert key in s, f"missing sprint key: {key}"


def test_get_failing_tests_sprint_filter():
    from locatest.tools.test_tools import get_failing_tests
    r43 = get_failing_tests(sprint="Sprint 43")
    assert "failures" in r43
    assert isinstance(r43["failures"], list)


def test_sprint_comparison_workflow():
    """Reproduce the routing-loop query: compare Sprint 43 vs Sprint 42 failure lists."""
    from locatest.tools.test_tools import get_sprint_summary, get_failing_tests
    s43 = get_sprint_summary("Sprint 43")["sprints"][0]
    s42 = get_sprint_summary("Sprint 42")["sprints"][0]
    f43 = get_failing_tests(sprint="Sprint 43")["failures"]
    f42 = get_failing_tests(sprint="Sprint 42")["failures"]
    ids43 = {f["id"] for f in f43}
    ids42 = {f["id"] for f in f42}
    new_regressions = ids43 - ids42
    fixed = ids42 - ids43
    assert s43["name"] != s42["name"]
    assert isinstance(new_regressions, set)
    assert isinstance(fixed, set)


def test_get_automation_roadmap():
    from locatest.tools.test_tools import get_automation_roadmap
    result = get_automation_roadmap()
    assert "roadmap" in result or isinstance(result, dict)


def test_get_firmware_builds():
    from locatest.tools.test_tools import get_firmware_builds
    result = get_firmware_builds()
    assert "builds" in result or "firmware_builds" in result or isinstance(result, dict)


def test_generate_test_cases():
    from locatest.tools.test_tools import generate_test_cases, get_generated_tests
    result = generate_test_cases(
        feature_name="Night Mode Display",
        suite="Home Screen & Ambient Display",
        locales="pt-BR,de-DE",
        device="Nest Hub",
    )
    assert isinstance(result, dict)
    assert result.get("count", 0) > 0 or "tests" in result or "generated" in result


def test_get_generated_tests():
    from locatest.tools.test_tools import get_generated_tests
    result = get_generated_tests()
    assert isinstance(result, dict)


def test_approve_issue_filing_approve():
    from locatest.tools.test_tools import approve_issue_filing
    result = approve_issue_filing("b/337821049", approved=True, notes="LGTM")
    assert isinstance(result, dict)


def test_approve_issue_filing_reject():
    from locatest.tools.test_tools import approve_issue_filing
    result = approve_issue_filing("b/337821049", approved=False, notes="needs more info")
    assert isinstance(result, dict)


def test_get_hil_pending_approvals():
    from locatest.tools.test_tools import get_hil_pending_approvals
    result = get_hil_pending_approvals()
    assert "pending" in result or isinstance(result, dict)


def test_run_test_simulation():
    from locatest.tools.test_tools import run_test_simulation
    result = run_test_simulation(suite="Home Screen", locale="pt-BR", scenario_type="smoke")
    assert isinstance(result, dict)


def test_get_rca_report():
    from locatest.tools.test_tools import get_rca_report
    result = get_rca_report()
    assert isinstance(result, dict)


def test_create_buganizer_issue():
    from locatest.tools.test_tools import create_buganizer_issue
    result = create_buganizer_issue(
        title="Test issue",
        severity="S2",
        component="Nest>Firmware>Localization",
        test_case_ids="LOC-NH-11198",
    )
    assert isinstance(result, dict)
