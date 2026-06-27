import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the backend directory to sys.path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app, load_csv_data, get_model

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_data():
    load_csv_data()
    get_model()

def test_analyze_location():
    # Test a coordinate in Mumbai (e.g., Bandra area)
    lat = 19.055
    lng = 72.835
    response = client.get(f"/api/v1/analyze-location?lat={lat}&lng={lng}")
    assert response.status_code == 200
    data = response.json()
    assert "lat" in data
    assert "lng" in data
    assert "nearest_hotspot" in data
    assert "predicted_temperature" in data
    assert "top_drivers" in data
    assert len(data["top_drivers"]) > 0

def test_recommend_intervention():
    lat = 19.055
    lng = 72.835
    response = client.get(f"/api/v1/recommend-intervention?lat={lat}&lng={lng}")
    assert response.status_code == 200
    data = response.json()
    assert "best_intervention" in data
    assert "name" in data["best_intervention"]
    assert "temperature_reduction" in data["best_intervention"]
    assert "interventions" in data

def test_nearby_hotspots():
    lat = 19.055
    lng = 72.835
    response = client.get(f"/api/v1/nearby-hotspots?lat={lat}&lng={lng}&radius=5")
    assert response.status_code == 200
    data = response.json()
    assert "hotspots" in data
    assert isinstance(data["hotspots"], list)
    assert "count" in data
