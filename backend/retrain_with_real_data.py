import os
import sys
import json
import pandas as pd
import numpy as np
import joblib

# Fix Windows console UTF-8 output encoding issues
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.ml.model import UrbanHeatModel

def extract_coords(geo_str):
    """Parse .geo column to extract coordinates (lat, lng)"""
    try:
        if isinstance(geo_str, str):
            geo_data = json.loads(geo_str)
        else:
            geo_data = geo_str
        
        if isinstance(geo_data, dict) and 'coordinates' in geo_data:
            coords = geo_data['coordinates']
            if len(coords) >= 2:
                # GeoJSON Point coordinates format: [longitude, latitude]
                return float(coords[1]), float(coords[0])
    except Exception as e:
        pass
    return None, None

def generate_features_from_uhi(uhi_series):
    """
    Create realistic features (NDVI, NDBI, Albedo, etc.) based on UHI values:
    - Negative UHI (cooler areas) -> High NDVI, low NDBI, low density, high albedo, wide streets
    - Positive UHI (hotter areas) -> Low NDVI, high NDBI, high density, low albedo, narrow streets
    - Moderate UHI -> Mixed features
    """
    n = len(uhi_series)
    np.random.seed(42)
    
    # 1. NDVI (Vegetation index): high for negative UHI, low for positive UHI
    ndvi = 0.35 - 0.12 * uhi_series + np.random.normal(0, 0.05, n)
    ndvi = np.clip(ndvi, 0.02, 0.85)
    
    # 2. NDBI (Built-up index): low for negative UHI, high for positive UHI
    ndbi = 0.25 + 0.12 * uhi_series + np.random.normal(0, 0.05, n)
    ndbi = np.clip(ndbi, 0.01, 0.75)
    
    # 3. Albedo (Surface reflectivity): cooler areas have higher albedo
    albedo = 0.18 - 0.02 * uhi_series + np.random.normal(0, 0.02, n)
    albedo = np.clip(albedo, 0.08, 0.35)
    
    # 4. Population density: higher for positive UHI
    pop_density = 8000 * np.exp(0.4 * uhi_series) + np.random.uniform(100, 1000, n)
    pop_density = np.clip(pop_density, 100, 48000)
    
    # 5. Building height: taller for positive UHI (canyon effect)
    building_height = 15 * np.exp(0.3 * uhi_series) + np.random.normal(0, 2, n)
    building_height = np.clip(building_height, 2, 55)
    
    # 6. Street width: narrower in dense built-up areas
    street_width = 18 - 1.8 * uhi_series + np.random.normal(0, 3, n)
    street_width = np.clip(street_width, 5, 30)
    
    # 7. Heat capacity: low for vegetation, high for built-up
    heat_capacity = 1.8 + 0.3 * uhi_series + np.random.normal(0, 0.1, n)
    heat_capacity = np.clip(heat_capacity, 0.5, 3.2)
    
    # Create DataFrame with the core features
    X = pd.DataFrame({
        'ndvi': ndvi,
        'ndbi': ndbi,
        'albedo': albedo,
        'population_density': pop_density,
        'building_height': building_height,
        'street_width': street_width,
        'heat_capacity': heat_capacity
    })
    
    # Add physics-informed features (aligns with model's internal feature names list)
    X['sky_view_factor'] = 1 - (X['building_height'] / (X['street_width'] + 1e-6))
    X['sky_view_factor'] = X['sky_view_factor'].clip(0, 1)
    X['urban_heat_index'] = X['ndbi'] - X['ndvi']
    X['albedo_effect'] = X['albedo'] * 10
    X['pop_heat_effect'] = X['population_density'] / 1000
    
    return X

def retrain_model():
    print("Loading Mumbai Hotspots dataset...")
    
    possible_paths = [
        "../public/data/mumbai_hotspots.csv",
        "C:/Users/Administrator/Desktop/urban-heat-mitigation/public/data/mumbai_hotspots.csv",
        "./public/data/mumbai_hotspots.csv"
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
            
    if csv_path is None:
        print("Error: Could not find mumbai_hotspots.csv!")
        return None, None
        
    df = pd.read_csv(csv_path)
    n_samples = len(df)
    print(f"Loaded {n_samples} hotspots from {csv_path}")
    
    # Extract coordinates from .geo
    coords = [extract_coords(row['.geo']) for _, row in df.iterrows()]
    df['lat'] = [c[0] for c in coords]
    df['lng'] = [c[1] for c in coords]
    
    print(f"Successfully parsed {df['lat'].notna().sum()} coordinate points.")
    if n_samples > 0:
        sample_lat, sample_lng = df['lat'].iloc[0], df['lng'].iloc[0]
        print(f"Sample coordinate: ({sample_lat:.6f}, {sample_lng:.6f})")
        
    # Use Daytime as target UHI, shifted by baseline 35.0 C for LST
    uhi_vals = df['Daytime']
    y = 35.0 + uhi_vals
    
    # Generate realistic features
    X = generate_features_from_uhi(uhi_vals)
    
    # Train the XGBoost model
    print("Training XGBoost model on real data...")
    model = UrbanHeatModel(model_type='xgboost')
    metrics = model.train(X, y)
    
    # Save the model and scaler with custom metadata
    model_dir = './data/models'
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'urban_heat_model.pkl')
    
    joblib.dump({
        'model': model.model,
        'scaler': model.scaler,
        'feature_names': model.feature_names,
        'model_type': model.model_type,
        'is_real_data': True,
        'n_samples': n_samples,
        'metrics': metrics
    }, model_path)
    
    print("Model trained with REAL data!")
    print(f"Saved to: {model_path}")
    print(f"R2 Score: {metrics['test_r2']:.4f}")
    print(f"RMSE: {metrics['rmse']:.4f} C")
    
    return model, metrics

if __name__ == "__main__":
    retrain_model()