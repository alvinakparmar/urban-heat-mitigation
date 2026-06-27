import React, { useState } from 'react';
import RecommendationCard from './RecommendationCard';

export default function LocationAnalysis({ 
  data, 
  recommendations, 
  loading, 
  onClose,
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'mitigation' or 'comparison'
  const [showAllInterventions, setShowAllInterventions] = useState(false);

  if (loading) {
    return (
      <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Analyzing thermal profile...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 text-center py-12 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No Location Analyzed</h3>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Search for a location in Mumbai or click anywhere on the map to run real-time urban heat mitigation analysis.
        </p>
      </div>
    );
  }

  const {
    nearest_hotspot,
    predicted_temperature,
    top_drivers = [],
    summary,
    city_average_uhi,
    similar_areas = [],
    historical_trend = []
  } = data;

  const severityColors = {
    extreme: { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/30', indicator: '🔴' },
    high: { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500/30', indicator: '🟠' },
    moderate: { bg: 'bg-yellow-500/15', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/30', indicator: '🟡' },
    low: { bg: 'bg-green-500/15', text: 'text-green-700 dark:text-green-400', border: 'border-green-500/30', indicator: '🟢' }
  }[nearest_hotspot.severity] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', indicator: '⚪' };

  // Calculate percentage diff with city average
  const uhiDiffPct = city_average_uhi > 0 
    ? ((nearest_hotspot.uhi - city_average_uhi) / city_average_uhi) * 100 
    : 0;

  // Custom SVG path generator for historical trend
  const generateSvgPath = (points, width, height, valKey) => {
    if (!points || points.length === 0) return '';
    const maxVal = Math.max(...points.map(p => p[valKey]), 5);
    const minVal = Math.min(...points.map(p => p[valKey]), 0);
    const range = maxVal - minVal || 1;

    const xCoords = points.map((_, i) => (i / (points.length - 1)) * width);
    const yCoords = points.map(p => height - ((p[valKey] - minVal) / range) * (height - 20) - 10);

    let path = `M ${xCoords[0]} ${yCoords[0]}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier calculation
      const cpX1 = xCoords[i - 1] + (xCoords[i] - xCoords[i - 1]) / 2;
      const cpY1 = yCoords[i - 1];
      const cpX2 = xCoords[i - 1] + (xCoords[i] - xCoords[i - 1]) / 2;
      const cpY2 = yCoords[i];
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${xCoords[i]} ${yCoords[i]}`;
    }
    return path;
  };

  const generateSvgAreaPath = (points, width, height, valKey) => {
    const linePath = generateSvgPath(points, width, height, valKey);
    if (!linePath) return '';
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh]">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">Analyzed Zone</span>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate flex items-center gap-1.5 mt-0.5">
            📍 {nearest_hotspot.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-4 bg-white dark:bg-gray-900 shrink-0">
        {[
          { id: 'analysis', label: '📊 Thermal Profile' },
          { id: 'mitigation', label: '🌳 Interventions' },
          { id: 'comparison', label: '📈 Comparisons' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        
        {/* TAB 1: Thermal Profile & Drivers */}
        {activeTab === 'analysis' && (
          <>
            {/* Primary Metrics Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/10 text-center">
                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase block">UHI Intensity</span>
                <span className="text-xl sm:text-2xl font-black text-red-500 tracking-tight block mt-1">
                  {nearest_hotspot.uhi.toFixed(2)}°C
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border ${severityColors.bg} ${severityColors.text} ${severityColors.border}`}>
                  {severityColors.indicator} {nearest_hotspot.severity.toUpperCase()}
                </span>
              </div>

              <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/10 text-center">
                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase block">Estimated Temperature</span>
                <span className="text-xl sm:text-2xl font-black text-amber-500 tracking-tight block mt-1">
                  {nearest_hotspot.temperature.toFixed(1)}°C
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-2 font-medium">
                  Land Surface Temperature
                </span>
              </div>
            </div>

            {/* Distance Callout */}
            <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 text-xs text-gray-500 dark:text-gray-400">
              📏 Searched location is <span className="font-semibold text-gray-700 dark:text-gray-200">{nearest_hotspot.distance_km} km</span> from {nearest_hotspot.name} monitor point.
            </div>

            {/* Human Readable Summary */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Summary Analysis</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/30 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/50">
                {summary}
              </p>
            </div>

            {/* Drivers Chart (SHAP Contributions) */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Thermal Drivers (SHAP Explanation)</h3>
              <div className="space-y-3.5">
                {top_drivers.map(driver => {
                  const isHeating = driver.impact === 'increases';
                  const percent = Math.min(100, Math.max(5, driver.contribution_pct));
                  const barColor = isHeating 
                    ? 'bg-gradient-to-r from-red-400 to-red-500 dark:from-red-500 dark:to-red-600' 
                    : 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600';
                  
                  return (
                    <div key={driver.feature} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-1.5">
                          {isHeating ? '🔥' : '❄️'} {driver.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {driver.feature === 'population_density' 
                              ? `${driver.value.toLocaleString(undefined, {maximumFractionDigits:0})} p/km²` 
                              : driver.feature === 'building_height' || driver.feature === 'street_width'
                              ? `${driver.value.toFixed(1)}m`
                              : `${driver.value.toFixed(2)}`}
                          </span>
                          <span className={isHeating ? 'text-red-500 font-bold' : 'text-blue-500 font-bold'}>
                            ({isHeating ? '+' : ''}{driver.shap_value.toFixed(2)}°C)
                          </span>
                        </div>
                      </div>
                      
                      {/* Bar Track */}
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${barColor}`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {/* Tooltip Explanation text */}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {driver.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Interventions & Recommendations */}
        {activeTab === 'mitigation' && (
          <>
            {recommendations ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Recommended Mitigation</h3>
                  <RecommendationCard 
                    recommendation={recommendations.recommended} 
                    isRecommended={true} 
                  />
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4">
                  <button 
                    onClick={() => setShowAllInterventions(!showAllInterventions)}
                    className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
                  >
                    <span>{showAllInterventions ? '📂 Hide Alternative Strategies' : '📂 View Alternative Strategies'}</span>
                    <span>{showAllInterventions ? '▲' : '▼'}</span>
                  </button>
                  
                  {showAllInterventions && (
                    <div className="mt-4 space-y-4">
                      {recommendations.alternatives
                        .filter(alt => alt.key !== recommendations.recommended.key)
                        .map(alt => (
                          <RecommendationCard 
                            key={alt.key}
                            recommendation={alt} 
                            isRecommended={false} 
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400">
                Intervention model not available
              </div>
            )}
          </>
        )}

        {/* TAB 3: Comparisons & Historical trends */}
        {activeTab === 'comparison' && (
          <>
            {/* City Average Benchmark */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800/60">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">City-Wide Comparison</h3>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {nearest_hotspot.uhi.toFixed(2)}°C
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block">This Area</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-300 dark:text-gray-600 text-lg">vs</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {city_average_uhi.toFixed(2)}°C
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block">Mumbai Average</span>
                </div>
              </div>

              {/* Status Comparison statement */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs">
                {uhiDiffPct > 0 ? (
                  <>
                    <span className="text-red-500 text-base">⚠️</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      This location is <span className="font-bold text-red-500">{uhiDiffPct.toFixed(0)}% hotter</span> than the city average.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-500 text-base">✅</span>
                    <span className="text-gray-600 dark:text-gray-300">
                      This location is <span className="font-bold text-emerald-500">{Math.abs(uhiDiffPct).toFixed(0)}% cooler</span> than the city average.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Historical Climatology Graph */}
            {historical_trend.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Climatological UHI Trend</h3>
                  <div className="flex gap-2.5 text-[9px] font-semibold">
                    <span className="flex items-center gap-1 text-emerald-500">── This Area</span>
                    <span className="flex items-center gap-1 text-gray-400">--- City Avg</span>
                  </div>
                </div>

                {/* SVG Area Chart */}
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
                  <svg viewBox="0 0 400 160" className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="400" y2="40" stroke="#f1f5f9" strokeDasharray="3,3" className="dark:stroke-gray-800" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeDasharray="3,3" className="dark:stroke-gray-800" />
                    <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeDasharray="3,3" className="dark:stroke-gray-800" />

                    {/* Area fill */}
                    <path
                      d={generateSvgAreaPath(historical_trend, 400, 140, 'uhi')}
                      fill="url(#areaGradient)"
                    />

                    {/* Local Point Line */}
                    <path
                      d={generateSvgPath(historical_trend, 400, 140, 'uhi')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* City Average Line */}
                    <path
                      d={generateSvgPath(historical_trend, 400, 140, 'city_avg')}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />

                    {/* Values markers */}
                    {historical_trend.map((pt, idx) => {
                      const maxVal = Math.max(...historical_trend.map(p => p.uhi), 5);
                      const minVal = Math.min(...historical_trend.map(p => p.uhi), 0);
                      const range = maxVal - minVal || 1;
                      const x = (idx / (historical_trend.length - 1)) * 400;
                      const y = 140 - ((pt.uhi - minVal) / range) * 120 - 10;
                      
                      // Show dots for peak and low
                      if (pt.month === 'May' || pt.month === 'July') {
                        return (
                          <g key={pt.month}>
                            <circle cx={x} cy={y} r="4" fill="#10b981" />
                            <text x={x} y={y - 8} fontSize="9" fontWeight="bold" fill="#047857" className="dark:fill-emerald-400" textAnchor="middle">
                              {pt.uhi.toFixed(1)}°C
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })}
                  </svg>
                  
                  {/* X-Axis labels */}
                  <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 font-semibold px-1 mt-2">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Areas */}
            {similar_areas.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Similar Thermal Profiles</h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  {similar_areas.map(area => (
                    <div 
                      key={area.name}
                      onClick={() => onNavigate && onNavigate(area.lat, area.lng)}
                      className="px-4 py-3 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer flex items-center justify-between transition-colors text-xs sm:text-sm"
                    >
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        🔗 {area.name}
                      </span>
                      <span className="font-black text-gray-600 dark:text-gray-400">
                        {area.uhi.toFixed(2)}°C UHI
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
