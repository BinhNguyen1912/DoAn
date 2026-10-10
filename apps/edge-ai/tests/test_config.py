import pytest
from pydantic import ValidationError

from src.config import Settings

VALID = {
    "api_base_url": "http://127.0.0.1:3000",
    "edge_api_token": "x" * 16,
    "zone_id": 1,
}


def test_defaults_apply():
    s = Settings(_env_file=None, **VALID)
    assert s.camera_index == 0
    assert s.confirm_frames == 3
    assert s.send_evidence is False


def test_missing_required_keys_fail():
    with pytest.raises(ValidationError) as err:
        Settings(_env_file=None)
    text = str(err.value)
    assert "api_base_url" in text and "edge_api_token" in text


def test_short_token_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{**VALID, "edge_api_token": "short"})
