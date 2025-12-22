"""
Application configuration using Pydantic Settings.

Environment variables can be set in a .env file or directly in the environment.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application settings
    APP_NAME: str = "PatternFly FastAPI Template"
    APP_VERSION: str = "1.0.0"

    # Environment: local, development, staging, production
    ENVIRONMENT: str = "local"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:8080",
        "http://localhost:5173",
    ]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT in ("local", "development")

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT in ("staging", "production")


# Global settings instance
settings = Settings()
