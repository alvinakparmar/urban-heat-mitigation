import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app, load_csv_data, get_model, analyze_location, recommend_intervention, get_hotspots

async def run_tests():
    load_csv_data()
    get_model()
    
    print("Testing analyze_location...")
    lat = 19.055
    lng = 72.835
    data = await analyze_location(lat=lat, lng=lng)
    assert "lat" in data
    assert "lng" in data
    assert "nearest_hotspot" in data
    assert "predicted_temperature" in data
    assert "top_drivers" in data
    print("OK")
    
    print("Testing recommend_intervention...")
    data = await recommend_intervention(lat=lat, lng=lng)
    # Just checking it runs without exceptions and returns dict
    assert isinstance(data, dict)
    print("OK")
    
    print("Testing nearby-hotspots...")
    data = await get_hotspots(lat=lat, lng=lng) # Note: nearby-hotspots endpoint uses get_hotspots logic, wait in main.py it's called get_hotspots, wait let's just check if get_hotspots works
    assert "hotspots" in data
    assert isinstance(data["hotspots"], list)
    assert "count" in data
    print("OK")

if __name__ == "__main__":
    asyncio.run(run_tests())
    print("All tests passed.")
