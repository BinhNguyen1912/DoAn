"""Per-track intrusion state machine.

Pure logic — no OpenCV, no network — so it is unit-testable. Driven by
``AlertStateMachine.update(track_id, in_zone, now)`` each frame; it returns True on the
exact transition that should fire one ``POST /api/events``.

States: OUTSIDE → CANDIDATE → ALERTED → EXITED.

- OUTSIDE:  person is not in the zone (or just appeared).
- CANDIDATE: person is in the zone, but not yet for `confirm_frames` consecutive frames.
- ALERTED:  person has been confirmed in the zone; one event has already fired for this streak.
- EXITED:   a previously alerted person has left the zone, so re-entry may fire again.

Re-alert rules (AGENTS.md §2): fire only on the CANDIDATE→ALERTED transition. A re-entry
fires again only after the cooldown has elapsed since the last alert for that track.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class TrackStatus(str, Enum):
    OUTSIDE = "outside"
    CANDIDATE = "candidate"
    ALERTED = "alerted"
    EXITED = "exited"


@dataclass
class TrackState:
    status: TrackStatus = TrackStatus.OUTSIDE
    consecutive: int = 0
    last_alerted_at: float | None = None


@dataclass
class AlertStateMachine:
    confirm_frames: int
    cooldown_seconds: float
    _tracks: dict[int, TrackState] = field(default_factory=dict)

    def update(self, track_id: int, in_zone: bool, now: float) -> bool:
        """Process one frame for one track. Return True when an event should fire now."""
        state = self._tracks.setdefault(track_id, TrackState())

        if in_zone:
            if state.status in (TrackStatus.OUTSIDE, TrackStatus.EXITED):
                state.status = TrackStatus.CANDIDATE
                state.consecutive = 1
            elif state.status == TrackStatus.CANDIDATE:
                state.consecutive += 1
            # ALERTED stays ALERTED while the person remains inside; no re-fire.

            if state.status == TrackStatus.CANDIDATE and state.consecutive >= self.confirm_frames:
                cooled = state.last_alerted_at is None or (now - state.last_alerted_at) >= self.cooldown_seconds
                if cooled:
                    state.status = TrackStatus.ALERTED
                    state.last_alerted_at = now
                    return True
                # Within cooldown: suppress this re-entry alert but mark ALERTED so we
                # do not keep retrying every frame.
                state.status = TrackStatus.ALERTED
            return False

        # Not in zone: a confirmed/candidate person has left.
        if state.status in (TrackStatus.CANDIDATE, TrackStatus.ALERTED):
            state.status = TrackStatus.EXITED
            state.consecutive = 0
        return False

    def mark_unseen(self, seen: set[int]) -> None:
        """Drop tracks that vanished this frame so stale ids do not block re-alerts."""
        for track_id in list(self._tracks.keys()):
            if track_id not in seen:
                del self._tracks[track_id]

    def status(self, track_id: int) -> TrackStatus:
        return self._tracks.get(track_id, TrackState()).status