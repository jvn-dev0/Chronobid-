import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "registered_categories" in data

def test_categories_endpoint():
    response = client.get("/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data["categories"]) == 12
    assert "Timepieces & Watches" in data["categories"]

def test_verify_missing_file():
    response = client.post("/verify")
    assert response.status_code == 422
