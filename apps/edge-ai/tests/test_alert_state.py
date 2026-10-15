from src.alert_state import AlertStateMachine, TrackStatus


def test_outside_to_alerted_after_confirm_frames() -> None:
    sm = AlertStateMachine(confirm_frames=3, cooldown_seconds=10)
    # Two frames in-zone are not enough.
    assert sm.update(1, True, now=0.0) is False
    assert sm.update(1, True, now=0.1) is False
    # Third consecutive frame fires.
    assert sm.update(1, True, now=0.2) is True
    assert sm.status(1) == TrackStatus.ALERTED


def test_candidate_resets_when_person_leaves() -> None:
    sm = AlertStateMachine(confirm_frames=3, cooldown_seconds=10)
    sm.update(1, True, now=0.0)
    sm.update(1, True, now=0.1)
    # Person leaves before confirmation: no fire, back to EXITED (was candidate).
    assert sm.update(1, False, now=0.2) is False
    assert sm.status(1) == TrackStatus.EXITED


def test_no_refire_while_staying_inside() -> None:
    sm = AlertStateMachine(confirm_frames=2, cooldown_seconds=10)
    assert sm.update(1, True, now=0.0) is False
    assert sm.update(1, True, now=0.1) is True
    # Stays inside many frames: never fires again.
    for i in range(5):
        assert sm.update(1, True, now=0.2 + i) is False


def test_refire_after_leave_and_reentry() -> None:
    sm = AlertStateMachine(confirm_frames=2, cooldown_seconds=10)
    sm.update(1, True, now=0.0)
    assert sm.update(1, True, now=0.1) is True
    sm.update(1, False, now=0.2)  # leaves -> EXITED
    # Re-enters and re-confirms: fires again.
    assert sm.update(1, True, now=20.0) is False
    assert sm.update(1, True, now=20.1) is True


def test_cooldown_blocks_immediate_refire() -> None:
    sm = AlertStateMachine(confirm_frames=2, cooldown_seconds=10)
    sm.update(1, True, now=0.0)
    assert sm.update(1, True, now=0.1) is True
    sm.update(1, False, now=0.2)  # leaves
    # Re-enters within cooldown: suppressed.
    sm.update(1, True, now=1.0)
    assert sm.update(1, True, now=1.1) is False
    assert sm.status(1) == TrackStatus.ALERTED


def test_independent_tracks() -> None:
    sm = AlertStateMachine(confirm_frames=2, cooldown_seconds=10)
    sm.update(1, True, now=0.0)
    assert sm.update(2, True, now=0.0) is False
    assert sm.update(1, True, now=0.1) is True
    assert sm.update(2, True, now=0.1) is True


def test_mark_unseen_drops_stale_track() -> None:
    sm = AlertStateMachine(confirm_frames=3, cooldown_seconds=10)
    sm.update(1, True, now=0.0)
    sm.mark_unseen({2})  # track 1 vanished this frame
    assert 1 not in sm._tracks
    assert sm.status(1) == TrackStatus.OUTSIDE