"""Environment-based settings — auto-loads .env via pydantic-settings."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GOOGLE_GENAI_USE_VERTEXAI: str = "TRUE"
    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_CLOUD_LOCATION: str = "us-central1"

    GEMINI_MODEL: str = "gemini-2.0-flash-001"

    STATIC_FILES_DIR: str = "static"
    ENVIRONMENT: str = "custom"


settings = Settings()

import os as _os
_os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", settings.GOOGLE_GENAI_USE_VERTEXAI)
_os.environ.setdefault("GOOGLE_CLOUD_PROJECT", settings.GOOGLE_CLOUD_PROJECT)
_os.environ.setdefault("GOOGLE_CLOUD_LOCATION", settings.GOOGLE_CLOUD_LOCATION)
