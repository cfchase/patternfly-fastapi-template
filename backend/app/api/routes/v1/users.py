"""
User API routes.

Provides endpoints for user-related operations.
User identity comes from OAuth2-proxy headers (no database).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import UserDep

router = APIRouter(prefix="/users", tags=["users"])


class UserResponse(BaseModel):
    """Response model for user information."""

    username: str
    email: str
    display_name: str


@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: UserDep) -> UserResponse:
    """
    Get current authenticated user information.

    Returns the user information extracted from OAuth2-proxy headers.
    In local development, returns a default dev user.

    Returns:
        UserResponse: Current user's username, email, and display name
    """
    return UserResponse(
        username=current_user.username,
        email=current_user.email,
        display_name=current_user.display_name,
    )
