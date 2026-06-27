import os
import joblib
import pandas as pd
from .model import UrbanHeatModel

def train_model():
    """Train and save the Urban Heat model"""
    print("🌆 Training Urban Heat Model...")
    
    # Initialize model
    model = UrbanHeatModel(model_type='xgboost')
    
    # Train with generated sample data
    metrics = model.train()
    
    print(f"✅ Model trained successfully!")
    print(f"   - R² Score: {metrics['test_r2']:.4f}")
    print(f"   - RMSE: {metrics['rmse']:.4f}")
    print(f"   - Feature Importance: {metrics['feature_importance']}")
    
    # Save model
    os.makedirs('./data/models', exist_ok=True)
    model_path = './data/models/urban_heat_model.pkl'
    model.save(model_path)
    print(f"📁 Model saved to {model_path}")
    
    return model, metrics

if __name__ == "__main__":
    train_model()