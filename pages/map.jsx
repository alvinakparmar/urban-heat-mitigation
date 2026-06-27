import { useState, useEffect } from 'react';
import Map from '../components/Map';
import LocationSearch from '../components/LocationSearch';
import LocationAnalysis from '../components/LocationAnalysis';
import Head from 'next/head';

export default function MapPage() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('Loading...');

  // Selection states
  const [customLocation, setCustomLocation] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Map viewport states
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    // Fetch initial hotspot points
    fetch('http://localhost:8000/api/v1/hotspots')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        return res.json();
      })
      .then(data => {
        console.log('📊 API Response:', data);
        const hotspotsData = data.hotspots || data;
        const source = data.source || 'API';
        setHotspots(Array.isArray(hotspotsData) ? hotspotsData : []);
        setDataSource(source);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading hotspots:', err);
        const fallbackData = [
          { lat: 19.0760, lng: 72.8777, temperature: 42.5, severity: 'extreme', name: 'Mumbai Central' },
          { lat: 19.0850, lng: 72.8900, temperature: 38.2, severity: 'high', name: 'Bandra' },
          { lat: 19.0700, lng: 72.8600, temperature: 35.0, severity: 'moderate', name: 'Worli' },
          { lat: 19.0950, lng: 72.8800, temperature: 31.5, severity: 'low', name: 'Andheri' },
          { lat: 19.0500, lng: 72.8400, temperature: 40.0, severity: 'high', name: 'Lower Parel' },
          { lat: 19.1100, lng: 72.9100, temperature: 33.0, severity: 'moderate', name: 'Ghatkopar' },
        ];
        setHotspots(fallbackData);
        setDataSource('Sample Data');
        setLoading(false);
      });
  }, []);

  // Coordinate analysis handler
  const analyzeCoordinates = async (lat, lng, name = 'Custom Coordinates') => {
    setAnalysisLoading(true);
    setCustomLocation({ lat, lng, name });
    
    // Pan the map and zoom in
    setMapCenter([lat, lng]);
    setMapZoom(14);

    try {
      const [analysisRes, recRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/analyze-location?lat=${lat}&lng=${lng}`),
        fetch(`http://localhost:8000/api/v1/recommend-intervention?lat=${lat}&lng=${lng}`)
      ]);

      if (!analysisRes.ok || !recRes.ok) {
        throw new Error('Analysis fetch failed');
      }

      const analysisVal = await analysisRes.json();
      const recVal = await recRes.json();

      setAnalysisData(analysisVal);
      setRecommendationsData(recVal);
    } catch (err) {
      console.error('Error running analysis:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const totalHotspots = hotspots.length;
  const extremeCount = hotspots.filter(h => h.severity === 'extreme').length;
  const highCount = hotspots.filter(h => h.severity === 'high').length;
  const moderateCount = hotspots.filter(h => h.severity === 'moderate').length;
  const lowCount = hotspots.filter(h => h.severity === 'low').length;

  return (
    <>
      <Head>
        <title>Heat Hotspot Map - Urban Heat Mitigation</title>
        <meta name="description" content="Interactive map showing urban heat hotspots in Mumbai with real-time location search and mitigation analysis" />
      </Head>
      
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-center text-gray-800 dark:text-white tracking-tight">
          🌡️ Mumbai Heat Hotspot Map
        </h1>
        <p className="text-center mb-2 text-sm text-gray-500 dark:text-gray-400">
          Real surface urban heat island (SUHI) data from Earth Engine.
        </p>
        <p className="text-center text-xs mb-6 text-gray-400 dark:text-gray-500">
          Data Source: {dataSource} • {totalHotspots} points • Search any Mumbai location or click map for analysis
        </p>

        {/* Feature 1: Location Search Bar */}
        <div className="mb-6 relative z-[1000]">
          <LocationSearch 
            onLocationSelect={(loc) => analyzeCoordinates(loc.lat, loc.lng, loc.name)} 
          />
        </div>
        
        {/* Split Layout: Map & Side Panel */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch mb-8">
          
          {/* Map Section */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800/80 min-h-[450px] lg:min-h-[550px]">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[450px]">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading map data...</p>
                </div>
              </div>
            ) : (
              <Map 
                hotspots={hotspots} 
                center={mapCenter} 
                zoom={mapZoom} 
                onMarkerClick={(h) => analyzeCoordinates(h.lat, h.lng, h.name)}
                onMapClick={({ lat, lng }) => analyzeCoordinates(lat, lng, 'Clicked Map Location')}
                customMarker={customLocation}
                selectedHotspot={customLocation}
              />
            )}
          </div>

          {/* Feature 2, 3, 4: Analysis & Mitigation side panel */}
          {(analysisData || analysisLoading) && (
            <div className="w-full lg:w-[420px] shrink-0">
              <LocationAnalysis 
                data={analysisData}
                recommendations={recommendationsData}
                loading={analysisLoading}
                onClose={() => {
                  setAnalysisData(null);
                  setRecommendationsData(null);
                  setCustomLocation(null);
                }}
                onNavigate={(lat, lng) => {
                  setMapCenter([lat, lng]);
                  setMapZoom(15);
                }}
              />
            </div>
          )}
        </div>

        {/* Legend / Stats (shown when not loading) */}
        {!loading && hotspots.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow p-4 text-center">
                <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalHotspots}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Total</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow p-4 text-center">
                <p className="text-2xl font-black text-red-500">{extremeCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Extreme</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow p-4 text-center">
                <p className="text-2xl font-black text-orange-400">{highCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">High</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow p-4 text-center">
                <p className="text-2xl font-black text-yellow-400">{moderateCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Moderate</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow p-4 text-center">
                <p className="text-2xl font-black text-green-500">{lowCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Low</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm border border-white"></div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Extreme (&gt;3°C UHI)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-400 shadow-sm border border-white"></div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">High (2-3°C UHI)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-sm border border-white"></div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Moderate (1-2°C UHI)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm border border-white"></div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Low (&lt;1°C UHI)</span>
              </div>
            </div>
            <p className="text-center text-[10px] sm:text-xs mt-4 text-gray-400 dark:text-gray-500 font-medium">
              UHI = Urban Heat Island Intensity (difference from surrounding rural areas)
            </p>
          </div>
        )}
      </div>
    </>
  );
}