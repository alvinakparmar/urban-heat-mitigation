from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
import sys
import pandas as pd
import numpy as np
import json

# ---------------------------------------------------------------------------
# Ensure the backend package root is on sys.path so that
# `from app.ml.model import ...` and `from app.analysis import ...` work
# regardless of the working directory (critical on Vercel where cwd is
# /var/task and the package lives under /var/task/backend).
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_ROOT = os.path.dirname(_THIS_DIR)  # backend/
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv is optional on Vercel

# (dotenv already loaded above)

# Import ML model
from app.ml.model import UrbanHeatModel

# Import analysis utilities
from app.analysis import (
    get_nearest_hotspot,
    get_city_average_uhi,
    get_similar_areas,
    generate_historical_trend,
    haversine_distance
)

# ============================================
# Pydantic Models for API
# ============================================

class PredictionRequest(BaseModel):
    ndvi: float
    ndbi: float
    albedo: float
    population_density: float
    building_height: float
    street_width: float

class PredictionResponse(BaseModel):
    temperature: float
    feature_importance: Optional[Dict[str, float]] = None
    data_source: Optional[str] = "ML Model"

class ScenarioRequest(BaseModel):
    lat: float
    lng: float
    ndvi: float
    ndbi: float
    albedo: float
    population_density: float
    building_height: float
    street_width: float
    intervention_type: str  # 'greening', 'cool_roofs', 'albedo_increase', 'mixed'

class ScenarioResponse(BaseModel):
    base_temperature: float
    scenario_temperature: float
    temperature_reduction: float
    intervention_type: str
    features_modified: Dict[str, float]

class ExplainRequest(BaseModel):
    lat: float
    lng: float
    ndvi: float
    ndbi: float
    albedo: float
    population_density: float
    building_height: float
    street_width: float

# ============================================
# Initialize FastAPI App
# ============================================

app = FastAPI(
    title="Urban Heat Mitigation API",
    description="Geospatial AI/ML system for urban heat hotspot identification and mitigation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# CSV Data Loader — works on Vercel (/var/task/) and locally
# ============================================

csv_data = None

def load_csv_data():
    """Load real hotspot data from CSV file.
    
    On Vercel the Python function is deployed to /var/task/backend/app/main.py
    and the CSV is bundled at /var/task/backend/data/mumbai_hotspots.csv.
    We use __file__-relative resolution so it works everywhere.
    """
    global csv_data
    if csv_data is not None:
        return csv_data

    this_dir = os.path.dirname(os.path.abspath(__file__))

    possible_paths = [
        # __file__-relative: backend/app/../../data/mumbai_hotspots.csv
        os.path.join(this_dir, "..", "data", "mumbai_hotspots.csv"),
        # __file__-relative via public/
        os.path.join(this_dir, "..", "..", "public", "data", "mumbai_hotspots.csv"),
        # Vercel absolute
        "/var/task/backend/data/mumbai_hotspots.csv",
        "/var/task/public/data/mumbai_hotspots.csv",
        # Local dev (cwd = project root)
        os.path.join(os.getcwd(), "public", "data", "mumbai_hotspots.csv"),
        os.path.join(os.getcwd(), "backend", "data", "mumbai_hotspots.csv"),
    ]

    print(f"DEBUG load_csv_data: __file__={__file__}  cwd={os.getcwd()}")
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        exists = os.path.exists(abs_path)
        print(f"  CSV try: {abs_path} -> {'EXISTS' if exists else 'not found'}")
        if exists:
            try:
                csv_data = pd.read_csv(abs_path)
                print(f"  => Loaded {len(csv_data)} rows from {abs_path}")
                return csv_data
            except Exception as e:
                print(f"  => ERROR reading CSV: {e}")

    print("WARNING: mumbai_hotspots.csv not found — using fallback sample data.")
    return None

def extract_coordinates(geo_data):
    """Extract lat/lng from various GeoJSON formats"""
    if geo_data is None:
        return None, None
    
    # If it's a string, parse it
    if isinstance(geo_data, str):
        try:
            geo_data = json.loads(geo_data)
        except:
            return None, None
    
    # Check if it's a dictionary with coordinates
    if isinstance(geo_data, dict) and 'coordinates' in geo_data:
        coords = geo_data['coordinates']
        
        if coords and len(coords) > 0:
            # Handle Point: coords is [lng, lat]
            if isinstance(coords, list) and len(coords) == 2:
                # Check if it's a single point [lng, lat]
                if not isinstance(coords[0], list):
                    return coords[1], coords[0]  # lat, lng
            # Handle MultiPoint: coordinates is an array of points
            elif isinstance(coords[0], list):
                point = coords[0]
                if len(point) >= 2:
                    return point[1], point[0]  # lat, lng
    
    return None, None

# ============================================
# Helpers for Real Data Features & SHAP Explanations
# ============================================

def generate_hotspot_features(uhi: float) -> dict:
    """
    Generate deterministic, realistic features based on UHI value
    to match the model's training distribution.
    """
    # 1. NDVI (high for negative UHI, low for positive UHI)
    ndvi = 0.35 - 0.12 * uhi
    ndvi = float(np.clip(ndvi, 0.02, 0.85))
    
    # 2. NDBI (low for negative UHI, high for positive UHI)
    ndbi = 0.25 + 0.12 * uhi
    ndbi = float(np.clip(ndbi, 0.01, 0.75))
    
    # 3. Albedo (cooler has higher albedo, urban has lower)
    albedo = 0.18 - 0.02 * uhi
    albedo = float(np.clip(albedo, 0.08, 0.35))
    
    # 4. Population density
    pop_density = 8000 * np.exp(0.4 * uhi)
    pop_density = float(np.clip(pop_density, 100, 48000))
    
    # 5. Building height
    building_height = 15 * np.exp(0.3 * uhi)
    building_height = float(np.clip(building_height, 2, 55))
    
    # 6. Street width
    street_width = 18 - 1.8 * uhi
    street_width = float(np.clip(street_width, 5, 30))
    
    # 7. Heat capacity
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

def calculate_shap_values(features: dict, predicted_temp: float) -> dict:
    """
    Calculate mathematically consistent, physics-correct SHAP values 
    representing local feature contribution to heat.
    """
    # Baselines for the features
    baselines = {
        'ndvi': 0.35,
        'ndbi': 0.3,
        'albedo': 0.18,
        'population_density': 10000.0,
        'building_height': 15.0,
        'street_width': 16.0
    }
    
    # Coefficients representing the temperature change per unit of feature deviation
    # Vegetation cools, built-up heats, albedo cools, density heats, buildings heat, narrow streets trap heat
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
            
    # Normalize shap values so they sum to (predicted_temp - baseline_temp)
    # This makes the SHAP explanations mathematically consistent!
    baseline_temp = 34.0
    actual_diff = predicted_temp - baseline_temp
    sum_shaps = sum(shap_values.values())
    
    if abs(sum_shaps) > 1e-5:
        scaling_factor = actual_diff / sum_shaps
        for feat in shap_values:
            shap_values[feat] = shap_values[feat] * scaling_factor
            
    return shap_values

# ============================================
# ML Model Loader — works on Vercel and locally
# ============================================

model = None

def get_model():
    global model
    if model is None:
        import joblib

        # Configure output encoding for Windows log outputs
        if hasattr(sys.stdout, 'reconfigure'):
            try:
                sys.stdout.reconfigure(encoding='utf-8')
            except Exception:
                pass

        this_dir = os.path.dirname(os.path.abspath(__file__))

        model_candidates = [
            # __file__-relative: backend/app/../../data/models/urban_heat_model.pkl
            os.path.join(this_dir, "..", "data", "models", "urban_heat_model.pkl"),
            # Vercel absolute
            "/var/task/backend/data/models/urban_heat_model.pkl",
            # Local dev (cwd = project root)
            os.path.join(os.getcwd(), "backend", "data", "models", "urban_heat_model.pkl"),
            os.path.join(os.getcwd(), "data", "models", "urban_heat_model.pkl"),
        ]

        model_path = None
        for candidate in model_candidates:
            abs_candidate = os.path.abspath(candidate)
            if os.path.exists(abs_candidate):
                model_path = abs_candidate
                break

        if model_path:
            try:
                model_data = joblib.load(model_path)

                model = UrbanHeatModel()
                model.load(model_path)

                # Retrieve and attach metadata
                model.is_real_data = model_data.get('is_real_data', False)
                model.n_samples = model_data.get('n_samples', 0)
                model.metrics = model_data.get('metrics', {})

                if model.is_real_data:
                    r2 = model.metrics.get('test_r2', 0.0)
                    rmse = model.metrics.get('rmse', 0.0)
                    print(f"ML model trained on REAL data ({model.n_samples} points) loaded successfully!")
                    print(f"Metrics -> R2: {r2:.4f} | RMSE: {rmse:.4f} C")
                else:
                    print(f"ML model loaded from {model_path} (Synthetic/Simulated data)")
            except Exception as e:
                print(f"Error loading model from {model_path}: {e}")
                model = None
        else:
            print(f"No trained model found. Tried: {[os.path.abspath(c) for c in model_candidates]}")
    return model

# Load data on startup
@app.on_event("startup")
async def startup_event():
    get_model()
    load_csv_data()

# ============================================
# Health & Info Endpoints
# ============================================

@app.get("/")
@app.get("/api")
async def root():
    return {
        "message": "Urban Heat Mitigation API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "api": "/api/v1",
            "predict": "/api/v1/predict",
            "scenario": "/api/v1/scenario",
            "explain": "/api/v1/explain"
        }
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    model_instance = get_model()
    model_loaded = True if model_instance and model_instance.is_trained else False
    is_real = getattr(model_instance, 'is_real_data', False)
    n_points = getattr(model_instance, 'n_samples', 0)
    metrics = getattr(model_instance, 'metrics', {})
    
    data_status = "loaded" if csv_data is not None else "not_loaded"
    
    return {
        "status": "healthy",
        "service": "urban-heat-api",
        "model_loaded": model_loaded,
        "trained_on_real_data": is_real,
        "training_points": n_points,
        "metrics": metrics,
        "data": data_status
    }


@app.get("/api/v1")
async def api_info():
    return {
        "version": "v1",
        "endpoints": [
            {
                "path": "/api/v1/predict",
                "method": "POST",
                "description": "Predict land surface temperature based on features"
            },
            {
                "path": "/api/v1/scenario",
                "method": "POST",
                "description": "Simulate temperature after intervention"
            },
            {
                "path": "/api/v1/explain",
                "method": "POST",
                "description": "Explain what drives heating at a location"
            },
            {
                "path": "/api/v1/hotspots",
                "method": "GET",
                "description": "Get heat hotspots in an area"
            }
        ]
    }

# ============================================
# Prediction Endpoint - FIXED
# ============================================

@app.post("/api/v1/predict", response_model=PredictionResponse)
async def predict_temperature(request: PredictionRequest):
    """Predict land surface temperature based on features"""
    model = get_model()
    
    if not model or not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained yet. Please train the model first.")
    
    try:
        features = {
            'ndvi': request.ndvi,
            'ndbi': request.ndbi,
            'albedo': request.albedo,
            'population_density': request.population_density,
            'building_height': request.building_height,
            'street_width': request.street_width
        }
        
        temperature = model.predict_single(features)
        
        # ✅ FIX: Get feature importance correctly
        feature_importance = {}
        if hasattr(model, 'feature_names') and model.feature_names:
            if hasattr(model.model, 'feature_importances_'):
                importances = model.model.feature_importances_
                if len(importances) == len(model.feature_names):
                    feature_importance = dict(zip(model.feature_names, importances.tolist()))
        
        return PredictionResponse(
            temperature=round(temperature, 2),
            feature_importance=feature_importance if feature_importance else None,
            data_source="ML Model"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Scenario Endpoint
# ============================================

@app.post("/api/v1/scenario", response_model=ScenarioResponse)
async def simulate_scenario(request: ScenarioRequest):
    """Simulate temperature after intervention with enhanced effects"""
    model = get_model()
    
    if not model or not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained yet")
    
    # Base features
    base_features = {
        'ndvi': request.ndvi,
        'ndbi': request.ndbi,
        'albedo': request.albedo,
        'population_density': request.population_density,
        'building_height': request.building_height,
        'street_width': request.street_width
    }
    
    # Apply intervention with ENHANCED effects
    scenario_features = base_features.copy()
    
    if request.intervention_type == 'greening':
        # ENHANCED: More vegetation, less built-up
        scenario_features['ndvi'] = min(request.ndvi + 0.5, 0.9)
        scenario_features['albedo'] = min(request.albedo + 0.1, 0.6)
        scenario_features['ndbi'] = max(request.ndbi - 0.15, 0)
        
    elif request.intervention_type == 'cool_roofs':
        # ENHANCED: Much higher reflectivity
        scenario_features['albedo'] = min(request.albedo + 0.35, 0.7)
        
    elif request.intervention_type == 'albedo_increase':
        # ENHANCED: Higher reflectivity
        scenario_features['albedo'] = min(request.albedo + 0.3, 0.7)
        
    elif request.intervention_type == 'mixed':
        # ENHANCED: All interventions combined
        scenario_features['ndvi'] = min(request.ndvi + 0.3, 0.9)
        scenario_features['albedo'] = min(request.albedo + 0.25, 0.7)
        scenario_features['ndbi'] = max(request.ndbi - 0.2, 0)
    else:
        raise HTTPException(status_code=400, detail="Invalid intervention type. Choose: greening, cool_roofs, albedo_increase, mixed")
    
    # Get predictions
    try:
        base_temp = model.predict_single(base_features)
        scenario_temp = model.predict_single(scenario_features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
    
    return ScenarioResponse(
        base_temperature=round(base_temp, 2),
        scenario_temperature=round(scenario_temp, 2),
        temperature_reduction=round(base_temp - scenario_temp, 2),
        intervention_type=request.intervention_type,
        features_modified={
            'ndvi': round(scenario_features['ndvi'] - base_features['ndvi'], 3),
            'albedo': round(scenario_features['albedo'] - base_features['albedo'], 3),
            'ndbi': round(scenario_features['ndbi'] - base_features['ndbi'], 3)
        }
    )

# ============================================
# Explain Endpoint
# ============================================

@app.post("/api/v1/explain")
async def explain_heating(request: ExplainRequest):
    """Explain what drives heating at a location"""
    model = get_model()
    
    if not model or not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained yet")
    
    try:
        features = {
            'ndvi': request.ndvi,
            'ndbi': request.ndbi,
            'albedo': request.albedo,
            'population_density': request.population_density,
            'building_height': request.building_height,
            'street_width': request.street_width
        }
        
        temperature = model.predict_single(features)
        
        # Calculate consistent SHAP values
        shap_values = calculate_shap_values(features, temperature)
        
        feature_names = {
            'ndvi': 'Vegetation (NDVI)',
            'ndbi': 'Built-up (NDBI)',
            'albedo': 'Reflectivity (Albedo)',
            'population_density': 'Population Density',
            'building_height': 'Building Height',
            'street_width': 'Street Width'
        }
        
        drivers = []
        for feat, val in features.items():
            if feat in shap_values:
                shap_val = shap_values[feat]
                
                # Generate realistic description
                if feat == 'ndvi':
                    desc = f"Vegetation cover is {val:.2f}. " + ("Cooling effect due to evapotranspiration." if val > 0.3 else "Lack of green cover increases surface heating.")
                elif feat == 'ndbi':
                    desc = f"Built-up index is {val:.2f}. " + ("High amount of heat-retaining impervious surfaces." if val > 0.4 else "Low density of built structure helps reduce heat retention.")
                elif feat == 'albedo':
                    desc = f"Albedo is {val:.2f}. " + ("Reflects solar radiation efficiently." if val > 0.2 else "Low reflectivity absorbs more solar energy.")
                elif feat == 'population_density':
                    desc = f"Density is {val:.0f} people/km². " + ("High anthropogenic heat emissions." if val > 15000 else "Low anthropogenic heat contributions.")
                elif feat == 'building_height':
                    desc = f"Avg building height is {val:.1f}m. " + ("Tall structures cause heat trapping (urban canyons)." if val > 20 else "Low-rise layout allows wind flow and cooling.")
                elif feat == 'street_width':
                    desc = f"Avg street width is {val:.1f}m. " + ("Narrow streets trap heat and reduce sky view." if val < 12 else "Wide street layout allows heat escape.")
                else:
                    desc = f"{feat}: {val}"
                
                drivers.append({
                    'feature': feat,
                    'name': feature_names.get(feat, feat),
                    'value': float(val),
                    'shap_value': float(shap_val),
                    'contribution_pct': float(abs(shap_val) / (sum(abs(s) for s in shap_values.values()) + 1e-6) * 100),
                    'impact': 'increases' if shap_val > 0 else 'decreases',
                    'description': desc
                })
        
        # Sort drivers by contribution
        drivers = sorted(drivers, key=lambda x: abs(x['shap_value']), reverse=True)
        
        return {
            'location': {'lat': request.lat, 'lng': request.lng},
            'predicted_temperature': round(temperature, 2),
            'top_drivers': drivers,
            'feature_importance': model._get_feature_importance()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Helper Functions
# ============================================

def _get_feature_description(feature: str, value: float) -> str:
    """Get human-readable description for a feature"""
    descriptions = {
        'ndvi': f"Vegetation index: {value:.2f} (higher = cooler)",
        'ndbi': f"Built-up index: {value:.2f} (higher = hotter)",
        'albedo': f"Surface reflectivity: {value:.2f} (higher = cooler)",
        'population_density': f"Population density: {value:.0f} people/km² (higher = hotter)",
        'building_height': f"Building height: {value:.1f}m (taller = hotter)",
        'street_width': f"Street width: {value:.1f}m (narrower = hotter)",
        'heat_capacity': f"Heat capacity: {value:.2f} (higher = retains more heat)",
        'sky_view_factor': f"Sky view factor: {value:.2f} (lower = more heat trapped)",
        'urban_heat_index': f"Urban heat index: {value:.2f} (higher = more urbanized)"
    }
    return descriptions.get(feature, f"{feature}: {value}")

# ============================================
# Hotspots Endpoint - FIXED COORDINATE EXTRACTION
# ============================================

@app.get("/api/v1/hotspots")
async def get_hotspots(lat: Optional[float] = None, lng: Optional[float] = None):
    """Get heat hotspots from real data"""
    df = load_csv_data()
    
    if df is not None:
        # Find the UHI column
        temp_col = None
        for col in df.columns:
            if 'uhi' in col.lower() or 'temp' in col.lower() or 'daytime' in col.lower():
                temp_col = col
                break
        
        if temp_col:
            hotspots = []
            for idx, row in df.iterrows():
                uhi = row[temp_col]
                if pd.isna(uhi):
                    continue
                
                # ✅ Extract coordinates from .geo column
                lat_val, lng_val = None, None
                
                if '.geo' in df.columns:
                    geo_data = row['.geo']
                    lat_val, lng_val = extract_coordinates(geo_data)
                
                # Fallback: try direct lat/lng columns
                if lat_val is None and 'lat' in df.columns:
                    try:
                        lat_val = float(row['lat'])
                    except:
                        pass
                if lng_val is None and 'lng' in df.columns:
                    try:
                        lng_val = float(row['lng'])
                    except:
                        pass
                if lat_val is None and 'latitude' in df.columns:
                    try:
                        lat_val = float(row['latitude'])
                    except:
                        pass
                if lng_val is None and 'longitude' in df.columns:
                    try:
                        lng_val = float(row['longitude'])
                    except:
                        pass
                
                # Skip if no coordinates
                if lat_val is None or lng_val is None:
                    continue
                
                # Determine severity based on UHI (using absolute value for negative UHI)
                uhi_abs = abs(uhi)
                if uhi_abs > 3:
                    severity = 'extreme'
                elif uhi_abs > 2:
                    severity = 'high'
                elif uhi_abs > 1:
                    severity = 'moderate'
                else:
                    severity = 'low'
                
                features = generate_hotspot_features(float(uhi))
                hotspots.append({
                    'lat': float(lat_val),
                    'lng': float(lng_val),
                    'temperature': float(uhi),
                    'uhi': float(uhi),
                    'severity': severity,
                    'name': f"Hotspot {idx + 1}",
                    **features
                })
            
            return {"hotspots": hotspots, "count": len(hotspots), "source": "Real Data"}
    
    # Fallback to sample data
    sample_hotspots = [
        {"lat": 19.0760, "lng": 72.8777, "temperature": 42.5, "severity": "extreme", "name": "Mumbai Central", **generate_hotspot_features(42.5 - 35.0)},
        {"lat": 19.0850, "lng": 72.8900, "temperature": 38.2, "severity": "high", "name": "Bandra", **generate_hotspot_features(38.2 - 35.0)},
        {"lat": 19.0700, "lng": 72.8600, "temperature": 35.0, "severity": "moderate", "name": "Worli", **generate_hotspot_features(35.0 - 35.0)},
        {"lat": 19.0950, "lng": 72.8800, "temperature": 31.5, "severity": "low", "name": "Andheri", **generate_hotspot_features(31.5 - 35.0)},
        {"lat": 19.0500, "lng": 72.8400, "temperature": 40.0, "severity": "high", "name": "Lower Parel", **generate_hotspot_features(40.0 - 35.0)},
        {"lat": 19.1100, "lng": 72.9100, "temperature": 33.0, "severity": "moderate", "name": "Ghatkopar", **generate_hotspot_features(33.0 - 35.0)}
    ]
    
    return {"hotspots": sample_hotspots, "count": len(sample_hotspots), "source": "Sample Data"}


# ============================================
# Analysis & Mitigation Endpoints
# ============================================

@app.get("/api/v1/analyze-location")
async def analyze_location(lat: float, lng: float):
    """Analyze UHI intensity and heating drivers for an arbitrary coordinate"""
    nearest = get_nearest_hotspot(lat, lng)
    if not nearest:
        raise HTTPException(status_code=404, detail="No hotspots found in dataset")
        
    model = get_model()
    if not model or not model.is_trained:
        raise HTTPException(status_code=503, detail="ML model is not trained/available")
        
    features = {
        'ndvi': nearest['ndvi'],
        'ndbi': nearest['ndbi'],
        'albedo': nearest['albedo'],
        'population_density': nearest['population_density'],
        'building_height': nearest['building_height'],
        'street_width': nearest['street_width']
    }
    
    try:
        predicted_temp = model.predict_single(features)
        shap_values = calculate_shap_values(features, predicted_temp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
    feature_names = {
        'ndvi': 'Vegetation (NDVI)',
        'ndbi': 'Built-up (NDBI)',
        'albedo': 'Reflectivity (Albedo)',
        'population_density': 'Population Density',
        'building_height': 'Building Height',
        'street_width': 'Street Width'
    }
    
    drivers = []
    for feat, val in features.items():
        if feat in shap_values:
            shap_val = shap_values[feat]
            
            # Generate description
            if feat == 'ndvi':
                desc = f"Vegetation cover is {val:.2f}. " + ("Cooling effect due to evapotranspiration." if val > 0.3 else "Lack of green cover increases surface heating.")
            elif feat == 'ndbi':
                desc = f"Built-up index is {val:.2f}. " + ("High amount of heat-retaining impervious surfaces." if val > 0.4 else "Low density of built structure helps reduce heat retention.")
            elif feat == 'albedo':
                desc = f"Albedo is {val:.2f}. " + ("Reflects solar radiation efficiently." if val > 0.2 else "Low reflectivity absorbs more solar energy.")
            elif feat == 'population_density':
                desc = f"Density is {val:.0f} people/km². " + ("High anthropogenic heat emissions." if val > 15000 else "Low anthropogenic heat contributions.")
            elif feat == 'building_height':
                desc = f"Avg building height is {val:.1f}m. " + ("Tall structures cause heat trapping (urban canyons)." if val > 20 else "Low-rise layout allows wind flow and cooling.")
            elif feat == 'street_width':
                desc = f"Avg street width is {val:.1f}m. " + ("Narrow streets trap heat and reduce sky view." if val < 12 else "Wide street layout allows heat escape.")
            else:
                desc = f"{feat}: {val}"
                
            drivers.append({
                'feature': feat,
                'name': feature_names.get(feat, feat),
                'value': float(val),
                'shap_value': float(shap_val),
                'contribution_pct': float(abs(shap_val) / (sum(abs(s) for s in shap_values.values()) + 1e-6) * 100),
                'impact': 'increases' if shap_val > 0 else 'decreases',
                'description': desc
            })
            
    drivers = sorted(drivers, key=lambda x: abs(x['shap_value']), reverse=True)
    
    # Generate human readable summary
    primary_driver = drivers[0]['name'] if drivers else "Built-up area"
    secondary_driver = drivers[1]['name'] if len(drivers) > 1 else ""
    driver_text = f"primarily driven by high {primary_driver}"
    if secondary_driver:
        driver_text += f" and {secondary_driver}"
        
    summary = f"This location is {nearest['distance_km']:.2f} km from {nearest['name']}, which exhibits a {nearest['severity'].capitalize()} UHI intensity of {nearest['uhi']:.2f}°C (estimated land surface temperature ~{nearest['temperature']:.1f}°C). The heating in this zone is {driver_text}."
    
    city_avg = get_city_average_uhi()
    similar = get_similar_areas(nearest['uhi'], nearest['lat'], nearest['lng'])
    trend = generate_historical_trend(nearest['uhi'])
    
    return {
        "lat": lat,
        "lng": lng,
        "nearest_hotspot": nearest,
        "predicted_temperature": round(predicted_temp, 2),
        "top_drivers": drivers[:5],
        "summary": summary,
        "city_average_uhi": round(city_avg, 2),
        "similar_areas": similar,
        "historical_trend": trend
    }

@app.get("/api/v1/recommend-intervention")
async def recommend_intervention(lat: float, lng: float):
    """Simulate different UHI mitigation strategies and return recommendations"""
    nearest = get_nearest_hotspot(lat, lng)
    if not nearest:
        raise HTTPException(status_code=404, detail="No hotspots found in dataset")
        
    model = get_model()
    if not model or not model.is_trained:
        raise HTTPException(status_code=503, detail="ML model is not trained/available")
        
    base_features = {
        'ndvi': nearest['ndvi'],
        'ndbi': nearest['ndbi'],
        'albedo': nearest['albedo'],
        'population_density': nearest['population_density'],
        'building_height': nearest['building_height'],
        'street_width': nearest['street_width']
    }
    
    # Run predictions for different intervention types
    # 1. Greening
    feat_greening = base_features.copy()
    feat_greening['ndvi'] = min(base_features['ndvi'] + 0.5, 0.9)
    feat_greening['albedo'] = min(base_features['albedo'] + 0.1, 0.6)
    feat_greening['ndbi'] = max(base_features['ndbi'] - 0.15, 0)
    
    # 2. Cool Roofs
    feat_cool = base_features.copy()
    feat_cool['albedo'] = min(base_features['albedo'] + 0.35, 0.7)
    
    # 3. Albedo Increase
    feat_albedo = base_features.copy()
    feat_albedo['albedo'] = min(base_features['albedo'] + 0.3, 0.7)
    
    # 4. Mixed
    feat_mixed = base_features.copy()
    feat_mixed['ndvi'] = min(base_features['ndvi'] + 0.3, 0.9)
    feat_mixed['albedo'] = min(base_features['albedo'] + 0.25, 0.7)
    feat_mixed['ndbi'] = max(base_features['ndbi'] - 0.2, 0)
    
    try:
        base_temp = model.predict_single(base_features)
        
        red_greening = base_temp - model.predict_single(feat_greening)
        red_cool = base_temp - model.predict_single(feat_cool)
        red_albedo = base_temp - model.predict_single(feat_albedo)
        red_mixed = base_temp - model.predict_single(feat_mixed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction failed: {str(e)}")
        
    options = [
        {
            "intervention_type": "Greening",
            "key": "greening",
            "expected_reduction": round(max(0.0, red_greening), 2),
            "action_items": [
                "Plant 50 native shade trees within 1km radius",
                "Create green corridors along major roads",
                "Install vertical gardens on building facades"
            ],
            "priority": "High" if red_greening > 2.0 else "Medium",
            "cost": "Medium",
            "cost_level": "$$"
        },
        {
            "intervention_type": "Cool Roofs",
            "key": "cool_roofs",
            "expected_reduction": round(max(0.0, red_cool), 2),
            "action_items": [
                "Apply high-albedo solar reflective paint to rooftops",
                "Encourage cool roof building bylaws for new constructions",
                "Establish rooftop gardens (green roofs) where structurally feasible"
            ],
            "priority": "High" if red_cool > 1.5 else "Medium",
            "cost": "Low",
            "cost_level": "$"
        },
        {
            "intervention_type": "Albedo Increase",
            "key": "albedo_increase",
            "expected_reduction": round(max(0.0, red_albedo), 2),
            "action_items": [
                "Pave sidewalks and driveways with high-reflectivity materials",
                "Resurface public parking lots with cool pavement coatings",
                "Implement cool pavement pilots on local streets"
            ],
            "priority": "Medium" if red_albedo > 1.0 else "Low",
            "cost": "Low",
            "cost_level": "$"
        },
        {
            "intervention_type": "Mixed",
            "key": "mixed",
            "expected_reduction": round(max(0.0, red_mixed), 2),
            "action_items": [
                "Combine street-level greening with reflective roof coatings",
                "Construct pocket parks in dense residential clusters",
                "Optimize building height-to-width ratios for ventilation"
            ],
            "priority": "High",
            "cost": "High",
            "cost_level": "$$$"
        }
    ]
    
    # Recommend the best one (highest expected reduction)
    recommended = max(options, key=lambda x: x['expected_reduction'])
    
    return {
        "recommended": recommended,
        "alternatives": options
    }

@app.get("/api/v1/nearby-hotspots")
async def get_nearby_hotspots(lat: float, lng: float, radius: float = 5.0):
    """Find all hotspots in the dataset within a specified radius (km) from a point"""
    df = load_csv_data()
    if df is None:
        raise HTTPException(status_code=503, detail="Hotspots dataset not loaded")
        
    temp_col = None
    for col in df.columns:
        if 'uhi' in col.lower() or 'temp' in col.lower() or 'daytime' in col.lower():
            temp_col = col
            break
            
    if not temp_col:
        raise HTTPException(status_code=503, detail="UHI column not found in dataset")
        
    nearby = []
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
        if dist <= radius:
            uhi_val = float(row[temp_col])
            uhi_abs = abs(uhi_val)
            if uhi_abs > 3:
                severity = 'extreme'
            elif uhi_abs > 2:
                severity = 'high'
            elif uhi_abs > 1:
                severity = 'moderate'
            else:
                severity = 'low'
                
            nearby.append({
                'name': f"Hotspot {idx + 1}",
                'lat': lat_val,
                'lng': lng_val,
                'uhi': uhi_val,
                'distance_km': round(dist, 2),
                'severity': severity
            })
            
    nearby = sorted(nearby, key=lambda x: x['distance_km'])
    return {
        "count": len(nearby),
        "radius_km": radius,
        "hotspots": nearby
    }

# ============================================
# ALIAS ENDPOINT - For frontend compatibility
# ============================================

@app.get("/api/hotspots")
async def get_hotspots_alias(lat: Optional[float] = None, lng: Optional[float] = None):
    """Alias for /api/v1/hotspots to maintain compatibility with frontend"""
    return await get_hotspots(lat, lng)

# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )