"""
FastAPI dependencies for authentication and common utilities.

This module provides dependency injection for:
- Extracting authenticated user from OAuth2-proxy headers
- Common request handling patterns

SECURITY WARNING:
    This module trusts X-Forwarded-* headers for user identity.
    The backend MUST be deployed behind an OAuth2-proxy with proper
    network isolation. Direct access to the backend from untrusted
    networks would allow header spoofing and user impersonation.

    Required deployment architecture:
    - OAuth2-proxy handles all authentication
    - Backend is only accessible from OAuth2-proxy (not public)
    - Use NetworkPolicy or service mesh to enforce this
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings


@dataclass
class CurrentUser:
    """
    User information extracted from OAuth2-proxy headers.

    This is a stateless representation - no database storage.
    User identity comes from the OAuth identity provider.
    """

    username: str
    email: str

    @property
    def display_name(self) -> str:
        """Return a display-friendly name."""
        return self.username


def get_current_user(
    x_forwarded_preferred_username: str | None = Header(
        None, alias="X-Forwarded-Preferred-Username"
    ),
    x_forwarded_user: str | None = Header(None, alias="X-Forwarded-User"),
    x_forwarded_email: str | None = Header(None, alias="X-Forwarded-Email"),
) -> CurrentUser:
    """
    Extract the authenticated user from OAuth2-proxy headers.

    OAuth2-proxy sits in front of the application and handles authentication.
    After successful authentication, it passes user information via HTTP headers:

    Headers (in order of preference):
    - X-Forwarded-Preferred-Username: Username from oauth2-proxy/Keycloak
    - X-Forwarded-User: Username from OpenShift OAuth proxy
    - X-Forwarded-Email: Email from the identity provider

    In local development (ENVIRONMENT=local), returns a default dev user
    to allow development without the OAuth proxy.

    Returns:
        CurrentUser: User information from OAuth headers

    Raises:
        HTTPException: 401 if no authenticated user in production/staging
    """
    # Try oauth2-proxy header first, fall back to OpenShift OAuth header
    username = x_forwarded_preferred_username or x_forwarded_user
    email = x_forwarded_email

    # Local development fallback
    if settings.ENVIRONMENT == "local" and not username:
        return CurrentUser(username="dev-user", email="dev@example.com")

    # In staging/production, require OAuth proxy headers
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No user information found in request headers.",
        )

    return CurrentUser(username=username, email=email or "")


def get_optional_user(
    x_forwarded_preferred_username: str | None = Header(
        None, alias="X-Forwarded-Preferred-Username"
    ),
    x_forwarded_user: str | None = Header(None, alias="X-Forwarded-User"),
    x_forwarded_email: str | None = Header(None, alias="X-Forwarded-Email"),
) -> CurrentUser | None:
    """
    Optionally extract user from OAuth headers without requiring authentication.

    Useful for endpoints that work for both authenticated and anonymous users.

    Returns:
        CurrentUser if authenticated, None otherwise
    """
    username = x_forwarded_preferred_username or x_forwarded_user
    email = x_forwarded_email

    if not username:
        # In local dev, still return dev user for convenience
        if settings.ENVIRONMENT == "local":
            return CurrentUser(username="dev-user", email="dev@example.com")
        return None

    return CurrentUser(username=username, email=email or "")


# Type annotations for dependency injection
UserDep = Annotated[CurrentUser, Depends(get_current_user)]
OptionalUserDep = Annotated[CurrentUser | None, Depends(get_optional_user)]
