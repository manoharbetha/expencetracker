from __future__ import annotations
import os
from functools import lru_cache
from typing import List, Optional
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "expencetracker AI Expense Tracker"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    mongodb_uri: str = Field(default="mongodb://localhost:27017")
    mongodb_db_name: str = "financial_expense_tracker"
    jwt_secret_key: Optional[str] = Field(default=None)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 120
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"
    trusted_proxies_str: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]

    @property
    def trusted_proxies(self) -> List[str]:
        return [p.strip() for p in self.trusted_proxies_str.split(",") if p.strip()]

    @model_validator(mode="after")
    def validate_production_config(self) -> Settings:
        import json
        # Check both JWT_SECRET and JWT_SECRET_KEY
        jwt_sec = os.environ.get("JWT_SECRET") or os.environ.get("JWT_SECRET_KEY")
        if jwt_sec:
            self.jwt_secret_key = jwt_sec

        if self.app_env.lower() == "production":
            errors = []
            
            # 1. JWT Secret Validation
            if not self.jwt_secret_key:
                errors.append("JWT_SECRET (or JWT_SECRET_KEY) environment variable is missing.")
            elif self.jwt_secret_key in [
                "expencetracker-dev-secret-change-in-production",
                "fintell-dev-secret-change-in-production"
            ]:
                errors.append("JWT_SECRET (or JWT_SECRET_KEY) is using an insecure default value.")
                
            # 2. MongoDB URI Validation
            if not self.mongodb_uri:
                errors.append("MONGODB_URI environment variable is missing.")
            elif "localhost" in self.mongodb_uri or "127.0.0.1" in self.mongodb_uri:
                errors.append("MONGODB_URI cannot point to localhost/127.0.0.1 in production.")
                
            # 3. AI Keys Validation
            openai_key = os.environ.get("OPENAI_API_KEY")
            if not self.groq_api_key and not openai_key:
                errors.append("Either GROQ_API_KEY or OPENAI_API_KEY must be provided in production.")
                
            # 4. CORS Validation
            origins = self.cors_origins
            if not origins:
                errors.append("CORS_ORIGINS (FRONTEND_ORIGINS) cannot be empty in production.")
            else:
                for origin in origins:
                    if "*" in origin:
                        errors.append("CORS_ORIGINS cannot contain wildcard '*' in production.")
                    if "localhost" in origin or "127.0.0.1" in origin:
                        errors.append(f"CORS_ORIGINS cannot contain localhost origins in production: '{origin}'.")
                        

            if errors:
                error_msg = "\n".join([f"  - {err}" for err in errors])
                raise ValueError(
                    f"\n\n==================================================\n"
                    f"CRITICAL PRODUCTION CONFIGURATION ERROR:\n"
                    f"{error_msg}\n"
                    f"==================================================\n"
                )
        return self

@lru_cache
def get_settings() -> Settings:
    return Settings()
