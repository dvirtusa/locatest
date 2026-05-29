"""Integration tests for the FastAPI REST endpoints."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    import os
    os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "test-project")
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")
    from locatest.main import app
    return TestClient(app)


def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_api_dashboard(client):
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "total_tests" in data or "metrics" in data or isinstance(data, dict)


def test_api_suites(client):
    r = client.get("/api/suites")
    assert r.status_code == 200
    assert "suites" in r.json()
    assert len(r.json()["suites"]) > 0


def test_api_locales(client):
    r = client.get("/api/locales")
    assert r.status_code == 200
    assert "locales" in r.json()


def test_api_sprints(client):
    r = client.get("/api/sprints")
    assert r.status_code == 200
    assert "sprints" in r.json()


def test_api_test_cases(client):
    r = client.get("/api/test_cases")
    assert r.status_code == 200
    body = r.json()
    assert "cases" in body
    assert "count" in body


def test_api_test_cases_filter_suite(client):
    r = client.get("/api/test_cases?suite=Home")
    assert r.status_code == 200
    cases = r.json()["cases"]
    for c in cases:
        assert "home" in c["suite"].lower()


def test_api_test_cases_filter_status(client):
    r = client.get("/api/test_cases?status=FAIL")
    assert r.status_code == 200
    cases = r.json()["cases"]
    for c in cases:
        assert c["status"].upper() == "FAIL"


def test_api_rca(client):
    r = client.get("/api/rca")
    assert r.status_code == 200
    assert "reports" in r.json()


def test_api_issues(client):
    r = client.get("/api/issues")
    assert r.status_code == 200
    assert "issues" in r.json()


def test_api_simulations(client):
    r = client.get("/api/simulations")
    assert r.status_code == 200
    assert "simulations" in r.json()


def test_api_approve(client):
    r = client.post("/api/approve", json={"issue_id": "b/337821049", "approved": True, "notes": "LGTM"})
    assert r.status_code == 200
    body = r.json()
    assert "status" in body or "message" in body or "approved" in body
