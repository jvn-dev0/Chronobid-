import pytest
from verification_engine import VerificationEngine

def test_period_estimation_empty():
    engine = VerificationEngine()
    period = engine.estimate_period([])
    assert period["label"] == "Unknown"
    assert period["confidence"] == 0.0

def test_period_estimation_valid():
    engine = VerificationEngine()
    mock_refs = [
        {"object_id": 101, "similarity": 0.85},
        {"object_id": 102, "similarity": 0.80}
    ]
    engine.metadata = [
        {"objectID": 101, "objectBeginDate": 1850, "objectEndDate": 1900},
        {"objectID": 102, "objectBeginDate": 1860, "objectEndDate": 1910}
    ]
    period = engine.estimate_period(mock_refs)
    assert period["begin_year"] > 1800
    assert period["end_year"] <= 1910
    assert period["confidence"] > 0.7
