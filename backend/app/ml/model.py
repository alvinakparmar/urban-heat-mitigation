import joblib
import xgboost as xgb
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

class UrbanHeatModel:
    def __init__(self, model_type='xgboost'):
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.is_trained = False
    
    def _get_required_features(self):
        """Get list of all required features"""
        return [
            'ndvi', 'ndbi', 'albedo', 'population_density', 
            'building_height', 'street_width', 'heat_capacity',
            'sky_view_factor', 'urban_heat_index', 'albedo_effect',
            'pop_heat_effect'
        ]
    
    def _build_complete_features(self, features):
        """Build complete feature set with defaults for missing features"""
        required = self._get_required_features()
        complete = {}
        
        for feat in required:
            if feat in features:
                complete[feat] = features[feat]
            else:
                # Set default values for missing features
                if feat == 'heat_capacity':
                    complete[feat] = 2.5
                elif feat == 'sky_view_factor':
                    complete[feat] = 0.6
                elif feat == 'urban_heat_index':
                    complete[feat] = features.get('ndbi', 0.4) - features.get('ndvi', 0.3)
                elif feat == 'albedo_effect':
                    complete[feat] = features.get('albedo', 0.2) * 10
                elif feat == 'pop_heat_effect':
                    complete[feat] = features.get('population_density', 5000) / 1000
                else:
                    complete[feat] = 0
        
        return complete
    
    def _add_physics_features(self, X):
        """Add physics-informed features"""
        X = X.copy()
        
        # Urban canyon effect (physics-based)
        if 'building_height' in X and 'street_width' in X:
            X['sky_view_factor'] = 1 - (X['building_height'] / (X['street_width'] + 1e-6))
            X['sky_view_factor'] = X['sky_view_factor'].clip(0, 1)
        
        # Combined urban heat index (physics-inspired)
        if 'ndvi' in X and 'ndbi' in X:
            X['urban_heat_index'] = X['ndbi'] - X['ndvi']
        
        # Albedo effect (higher albedo = cooler)
        if 'albedo' in X:
            X['albedo_effect'] = X['albedo'] * 10
        
        # Population density effect
        if 'population_density' in X:
            X['pop_heat_effect'] = X['population_density'] / 1000
        
        return X
    
    def _generate_sample_data(self, n_samples=1000):
        """Generate sample data for training"""
        np.random.seed(42)
        
        # Simulate geospatial features
        data = {
            'ndvi': np.random.uniform(0, 0.8, n_samples),
            'ndbi': np.random.uniform(0, 0.6, n_samples),
            'albedo': np.random.uniform(0.1, 0.5, n_samples),
            'population_density': np.random.uniform(100, 50000, n_samples),
            'building_height': np.random.uniform(5, 60, n_samples),
            'street_width': np.random.uniform(5, 30, n_samples),
            'land_use_type': np.random.choice(['urban_dense', 'urban_sparse', 'vegetation', 'industrial'], n_samples)
        }
        
        # Map land use to numerical values
        land_use_map = {'urban_dense': 2.5, 'urban_sparse': 1.8, 'vegetation': 0.5, 'industrial': 3.0}
        data['heat_capacity'] = [land_use_map[x] for x in data['land_use_type']]
        
        df = pd.DataFrame(data)
        
        # Add physics features
        df = self._add_physics_features(df)
        
        # Generate target (LST) with some noise based on features
        df['lst'] = (
            25 +  # base temperature
            -5 * df['ndvi'] +  # vegetation cools
            8 * df['ndbi'] +   # built-up heats
            2 * df['heat_capacity'] +
            0.001 * df['population_density'] +
            -2 * df['albedo'] +
            np.random.normal(0, 2, n_samples)  # noise
        )
        
        # Ensure realistic LST range
        df['lst'] = df['lst'].clip(20, 50)
        
        # Drop categorical columns (already encoded)
        df = df.drop('land_use_type', axis=1)
        
        return df
    
    def train(self, X=None, y=None, **kwargs):
        """Train the model on geospatial features"""
        if X is None or y is None:
            df = self._generate_sample_data(2000)
            y = df['lst']
            X = df.drop('lst', axis=1)
        
        self.feature_names = X.columns.tolist()
        
        # Add physics features if not already present
        X_engineered = self._add_physics_features(X)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X_engineered)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Choose model
        if self.model_type == 'xgboost':
            self.model = xgb.XGBRegressor(
                n_estimators=300,
                learning_rate=0.05,
                max_depth=8,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                **kwargs
            )
        else:
            self.model = RandomForestRegressor(
                n_estimators=300,
                max_depth=20,
                min_samples_split=5,
                random_state=42,
                **kwargs
            )
        
        # Train
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        y_pred = self.model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        return {
            'train_r2': float(train_score),
            'test_r2': float(test_score),
            'rmse': float(rmse),
            'feature_importance': self._get_feature_importance()
        }
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model not trained yet. Call train() first.")
        
        X_engineered = self._add_physics_features(X)
        X_scaled = self.scaler.transform(X_engineered)
        predictions = self.model.predict(X_scaled)
        return predictions.tolist()
    
    def predict_single(self, features):
        """Make prediction for a single location"""
        # Build complete features with all required fields
        complete_features = self._build_complete_features(features)
        X = pd.DataFrame([complete_features])
        return self.predict(X)[0]
    
    def _get_feature_importance(self):
        """Get feature importance scores"""
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            if self.feature_names:
                return dict(zip(self.feature_names, importances.tolist()))
        return {}
    
    def save(self, path):
        """Save model to disk"""
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'model_type': self.model_type
        }, path)
    
    def load(self, path):
        """Load model from disk"""
        import os
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        self.model_type = data.get('model_type', 'xgboost')
        self.is_trained = True