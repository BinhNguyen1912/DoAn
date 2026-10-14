"""Typed settings for the Edge AI service.

To add a setting: add a field to ``Settings`` and document it in ``.env.example``.
Values come from the process environment, then from ``.env`` in apps/edge-ai.
The service refuses to start when a value is missing or invalid.
"""

from pathlib import Path

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=APP_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Backend
    api_base_url: HttpUrl
    edge_api_token: str = Field(min_length=16)
    zone_id: int = Field(ge=1)

    # Camera and model
    camera_index: int = Field(default=0, ge=0)
    model_path: Path = Path("models/yolo11n.pt")
    detect_confidence: float = Field(default=0.35, gt=0, le=1)
    image_size: int = Field(default=640, ge=32)

    # Alert logic
    confirm_frames: int = Field(default=3, ge=1)
    cooldown_seconds: float = Field(default=10, ge=0)
    send_evidence: bool = False

    log_level: str = "INFO"

    @property
    def resolved_model_path(self) -> Path:
        return self.model_path if self.model_path.is_absolute() else APP_DIR / self.model_path


def load_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
