"""Webcam reader using OpenCV's MSMF backend (default on Windows).

Retry-reads a few times before giving up so a dropped frame does not kill the loop.
"""

from __future__ import annotations

import logging
import time

import cv2
import numpy as np

log = logging.getLogger(__name__)


class Camera:
    def __init__(self, index: int) -> None:
        self._index = index
        self._cap: cv2.VideoCapture | None = None

    def open(self) -> None:
        cap = cv2.VideoCapture(self._index, cv2.CAP_MSMF)
        if not cap.isOpened():
            cap.release()
            raise RuntimeError(
                f"Cannot open webcam index {self._index}. "
                "Close other apps using the camera, replug it, or run `npm run cam:probe`."
            )
        self._cap = cap
        log.info("webcam opened: index=%d %dx%d", self._index, self.width, self.height)

    @property
    def width(self) -> int:
        return int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH)) if self._cap else 0

    @property
    def height(self) -> int:
        return int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) if self._cap else 0

    def read(self) -> np.ndarray | None:
        """Return a frame, retrying briefly on transient grab failures."""
        if self._cap is None:
            return None
        for _ in range(5):
            ok, frame = self._cap.read()
            if ok and frame is not None:
                return frame
            time.sleep(0.05)
        return None

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None