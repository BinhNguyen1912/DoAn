"""Post a fake intrusion event to the backend — a smoke test for the edge→backend→web link.

Run from the repo root:
    uv run --directory apps/edge-ai python -m src.send_event
    uv run --directory apps/edge-ai python -m src.send_event --confidence 0.81

No camera needed. Use this to confirm the dashboard shows a real event end-to-end
before the webcam pipeline is wired. Each call generates a fresh eventId.
"""

from __future__ import annotations

import argparse
import random
from datetime import UTC, datetime
from uuid import uuid4

from .api_client import ApiClient
from .config import load_settings


def main() -> int:
    parser = argparse.ArgumentParser(description="Post a fake intrusion event to the backend")
    parser.add_argument("--confidence", type=float, default=None, help="Override random confidence (0..1)")
    args = parser.parse_args()

    settings = load_settings()
    confidence = args.confidence if args.confidence is not None else round(random.uniform(0.55, 0.95), 2)
    event_id = uuid4()
    detected_at = datetime.now(UTC)

    with ApiClient(settings) as api:
        created = api.post_event(
            event_id=event_id, zone_id=settings.zone_id, detected_at=detected_at, confidence=confidence
        )

    verb = "stored" if created else "duplicate (ignored)"
    print(f"event {verb}: eventId={event_id} zoneId={settings.zone_id} confidence={confidence}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())