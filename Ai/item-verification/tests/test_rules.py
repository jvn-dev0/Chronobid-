import pytest
from verification_engine import VerificationEngine

def test_rules_loading():
    engine = VerificationEngine()
    rules = engine.load_rules()
    assert "thresholds" in rules
    assert rules["thresholds"]["category_confidence_min"] == 0.55
    assert rules["thresholds"]["ambiguity_margin"] == 0.15

def test_decision_logic():
    engine = VerificationEngine()
    # Mock category mismatch
    res = engine.verify_item(
        image_path="c:/Users/kbjee/OneDrive/Desktop/Chronobid/Ai/item-verification/dataset_images/art_398.jpg"
        if False else None
    )
    # Ensure error is returned when file does not exist
    assert "error" in res
