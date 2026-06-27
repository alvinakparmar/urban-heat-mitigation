import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Leaf, Building, Sun, Users, Ruler, MapPin, TrendingUp, Thermometer, Database, Activity } from 'lucide-react';

export default function PredictPage() {
  const [formData, setFormData] = useState({
    ndvi: 0.3,
    ndbi: 0.4,
    albedo: 0.2,
    population_density: 5000,
    building_height: 30,
    street_width: 15
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('greening');

  // Model health / metadata state
  const [modelInfo, setModelInfo] = useState(null);

  // Fetch model health info on mount
  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/health`)
      .then(res => setModelInfo(res.data))
      .catch(err => console.warn('Could not fetch model health:', err));
  }, []);

  // Handle slider changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value)
    });
  };

  // Predict temperature
  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/predict`, formData);
      setResult(response.data);
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Failed to predict temperature. Make sure the backend is running.');
    }
    setLoading(false);
  };

  // Simulate scenario
  const handleScenario = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/scenario`, {
        lat: 19.0760,
        lng: 72.8777,
        ...formData,
        intervention_type: selectedScenario
      });
      setScenarioResult(response.data);
    } catch (error) {
      console.error('Scenario error:', error);
      alert('Failed to simulate scenario. Make sure the backend is running.');
    }
    setLoading(false);
  };

  // Prepare chart data
  const getChartData = () => {
    if (!result || !scenarioResult) return [];
    return [
      { name: 'Current', temperature: result.temperature },
      { name: 'After Intervention', temperature: scenarioResult.scenario_temperature }
    ];
  };

  const getFeatureImportanceData = () => {
    if (!result || !result.feature_importance) return [];
    const importance = result.feature_importance;
    const featureNames = {
      'pop_heat_effect': 'Population Density',
      'population_density': 'Density',
      'heat_capacity': 'Heat Capacity',
      'urban_heat_index': 'Urban Index',
      'ndbi': 'Built-up',
      'ndvi': 'Vegetation',
      'albedo': 'Reflectivity',
      'building_height': 'Building Height',
      'street_width': 'Street Width'
    };
    
    return Object.entries(importance)
      .filter(([key]) => key in featureNames)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, value]) => ({
        name: featureNames[key] || key,
        importance: Math.round(value * 100)
      }));
  };

  return (
    <>
      <Head>
        <title>Heat Predictor - Urban Heat Mitigation</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              🌡️ Urban Heat Predictor
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Enter your city parameters to predict temperature and test cooling interventions
            </p>

            {/* Model Info Badge */}
            {modelInfo && modelInfo.model_loaded && (
              <div className="mt-4 inline-flex flex-col sm:flex-row items-center gap-3 px-5 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    📊 Trained on:{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {modelInfo.trained_on_real_data ? `Mumbai City Data (${modelInfo.training_points} points)` : 'Synthetic Data'}
                    </span>
                  </span>
                </div>
                {modelInfo.metrics && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      <Activity className="w-3 h-3" />
                      R² Score: {(modelInfo.metrics.test_r2 || 0).toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                      <Thermometer className="w-3 h-3" />
                      RMSE: {(modelInfo.metrics.rmse || 0).toFixed(2)}°C
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Inputs */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  City Parameters
                </h2>

                {/* Sliders */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Leaf className="w-4 h-4 text-green-500" />
                      Vegetation (NDVI)
                      <span className="ml-auto text-orange-500 font-bold">{formData.ndvi}</span>
                    </label>
                    <input
                      type="range"
                      name="ndvi"
                      min="0"
                      max="0.9"
                      step="0.01"
                      value={formData.ndvi}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Building className="w-4 h-4 text-orange-500" />
                      Built-up Area (NDBI)
                      <span className="ml-auto text-orange-500 font-bold">{formData.ndbi}</span>
                    </label>
                    <input
                      type="range"
                      name="ndbi"
                      min="0"
                      max="0.8"
                      step="0.01"
                      value={formData.ndbi}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Sun className="w-4 h-4 text-yellow-500" />
                      Surface Reflectivity (Albedo)
                      <span className="ml-auto text-orange-500 font-bold">{formData.albedo}</span>
                    </label>
                    <input
                      type="range"
                      name="albedo"
                      min="0.1"
                      max="0.7"
                      step="0.01"
                      value={formData.albedo}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4 text-blue-500" />
                      Population Density (per km²)
                      <span className="ml-auto text-orange-500 font-bold">{formData.population_density}</span>
                    </label>
                    <input
                      type="range"
                      name="population_density"
                      min="100"
                      max="50000"
                      step="100"
                      value={formData.population_density}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Ruler className="w-4 h-4 text-purple-500" />
                      Building Height (m)
                      <span className="ml-auto text-orange-500 font-bold">{formData.building_height}m</span>
                    </label>
                    <input
                      type="range"
                      name="building_height"
                      min="5"
                      max="60"
                      step="1"
                      value={formData.building_height}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4 text-pink-500" />
                      Street Width (m)
                      <span className="ml-auto text-orange-500 font-bold">{formData.street_width}m</span>
                    </label>
                    <input
                      type="range"
                      name="street_width"
                      min="5"
                      max="30"
                      step="1"
                      value={formData.street_width}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>

                {/* Predict Button */}
                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? '⏳ Predicting...' : '🔮 Predict Temperature'}
                </button>
              </div>

              {/* Scenario Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-500" />
                  Test Interventions
                </h2>

                <div className="flex flex-wrap gap-2 mb-4">
                  {['greening', 'cool_roofs', 'albedo_increase', 'mixed'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedScenario(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedScenario === type
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {type.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleScenario}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? '⏳ Simulating...' : '🌱 Simulate Intervention'}
                </button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-red-500" />
                    Prediction Results
                  </h2>

                  <div className="text-center py-4">
                    <div className="text-6xl font-bold text-red-500">
                      {result.temperature}°C
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Predicted Land Surface Temperature</p>
                  </div>

                  {scenarioResult && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current</p>
                        <p className="text-2xl font-bold text-orange-500">{scenarioResult.base_temperature}°C</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">After Intervention</p>
                        <p className="text-2xl font-bold text-green-500">{scenarioResult.scenario_temperature}°C</p>
                      </div>
                    </div>
                  )}

                  {scenarioResult && scenarioResult.temperature_reduction > 0 && (
                    <div className="mt-4 bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">🌱 Temperature Reduction</p>
                      <p className="text-3xl font-bold text-green-600">
                        {scenarioResult.temperature_reduction}°C
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        By implementing {selectedScenario.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Feature Importance Chart */}
              {result && result.feature_importance && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">📊 What Drives the Heat?</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getFeatureImportanceData()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="importance" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Temperature Comparison Chart */}
              {scenarioResult && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">📈 Temperature Comparison</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="temperature" fill="#ef4444" radius={[4, 4, 0, 0]}>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}