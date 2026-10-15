"""Person detector + ByteTrack tracker backed by Ultralytics YOLO.

Only class 0 (``person``) is kept. Each tracked box is returned with its stable
``track_id`` so the state machine can follow a person across frames.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from ultralytics import YOLO

log = logging.getLogger(__name__)


@dataclass
class Detection:
    track_id: int
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float

    def bottom_center(self) -> tuple[int, int]:
        """Anchor point used by the zone test: midpoint of the bottom edge."""
        return ((self.x1 + self.x2) // 2, self.y2)


class Detector:
    def __init__(self, model_path: Path, *, confidence: float, image_size: int) -> None:
        log.info("loading model %s", model_path)
        self._model = YOLO(str(model_path))
        self._confidence = confidence
        self._image_size = image_size

    def track(self, frame: np.ndarray) -> list[Detection]:
        """Run detection + tracking on one BGR frame; return person detections with ids."""
        results = self._model.track(
            frame,
            persist=True,
            classes=[0],
            conf=self._confidence,
            imgsz=self._image_size,
            tracker="bytetrack.yaml",
            verbose=False,
        )
        result = results[0]
        boxes = result.boxes
        if boxes is None or boxes.id is None:
            return []
        ids = boxes.id.cpu().numpy().astype(int)
        xyxy = boxes.xyxy.cpu().numpy().astype(int)
        confs = boxes.conf.cpu().numpy().astype(float)
        return [
            Detection(int(tid), int(x1), int(y1), int(x2), int(y2), float(conf))
            for (tid, (x1, y1, x2, y2), conf) in zip(ids, xyxy, confs, strict=True)
        ]