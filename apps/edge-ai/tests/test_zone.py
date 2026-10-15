from src.zone import ZonePolygon


def test_point_inside() -> None:
    zone = ZonePolygon.from_raw([{"x": 0.2, "y": 0.2}, {"x": 0.8, "y": 0.2}, {"x": 0.8, "y": 0.9}, {"x": 0.2, "y": 0.9}])
    assert zone.contains(0.5, 0.5) is True


def test_point_outside() -> None:
    zone = ZonePolygon.from_raw([{"x": 0.2, "y": 0.2}, {"x": 0.8, "y": 0.2}, {"x": 0.8, "y": 0.9}, {"x": 0.2, "y": 0.9}])
    assert zone.contains(0.1, 0.1) is False


def test_too_few_points_raises() -> None:
    import pytest

    with pytest.raises(ValueError):
        ZonePolygon.from_raw([{"x": 0.2, "y": 0.2}, {"x": 0.8, "y": 0.2}])