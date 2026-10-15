"""Danger-zone polygon in normalized image coordinates and point-in-polygon test.

Vertices are stored as fractions of the frame width/height (0..1), so the same zone
works at any camera resolution. The Edge AI service fetches the polygon from the
backend; a local fallback is used only for the offline preview.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class ZonePoint:
    x: float
    y: float


@dataclass
class ZonePolygon:
    points: list[ZonePoint]

    def __post_init__(self) -> None:
        if len(self.points) < 3:
            raise ValueError("A polygon needs at least 3 points")

    @classmethod
    def from_raw(cls, raw: list[dict[str, float]]) -> "ZonePolygon":
        return cls([ZonePoint(float(p["x"]), float(p["y"])) for p in raw])

    def to_pixel_polygon(self, width: int, height: int) -> np.ndarray:
        """Integer array shape (N, 1, 2) for cv2.pointPolygonTest / fillPoly / polylines."""
        pts = np.array([[int(p.x * width), int(p.y * height)] for p in self.points], dtype=np.int32)
        return pts.reshape(-1, 1, 2)

    def contains(self, x_frac: float, y_frac: float) -> bool:
        """True when the normalized point lies inside (or on the edge of) the polygon."""
        pts = np.array([[p.x, p.y] for p in self.points], dtype=np.float32)
        return cv2.pointPolygonTest(pts, (float(x_frac), float(y_frac)), measureDist=False) >= 0

    def draw(self, frame: np.ndarray, *, fill: tuple[int, int, int] = (40, 40, 200)) -> None:
        """Overlay the polygon on a BGR frame in place."""
        h, w = frame.shape[:2]
        poly = self.to_pixel_polygon(w, h)
        overlay = frame.copy()
        cv2.fillPoly(overlay, [poly], fill)
        cv2.addWeighted(overlay, 0.18, frame, 0.82, 0, frame)
        cv2.polylines(frame, [poly], isClosed=True, color=(60, 60, 240), thickness=2)