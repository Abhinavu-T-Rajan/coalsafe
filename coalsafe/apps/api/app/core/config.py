"""Application Configuration using Pydantic Settings."""

from functools import lru_cache
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core settings for the COALSAFE API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "COALSAFE API"
    environment: str = "development"
    api_version: str = "0.1.0"
    database_url: str = Field(
        default="postgresql+psycopg://coalsafe:coalsafe_dev@localhost:5432/coalsafe"
    )
    cors_origins: List[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


settings = get_settings()
