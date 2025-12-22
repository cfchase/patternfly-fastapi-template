"""Tests for the main FastAPI application."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "PatternFly FastAPI Template API"}


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/api/v1/utils/health-check")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "Backend is running"}


def test_get_current_user():
    """Test the current user endpoint (returns dev-user in local environment)."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "dev-user"
    assert data["email"] == "dev@example.com"
    assert data["display_name"] == "dev-user"


def test_get_current_user_with_oauth_headers():
    """Test that OAuth2-proxy headers are respected."""
    response = client.get(
        "/api/v1/users/me",
        headers={
            "X-Forwarded-Preferred-Username": "oauth-user",
            "X-Forwarded-Email": "oauth@example.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "oauth-user"
    assert data["email"] == "oauth@example.com"


def test_get_current_user_with_openshift_oauth_header():
    """Test that OpenShift OAuth X-Forwarded-User header works."""
    response = client.get(
        "/api/v1/users/me",
        headers={
            "X-Forwarded-User": "openshift-user",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "openshift-user"
    assert data["email"] == ""  # No email provided


def test_oauth_preferred_username_takes_precedence():
    """Test that X-Forwarded-Preferred-Username takes precedence over X-Forwarded-User."""
    response = client.get(
        "/api/v1/users/me",
        headers={
            "X-Forwarded-Preferred-Username": "preferred-user",
            "X-Forwarded-User": "fallback-user",
            "X-Forwarded-Email": "user@example.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "preferred-user"