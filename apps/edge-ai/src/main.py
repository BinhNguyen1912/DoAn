"""Safe Zone Monitor edge service — real webcam pipeline.

Webcam → YOLO (person) + ByteTrack → bottom-center point in the danger-zone polygon →
state machine (3 consecutive frames) → POST /api/events to the backend. The zone is
fetched from the backend at startup. A live preview window overlays the polygon and
detections; press `q` to quit.

Run from the repo root:
    npm run edge:run
"""

from __future__ import annotations

import logging
import time
from datetime import UTC, datetime
from uuid import uuid4

import cv2

from .alert_state import AlertStateMachine, TrackStatus
from .api_client import ApiClient
from .camera import Camera
from .config import load_settings
from .detector import Detector
from .zone import ZonePolygon

log = logging.getLogger(__name__)

WINDOW = "Safe Zone Monitor (press q)"

# Box color per track status: BGR.
STATUS_COLOR: dict[TrackStatus, tuple[int, int, int]] = {
    TrackStatus.OUTSIDE: (80, 200, 80),
    TrackStatus.CANDIDATE: (40, 200, 220),
    TrackStatus.ALERTED: (40, 40, 240),
    TrackStatus.EXITED: (120, 120, 120),
}


def draw_detection(frame, det, status: TrackStatus) -> None:
    color = STATUS_COLOR[status]
    cv2.rectangle(frame, (det.x1, det.y1), (det.x2, det.y2), color, 2)
    cx, cy = det.bottom_center()
    cv2.circle(frame, (cx, cy), 4, color, -1)
    cv2.putText(
        frame,
        f"#{det.track_id} {status.value} {det.confidence:.2f}",
        (det.x1, max(15, det.y1 - 6)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        color,
        1,
        cv2.LINE_AA,
    )


def main() -> int:
    settings = load_settings()
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    with ApiClient(settings) as api:
        log.info("fetching zone %d from backend", settings.zone_id)
        zone = api.get_zone(settings.zone_id)
        log.info("zone loaded: %d vertices", len(zone.points))

        camera = Camera(settings.camera_index)
        camera.open()
        # Resizable preview window, opened 1.6x the camera frame so it is easy to see.
        cv2.namedWindow(WINDOW, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(WINDOW, max(960, int(camera.width * 1.6)), max(720, int(camera.height * 1.6)))
        detector = Detector(
            settings.resolved_model_path,
            confidence=settings.detect_confidence,
            image_size=settings.image_size,
        )
        sm = AlertStateMachine(
            confirm_frames=settings.confirm_frames,
            cooldown_seconds=settings.cooldown_seconds,
        )

        print("Press `q` in the preview window to quit.")
        try:
            while True:
                frame = camera.read()
                if frame is None:
                    log.warning("no frame from webcam; retrying")
                    continue
                h, w = frame.shape[:2]

                now = time.monotonic()
                seen: set[int] = set()
                for det in detector.track(frame):
                    cx, cy = det.bottom_center()
                    in_zone = zone.contains(cx / w, cy / h)
                    fire = sm.update(det.track_id, in_zone, now)
                    seen.add(det.track_id)
                    status = sm.status(det.track_id)
                    draw_detection(frame, det, status)

                    if fire:
                        event_id = uuid4()
                        detected_at = datetime.now(UTC)
                        try:
                            api.post_event(
                                event_id=event_id,
                                zone_id=settings.zone_id,
                                detected_at=detected_at,
                                confidence=det.confidence,
                            )
                            log.warning("ALERT fired: track=%s conf=%.2f event=%s", det.track_id, det.confidence, event_id)
                        except Exception:
                            log.exception("failed to post event %s", event_id)

                sm.mark_unseen(seen)
                zone.draw(frame)
                cv2.imshow(WINDOW, frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
        except KeyboardInterrupt:
            pass
        finally:
            camera.close()
            cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())