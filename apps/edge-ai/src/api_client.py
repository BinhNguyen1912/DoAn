"""HTTP client for the Safe Zone Monitor backend.

Posts confirmed intrusion events to ``POST /api/events`` with the shared edge token.
Idempotent by ``eventId``: the backend returns 200 for a duplicate instead of 201.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from uuid import UUID

import httpx

from .config import Settings
from .zone import ZonePolygon

log = logging.getLogger(__name__)


class ApiClient:
    def __init__(self, settings: Settings, *, timeout: float = 5.0) -> None:
        self._base = str(settings.api_base_url).rstrip("/")
        self._token = settings.edge_api_token
        self._client = httpx.Client(base_url=self._base, timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "ApiClient":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def get_zone(self, zone_id: int) -> ZonePolygon:
        """Fetch the configured danger-zone polygon. The zones endpoints are public."""
        resp = self._client.get(f"/api/zones/{zone_id}")
        resp.raise_for_status()
        return ZonePolygon.from_raw(resp.json()["points"])

    def post_event(self, *, event_id: UUID, zone_id: int, detected_at: datetime, confidence: float) -> bool:
        """Return True when the backend stored a new event, False on duplicate."""
        if detected_at.tzinfo is None:
            detected_at = detected_at.replace(tzinfo=UTC)
        resp = self._client.post(
            "/api/events",
            headers={"Authorization": f"Bearer {self._token}"},
            json={
                "eventId": str(event_id),
                "zoneId": zone_id,
                "detectedAt": detected_at.isoformat(),
                "confidence": confidence,
            },
        )
        if resp.status_code == 201:
            log.info("event stored: %s", event_id)
            return True
        if resp.status_code == 200:
            log.info("event duplicate (ignored): %s", event_id)
            return False
        log.error("post_event failed: %s %s", resp.status_code, resp.text)
        resp.raise_for_status()
        return False