import { useState, useEffect } from 'react';
import Head from 'next/head';
import Map from '../components/Map';
import ScenarioPanel from '../components/ScenarioPanel';
import DriverExplanation from '../components/DriverExplanation';
import axios from 'axios';
import { Layers, Activity, Database, Thermometer, MapPin, Sparkles } from 'lucide-react';

export default function InterventionsPage() {
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('Loading...');
  const [activeTab, setActiveTab] = useState('scenario'); // 'scenario' | 'drivers'
  const [modelInfo, setModelInfo] = useState(null);

  // Fetch model health and data source info
  useEffect(() => {
    axios.get('http://localhost:8000/health')
      .then(res => setModelInfo(res.data))
      .catch(err => console.warn('Could not fetch model health:', err));
  }, []);

  // Fetch hotspots
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/hotspots')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch hotspots data');
        }
        return res.json();
      })
      .then(data => {
        const hotspotsData = data.hotspots || data;
        const source = data.source || 'API';
        setHotspots(Array.isArray(hotspotsData) ? hotspotsData : []);
        setDataSource(source);
        
        // Auto-select the first hotspot to guide the user and pre-populate the UI
        if (Array.isArray(hotspotsData) && hotspotsData.length > 0) {
          setSelectedHotspot(hotspotsData[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading hotspots:', err);
        // Fallback data
        const fallbackData = [
          { lat: 19.0760, lng: 72.8777, temperature: 42.5, severity: 'extreme', name: 'Mumbai Central', ndvi: 0.12, ndbi: 0.45, albedo: 0.15, population_density: 32000, building_height: 38, street_width: 11, uhi: 3.5 },
          { lat: 19.0850, lng: 72.8900, temperature: 38.2, severity: 'high', name: 'Bandra', ndvi: 0.18, ndbi: 0.38, albedo: 0.17, population_density: 21000, building_height: 28, street_width: 14, uhi: 2.3 },
          { lat: 19.0700, lng: 72.8600, temperature: 35.0, severity: 'moderate', name: 'Worli', ndvi: 0.22, ndbi: 0.32, albedo: 0.20, population_density: 16000, building_height: 22, street_width: 15, uhi: 1.6 },
          { lat: 19.0950, lng: 72.8800, temperature: 31.5, severity: 'low', name: 'Andheri', ndvi: 0.31, ndbi: 0.24, albedo: 0.22, population_density: 9000, building_height: 14, street_width: 18, uhi: 0.8 },
        ];
        setHotspots(fallbackData);
        setSelectedHotspot(fallbackData[0]);
        setDataSource('Sample Data');
        setLoading(false);
      });
  }, []);

  const handleMarkerClick = (hotspot) => {
    setSelectedHotspot(hotspot);
  };

  return (
    <>
      <Head>
        <title>Interventions & Diagnosis Dashboard - Urban Heat Mitigation</title>
        <meta name="description" content="Simulate scenario interventions and analyze heat driver attributions with SHAP explanations" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-slate-900 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-gray-800/80 shadow-sm">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 bg-clip-text text-transparent">
                🔬 Interventions & Diagnosis Pipeline
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Interactive control panel to simulate micro-climate interventions and compute SHAP explanations
              </p>
            </div>
            
            {/* Model & Source Status Banners */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-gray-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Source: <span className="text-blue-600 dark:text-blue-400">{dataSource} ({hotspots.length} points)</span></span>
              </div>

              {modelInfo && modelInfo.model_loaded && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100/30">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Model: <span className="font-mono font-bold">XGBoost ({modelInfo.trained_on_real_data ? 'Real Data' : 'Synthetic'})</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Main Grid: Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Map Column (Left) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-gray-800/80 relative">
                
                {/* Floating Map Info Header */}
                <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-slate-200/60 dark:border-gray-800/60 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Mumbai Heat Hotspots</h3>
                    <p className="text-[10px] text-slate-400">Click any marker to diagnose</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[550px] lg:h-[650px] bg-slate-50 dark:bg-gray-900/40">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-slate-500">Loading interactive geospatial layers...</p>
                  </div>
                ) : (
                  <div className="h-[550px] lg:h-[650px]">
                    <Map 
                      hotspots={hotspots} 
                      center={[19.0760, 72.8777]} 
                      zoom={11} 
                      onMarkerClick={handleMarkerClick}
                      selectedHotspot={selectedHotspot}
                    />
                  </div>
                )}
              </div>

              {/* Map Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/40 dark:border-gray-800/50 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">UHI Intensity Scale</span>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Extreme (&gt;3°C)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400" /> High (2-3°C)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400" /> Moderate (1-2°C)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Low (&lt;1°C)</span>
                </div>
              </div>
            </div>

            {/* Controls & Diagnosis Panel (Right) */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-slate-200/50 dark:border-gray-800/80 overflow-hidden min-h-[600px]">
              
              {/* Tab Selector Header */}
              <div className="flex border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/10">
                <button
                  onClick={() => setActiveTab('scenario')}
                  className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider transition-all duration-300 border-b-2 flex items-center justify-center gap-2 ${
                    activeTab === 'scenario'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-gray-800/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Simulation Scenario</span>
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider transition-all duration-300 border-b-2 flex items-center justify-center gap-2 ${
                    activeTab === 'drivers'
                      ? 'border-red-500 text-red-600 dark:text-red-400 bg-white dark:bg-gray-900'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-gray-800/20'
                  }`}
                >
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Drivers (SHAP)</span>
                </button>
              </div>

              {/* Dynamic Content Panel */}
              <div className="p-6">
                {activeTab === 'scenario' ? (
                  <ScenarioPanel hotspot={selectedHotspot} />
                ) : (
                  <DriverExplanation hotspot={selectedHotspot} />
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
