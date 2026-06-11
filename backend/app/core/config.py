from __future__ import annotations
import os
from functools import lru_cache
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "expencetracker AI Expense Tracker"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    mongodb_uri: str = Field(default="mongodb://localhost:27017")
    mongodb_db_name: str = "financial_expense_tracker"
    jwt_secret_key: str = Field(default="expencetracker-dev-secret-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 120
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(
        env_file=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
