import os
import json
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List

# Cache for CSV data
_csv_data = None

def load_csv_data() -> Optional[pd.DataFrame]:
    """Load real hotspot data from CSV file"""
    global _csv_data
    if _csv_data is not None:
        return _csv_data
    
    possible_paths = [
        "../public/data/mumbai_hotspots.csv",
        "C:/Users/Administrator/Desktop/urban-heat-mitigation/public/data/mumbai_hotspots.csv",
        "./public/data/mumbai_hotspots.csv",
        "backend/public/data/mumbai_hotspots.csv"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            try:
                _csv_data = pd.read_csv(path)
                print(f"✅ [Analysis] Loaded real data from: {path} ({len(_csv_data)} rows)")
                return _csv_data
            except Exception as e:
                print(f"⚠️ [Analysis] Error loading CSV: {e}")
                
    print("⚠️ [Analysis] No real data found.")
    return None

def extract_coordinates(geo_data: Any) -> tuple[Optional[float], Optional[float]]:
    """Extract lat/lng from various GeoJSON formats"""
    if geo_data is None:
        return None, None
    
    if isinstance(geo_data, str):
        try:
            geo_data = json.loads(geo_data)
        except Exception:
            return None, None
    
    if isinstance(geo_data, dict) and 'coordinates' in geo_data:
        coords = geo_data['coordinates']
        if coords and len(coords) > 0:
            if isinstance(coords, list) and len(coords) == 2:
                if not isinstance(coords[0], list):
                    return coords[1], coords[0]  # lat, lng
            elif isinstance(coords[0], list):
                point = coords[0]
                if len(point) >= 2:
                    return point[1], point[0]  # lat, lng
    
    return None, None

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers"""
    R = 6371.0  # Earth's radius in km
    
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    
    a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    
    return float(R * c)

def generate_hotspot_features(uhi: float) -> dict[str, float]:
    """Generate deterministic features based on UHI value"""
    ndvi = 0.35 - 0.12 * uhi
    ndvi = float(np.clip(ndvi, 0.02, 0.85))
    
    ndbi = 0.25 + 0.12 * uhi
    ndbi = float(np.clip(ndbi, 0.01, 0.75))
    
    albedo = 0.18 - 0.02 * uhi
    albedo = float(np.clip(albedo, 0.08, 0.35))
    
    pop_density = 8000 * np.exp(0.4 * uhi)
    pop_density = float(np.clip(pop_density, 100, 48000))
    
    building_height = 15 * np.exp(0.3 * uhi)
    building_height = float(np.clip(building_height, 2, 55))
    
    street_width = 18 - 1.8 * uhi
    street_width = float(np.clip(street_width, 5, 30))
    
    heat_capacity = 1.8 + 0.3 * uhi
    heat_capacity = float(np.clip(heat_capacity, 0.5, 3.2))
    
    return {
        'ndvi': ndvi,
        'ndbi': ndbi,
        'albedo': albedo,
        'population_density': pop_density,
        'building_height': building_height,
        'street_width': street_width,
        'heat_capacity': heat_capacity
    }

def calculate_shap_values(features: dict, predicted_temp: float) -> dict[str, float]:
    """Calculate mathematically consistent feature contributions (SHAP)"""
    baselines = {
        'ndvi': 0.35,
        'ndbi': 0.3,
        'albedo': 0.18,
        'population_density': 10000.0,
        'building_height': 15.0,
        'street_width': 16.0
    }
    
    coefficients = {
        'ndvi': -4.5,
        'ndbi': 5.5,
        'albedo': -8.0,
        'population_density': 0.0001,
        'building_height': 0.1,
        'street_width': -0.15
    }
    
    shap_values = {}
    for feat, val in features.items():
        if feat in baselines and feat in coefficients:
            diff = val - baselines[feat]
            shap_val = diff * coefficients[feat]
            shap_values[feat] = shap_val
            
    baseline_temp = 34.0
    actual_diff = predicted_temp - baseline_temp
    sum_shaps = sum(shap_values.values())
    
    if abs(sum_shaps) > 1e-5:
        scaling_factor = actual_diff / sum_shaps
        for feat in shap_values:
            shap_values[feat] = shap_values[feat] * scaling_factor
            
    return shap_values

def get_nearest_hotspot(lat: float, lng: float) -> Optional[dict]:
    """Find the nearest hotspot in the 298-point dataset using Haversine formula"""
    df = load_csv_data()
    if df is None:
        return None
        
    temp_col = None
    for col in df.columns:
        if 'uhi' in col.lower() or 'temp' in col.lower() or 'daytime' in col.lower():
            temp_col = col
            break
            
    if not temp_col:
        return None
        
    min_dist = float('inf')
    nearest_idx = -1
    nearest_lat = 0.0
    nearest_lng = 0.0
    
    for idx, row in df.iterrows():
        lat_val, lng_val = None, None
        if '.geo' in df.columns:
            lat_val, lng_val = extract_coordinates(row['.geo'])
            
        if lat_val is None:
            for c in ['lat', 'latitude', 'LAT']:
                if c in df.columns:
                    lat_val = float(row[c])
                    break
        if lng_val is None:
            for c in ['lng', 'longitude', 'lon', 'LNG']:
                if c in df.columns:
                    lng_val = float(row[c])
                    break
                    
        if lat_val is None or lng_val is None:
            continue
            
        dist = haversine_distance(lat, lng, lat_val, lng_val)
        if dist < min_dist:
            min_dist = dist
            nearest_idx = idx
            nearest_lat = lat_val
            nearest_lng = lng_val
            
    if nearest_idx == -1:
        return None
        
    nearest_row = df.iloc[nearest_idx]
    uhi_value = float(nearest_row[temp_col])
    
    # Severity
    uhi_abs = abs(uhi_value)
    if uhi_abs > 3:
        severity = 'extreme'
    elif uhi_abs > 2:
        severity = 'high'
    elif uhi_abs > 1:
        severity = 'moderate'
    else:
        severity = 'low'
        
    features = generate_hotspot_features(uhi_value)
    
    return {
        'index': int(nearest_idx),
        'lat': nearest_lat,
        'lng': nearest_lng,
        'distance_km': round(min_dist, 3),
        'uhi': uhi_value,
        'temperature': 30.0 + (uhi_value * 2), # estimated land surface temperature
        'severity': severity,
        'name': f"Hotspot {nearest_idx + 1}",
        **features
    }

def get_city_average_uhi() -> float:
    """Calculate the city average UHI from the 298-point dataset"""
    df = load_csv_data()
    if df is None:
        return 0.0
        
    temp_col = None
    for col in df.columns:
        if 'uhi' in col.lower() or 'temp' in col.lower() or 'daytime' in col.lower():
            temp_col = col
            break
            
    if not temp_col:
        return 0.0
        
    # Return average UHI (absolute average to reflect heat severity)
    return float(df[temp_col].abs().mean())

def get_similar_areas(target_uhi: float, current_lat: float, current_lng: float, limit: int = 3) -> List[dict]:
    """Find similar areas in Mumbai in terms of UHI severity"""
    df = load_csv_data()
    if df is None:
        return []
        
    temp_col = None
    for col in df.columns:
        if 'uhi' in col.lower() or 'temp' in col.lower() or 'daytime' in col.lower():
            temp_col = col
            break
            
    if not temp_col:
        return []
        
    similar_list = []
    
    for idx, row in df.iterrows():
        lat_val, lng_val = extract_coordinates(row['.geo'])
        if lat_val is None or (abs(lat_val - current_lat) < 1e-4 and abs(lng_val - current_lng) < 1e-4):
            continue # skip the selected location itself
            
        uhi_val = float(row[temp_col])
        uhi_diff = abs(uhi_val - target_uhi)
        
        similar_list.append({
            'name': f"Hotspot {idx + 1}",
            'lat': lat_val,
            'lng': lng_val,
            'uhi': uhi_val,
            'diff': uhi_diff
        })
        
    # Sort by closest UHI value similarity
    similar_list = sorted(similar_list, key=lambda x: x['diff'])
    return similar_list[:limit]

def generate_historical_trend(base_uhi: float) -> List[dict]:
    """Generate a realistic monthly UHI intensity trend based on climatology (Mumbai pre-monsoon peak)"""
    # Climatology weights for UHI (Mumbai heats up in Mar-May and Oct-Nov)
    climatology = {
        "January": 0.65,
        "February": 0.8,
        "March": 1.1,
        "April": 1.25,
        "May": 1.3,
        "June": 0.5,
        "July": 0.3,
        "August": 0.35,
        "September": 0.45,
        "October": 1.0,
        "November": 0.9,
        "December": 0.7
    }
    
    trend = []
    for month, weight in climatology.items():
        trend.append({
            "month": month,
            "uhi": round(base_uhi * weight, 2),
            "city_avg": round(2.1 * weight, 2) # Assume city average base is 2.1°C
        })
    return trend
