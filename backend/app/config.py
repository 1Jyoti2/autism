import os
from pathlib import Path
from typing import List, Optional, Union, Any
from pydantic_settings import BaseSettings
from pydantic import model_validator, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    APP_NAME: str = "Early Autism Detection API"
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "autism_screening_ai_backend_secret_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # PostgreSQL Database Parameters
    POSTGRES_USER: Optional[str] = "postgres"
    POSTGRES_PASSWORD: Optional[str] = "postgres"
    POSTGRES_SERVER: Optional[str] = "localhost"
    POSTGRES_PORT: Optional[int] = 5432
    POSTGRES_DB: Optional[str] = "autism_detection_db"

    # Full Database URL (If provided, overrides individual postgres params; defaults to sqlite if not configured)
    DATABASE_URL: Optional[str] = None

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple, set)):
            return list(v)
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]

    # File uploads
    UPLOAD_DIR: Path = BASE_DIR / "uploads"

    # ML Model Paths
    EMOTION_MODEL_PATH: Path = WORKSPACE_DIR / "ml" / "models" / "best_model.pt"
    EMOTION_MODEL_ALT_PATH: Path = WORKSPACE_DIR / "ml" / "models" / "best_resnet18_pretrained.pt"
    VIDEO_MODEL_PATH: Path = WORKSPACE_DIR / "video_ml" / "video_model.pth"
    VIDEO_CLASS_LABELS_PATH: Path = WORKSPACE_DIR / "video_ml" / "class_labels.json"

    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if not self.DATABASE_URL:
            # Check if PostgreSQL environment variables are explicitly set
            if os.getenv("DATABASE_URL"):
                self.DATABASE_URL = os.getenv("DATABASE_URL")
            elif os.getenv("POSTGRES_SERVER") or os.getenv("POSTGRES_DB"):
                user = self.POSTGRES_USER or "postgres"
                pwd = self.POSTGRES_PASSWORD or "postgres"
                server = self.POSTGRES_SERVER or "localhost"
                port = self.POSTGRES_PORT or 5432
                db = self.POSTGRES_DB or "autism_detection_db"
                self.DATABASE_URL = f"postgresql+psycopg2://{user}:{pwd}@{server}:{port}/{db}"
            else:
                # Default SQLite database for zero-config fallback
                self.DATABASE_URL = f"sqlite:///{BASE_DIR / 'autism_detection.db'}"
        return self

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
