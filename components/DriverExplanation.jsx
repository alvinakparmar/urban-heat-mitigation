import { useState, useEffect, useCallback } from 'react';
import { Thermometer, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Leaf, Building2, Sun, Users, Ruler, Wind } from 'lucide-react';

const FEATURE_ICONS = {
  ndvi: Leaf,
  ndbi: Building2,
  albedo: Sun,
  population_density: Users,
  building_height: Building2,
  street_width: Ruler,
};

const MITIGATION_MAP = {
  ndvi: {
    suggestion: 'Increase urban green cover — plant trees, rooftop gardens, green corridors',
    priority: 'High Priority',
    priorityColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  ndbi: {
    suggestion: 'Reduce impervious surfaces — use permeable pavements and reduce built-up density',
    priority: 'High Priority',
    priorityColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  albedo: {
    suggestion: 'Apply cool roofs and high-albedo coatings to reflect solar radiation',
    priority: 'Medium',
    priorityColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  population_density: {
    suggestion: 'Improve ventilation corridors and expand public cooling centers',
    priority: 'Medium',
    priorityColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  building_height: {
    suggestion: 'Enforce height regulations and wind corridor preservation in new developments',
    priority: 'Low',
    priorityColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  street_width: {
    suggestion: 'Widen streets where possible and add shaded pedestrian paths',
    priority: 'Low',
    priorityColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  heat_capacity: {
    suggestion: 'Use materials with lower thermal mass in construction and street surfaces',
    priority: 'Medium',
    priorityColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
};

function SkeletonBars() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" style={{ width: `${80 - i * 15}%` }} />
          <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function DriverExplanation({ hotspot, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const fetchExplanation = useCallback(async () => {
    if (!hotspot) return;

    setLoading(true);
    setError(null);
    setBarsAnimated(false);

    try {
      const features = {
        lat: hotspot.lat,
        lng: hotspot.lng,
        ndvi: hotspot.ndvi ?? 0.15,
        ndbi: hotspot.ndbi ?? 0.35,
        albedo: hotspot.albedo ?? 0.2,
        population_density: hotspot.population_density ?? 15000,
        building_height: hotspot.building_height ?? 25,
        street_width: hotspot.street_width ?? 12,
      };

      if (hotspot.heat_capacity !== undefined) {
        features.heat_capacity = hotspot.heat_capacity;
      }

      const response = await fetch('http://localhost:8000/api/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);

      // Trigger bar animation after a short delay
      setTimeout(() => setBarsAnimated(true), 100);
    } catch (err) {
      console.error('Failed to fetch SHAP explanation:', err);
      setError(err.message || 'Failed to load heat driver analysis');
    } finally {
      setLoading(false);
    }
  }, [hotspot]);

  useEffect(() => {
    fetchExplanation();
  }, [fetchExplanation]);

  const topDrivers = data?.top_drivers?.slice(0, 5) || [];
  const maxAbsShap = topDrivers.length > 0
    ? Math.max(...topDrivers.map((d) => Math.abs(d.shap_value || 0)), 0.01)
    : 1;

  const heatIncreasingDrivers = topDrivers.filter((d) => (d.shap_value || 0) > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20">
          <Thermometer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Heat Driver Analysis
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            SHAP-based feature attribution
          </p>
        </div>
      </div>

      {/* Predicted Temperature */}
      {data && !loading && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
            Predicted Temperature
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-red-600 dark:text-red-400">
              {(data.predicted_temperature || 0).toFixed(1)}
            </span>
            <span className="text-lg font-semibold text-red-500 dark:text-red-400">°C</span>
          </div>
          {data.location && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📍 Coordinate: {data.location.lat?.toFixed(5) ?? 'N/A'}°, {data.location.lng?.toFixed(5) ?? 'N/A'}°
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && <SkeletonBars />}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Analysis Failed</p>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>
          <button
            onClick={fetchExplanation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Top Drivers Bar Chart */}
      {!loading && !error && topDrivers.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Top Contributing Factors
          </h4>
          <div className="space-y-4">
            {topDrivers.map((driver, index) => {
              const isPositive = (driver.shap_value || 0) > 0;
              const absVal = Math.abs(driver.shap_value || 0);
              const pct = Math.abs(driver.contribution_pct || 0);
              const barWidth = barsAnimated ? (absVal / maxAbsShap) * 100 : 0;
              const IconComponent = FEATURE_ICONS[driver.feature] || TrendingUp;

              return (
                <div key={driver.feature || index} className="group">
                  {/* Feature Name & Percentage */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-3.5 h-3.5 ${isPositive ? 'text-red-500' : 'text-blue-500'}`} />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {driver.name || driver.feature}
                      </span>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 text-red-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                    <span className={`text-xs font-bold ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {isPositive ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Animated Bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-2 ${
                        isPositive
                          ? 'bg-gradient-to-r from-red-400 to-red-600'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}
                      style={{
                        width: `${Math.max(barWidth, 2)}%`,
                        transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        transitionDelay: `${index * 120}ms`,
                      }}
                    >
                      {barWidth > 20 && (
                        <span className="text-[10px] font-semibold text-white/90">
                          {absVal.toFixed(3)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {driver.description && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 pl-5 leading-relaxed">
                      {driver.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mitigation Recommendations */}
      {!loading && !error && heatIncreasingDrivers.length > 0 && (
        <div className="mt-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            Mitigation Recommendations
          </h4>
          <div className="space-y-3">
            {heatIncreasingDrivers.map((driver) => {
              const mitigation = MITIGATION_MAP[driver.feature] || {
                suggestion: `Reduce ${driver.name || driver.feature} exposure in this area`,
                priority: 'Medium',
                priorityColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              };

              return (
                <div
                  key={driver.feature}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mitigation.priorityColor}`}>
                      {mitigation.priority}
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {driver.name || driver.feature}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {mitigation.suggestion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
