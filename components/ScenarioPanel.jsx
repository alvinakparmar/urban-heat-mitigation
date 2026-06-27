import { useState, useEffect } from 'react';
import ScenarioComparison from './ScenarioComparison';
import { Sparkles, Info, RefreshCw, AlertTriangle, ArrowRight, Check } from 'lucide-react';

const INTERVENTIONS = [
  {
    id: 'greening',
    title: '🌿 Urban Greening',
    description: 'Add urban parks, street trees, and green roofs. Significantly increases vegetation cover and reduces building density.',
    impact: 'High cooling potential',
    color: 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'cool_roofs',
    title: '🏠 Cool Roofs',
    description: 'Apply solar-reflective coatings/materials on roofs to maximize solar reflectance. Ideal for high-density areas.',
    impact: 'Medium cooling potential',
    color: 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-500/10'
  },
  {
    id: 'albedo_increase',
    title: '☀️ Albedo Boost',
    description: 'Use cool pavements, light-colored concrete, and high-reflectivity road surfaces to minimize solar heat absorption.',
    impact: 'Medium-High cooling potential',
    color: 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10'
  },
  {
    id: 'mixed',
    title: '🔀 Mixed Strategy',
    description: 'A balanced package combining green roofs, street greening, and cool surface materials across the intervention zone.',
    impact: 'Maximum cooling potential',
    color: 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-500/10'
  }
];

export default function ScenarioPanel({ hotspot }) {
  const [selectedType, setSelectedType] = useState('greening');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const simulateScenario = async (type = selectedType) => {
    if (!hotspot) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        lat: hotspot.lat,
        lng: hotspot.lng,
        ndvi: hotspot.ndvi ?? 0.15,
        ndbi: hotspot.ndbi ?? 0.35,
        albedo: hotspot.albedo ?? 0.2,
        population_density: hotspot.population_density ?? 15000,
        building_height: hotspot.building_height ?? 25,
        street_width: hotspot.street_width ?? 12,
        intervention_type: type
      };

      const response = await fetch('http://localhost:8000/api/v1/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error simulating scenario:', err);
      setError(err.message || 'Failed to simulate scenario.');
    } finally {
      setLoading(false);
    }
  };

  // Re-run simulation when the hotspot or the selected type changes
  useEffect(() => {
    if (hotspot) {
      simulateScenario(selectedType);
    } else {
      setResult(null);
    }
  }, [hotspot, selectedType]);

  if (!hotspot) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-6 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <Sparkles className="w-12 h-12 text-gray-400 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No Location Selected</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          Click on any heat hotspot marker on the map to begin simulation and evaluate micro-climate interventions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Details Summary */}
      <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {hotspot.name || `Hotspot Location`}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Coordinate: {hotspot.lat.toFixed(5)}°, {hotspot.lng.toFixed(5)}°
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            hotspot.severity === 'extreme' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
            hotspot.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
            hotspot.severity === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
            'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
          }`}>
            {hotspot.severity} UHI
          </span>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
            UHI: {hotspot.uhi ? `${hotspot.uhi.toFixed(2)}°C` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Intervention Selectors */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
          Select Mitigation Intervention
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INTERVENTIONS.map((item) => {
            const isSelected = selectedType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? `border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20`
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900/40'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{item.title}</span>
                  {isSelected && (
                    <span className="p-0.5 rounded-full bg-blue-500 text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex-grow">
                  {item.description}
                </p>
                <span className={`inline-block text-[9px] font-semibold mt-2.5 px-2 py-0.5 rounded-full ${item.color}`}>
                  {item.impact}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation Results Display */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          Simulation Forecast
        </h4>

        {loading && (
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50/50 dark:bg-gray-800/10 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-xs text-gray-500">Running micro-climate simulation...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-900/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-semibold text-red-700 dark:text-red-400">Simulation Error</h5>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              <button
                onClick={() => simulateScenario()}
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Simulation
              </button>
            </div>
          </div>
        )}

        {!loading && !error && result && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-800/10 rounded-2xl border border-gray-100 dark:border-gray-800">
              <ScenarioComparison
                baseTemp={result.base_temperature}
                scenarioTemp={result.scenario_temperature}
                interventionType={result.intervention_type}
                reduction={result.temperature_reduction}
              />
            </div>

            {/* Parameter Modifications */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Underlying Feature Adjustments
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(result.features_modified).map(([feat, delta]) => {
                  const label = feat === 'ndvi' ? 'Vegetation (NDVI)' :
                                feat === 'albedo' ? 'Reflectivity (Albedo)' :
                                feat === 'ndbi' ? 'Built-up (NDBI)' : feat;
                  const isPositive = delta > 0;
                  const formattedDelta = isPositive ? `+${delta.toFixed(3)}` : delta.toFixed(3);

                  const beforeVal = hotspot[feat] ?? (feat === 'ndvi' ? 0.15 : feat === 'ndbi' ? 0.35 : 0.2);
                  const afterVal = beforeVal + delta;

                  return (
                    <div key={feat} className="p-3 bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800/80">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs text-gray-500">{beforeVal.toFixed(2)}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{afterVal.toFixed(2)}</span>
                      </div>
                      <span className={`inline-block text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-md ${
                        delta === 0 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                        isPositive ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                        'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {formattedDelta}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
