import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Inject pulse animation CSS
if (typeof document !== 'undefined') {
  const styleId = 'leaflet-pulse-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse-ring {
        0% { opacity: 0.6; stroke-dashoffset: 0; }
        50% { opacity: 0.3; }
        100% { opacity: 0.6; stroke-dashoffset: 20; }
      }
      .pulse-ring-marker {
        animation: pulse-ring 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function MapLeaflet({ hotspots, center, zoom, onMarkerClick, selectedHotspot, customMarker, onMapClick }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const selectionRingRef = useRef(null);
  const [map, setMap] = useState(null);

  // Set up map click handler
  useEffect(() => {
    if (!map || !onMapClick) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      onMapClick({ lat, lng });
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  // Initialize map once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || mapContainerRef.current === null) return;

    // Create map instance
    const mapInstance = L.map(mapContainerRef.current, {
      center: [center[0], center[1]],
      zoom: zoom,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    setMap(mapInstance);

    // Cleanup on unmount
    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update map view when center/zoom changes (compared by value, not by reference)
  useEffect(() => {
    if (!map) return;
    const mapCenter = map.getCenter();
    const latDiff = Math.abs(mapCenter.lat - center[0]);
    const lngDiff = Math.abs(mapCenter.lng - center[1]);
    const zoomDiff = Math.abs(map.getZoom() - zoom);
    if (latDiff > 0.0001 || lngDiff > 0.0001 || zoomDiff > 0.1) {
      map.setView([center[0], center[1]], zoom);
    }
  }, [map, center, zoom]);

  // Add heat hotspots to map
  useEffect(() => {
    if (!map || !hotspots || hotspots.length === 0) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });
    markersRef.current = [];
    selectionRingRef.current = null;

    // Add markers for each hotspot
    hotspots.forEach((hotspot, index) => {
      // Handle different data structures
      let lat, lng, temperature, severity, name;
      
      // Check if the hotspot has .geo property (from Earth Engine CSV)
      if (hotspot['.geo']) {
        try {
          const geoData = typeof hotspot['.geo'] === 'string' 
            ? JSON.parse(hotspot['.geo']) 
            : hotspot['.geo'];
          
          if (geoData && geoData.coordinates) {
            const coords = geoData.coordinates;
            // Point: coordinates is [lng, lat] directly
            if (geoData.type === 'Point' && Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === 'number') {
              lng = coords[0];
              lat = coords[1];
            }
            // MultiPoint/Polygon: coordinates is [[lng, lat], ...] or nested
            else if (Array.isArray(coords) && Array.isArray(coords[0])) {
              lng = coords[0][0];
              lat = coords[0][1];
            }
          }
        } catch (e) {
          console.warn('Error parsing geo data:', e);
        }
      }
      
      // If no lat/lng from geo, try direct properties
      if (!lat && hotspot.lat) lat = hotspot.lat;
      if (!lat && hotspot.latitude) lat = hotspot.latitude;
      if (!lat && hotspot.LAT) lat = hotspot.LAT;
      
      if (!lng && hotspot.lng) lng = hotspot.lng;
      if (!lng && hotspot.lon) lng = hotspot.lon;
      if (!lng && hotspot.longitude) lng = hotspot.longitude;
      if (!lng && hotspot.LNG) lng = hotspot.LNG;
      
      // Skip if no valid coordinates
      if (!lat || !lng) {
        console.warn('Skipping hotspot - no coordinates:', hotspot);
        return;
      }
      
      // Get UHI value (this is what the CSV has)
      let uhiValue = hotspot.uhi || hotspot.all_daytime_UHI || hotspot['all_daytime_UHI'] || hotspot.temperature || 0;
      uhiValue = parseFloat(uhiValue) || 0;
      
      // Calculate severity based on UHI intensity (using absolute value for negative UHI)
      const absUhi = Math.abs(uhiValue);
      if (absUhi > 3) severity = 'extreme';
      else if (absUhi > 2) severity = 'high';
      else if (absUhi > 1) severity = 'moderate';
      else severity = 'low';
      
      // Estimate actual temperature (base 30°C + UHI * 2)
      const estimatedTemp = 30 + (uhiValue * 2);
      
      // Get name
      name = hotspot.name || hotspot.Name || hotspot.location || `Hotspot ${index + 1}`;

      // Determine color based on severity
      let color = '#22c55e'; // green for low
      if (severity === 'moderate') color = '#fbbf24'; // yellow
      else if (severity === 'high') color = '#f59e0b'; // orange
      else if (severity === 'extreme') color = '#ef4444'; // red

      // Create circle marker with size based on UHI value
      const baseRadius = 15 + Math.abs(uhiValue * 5);
      const clampedRadius = Math.min(Math.max(baseRadius, 8), 45);

      // Check if this marker is the currently selected hotspot
      const isSelected = selectedHotspot &&
        Math.abs(parseFloat(selectedHotspot.lat) - parseFloat(lat)) < 0.0001 &&
        Math.abs(parseFloat(selectedHotspot.lng) - parseFloat(lng)) < 0.0001;

      const circle = L.circleMarker([lat, lng], {
        radius: isSelected ? clampedRadius + 5 : clampedRadius,
        fillColor: color,
        color: isSelected ? '#ffffff' : '#ffffff',
        weight: isSelected ? 4 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.9 : 0.7,
        className: `hotspot-marker${isSelected ? ' selected-hotspot' : ''}`,
      }).addTo(map);

      // If selected, add outer pulsing ring
      if (isSelected) {
        const ring = L.circleMarker([lat, lng], {
          radius: clampedRadius + 14,
          fillColor: 'transparent',
          fillOpacity: 0,
          color: color,
          weight: 2,
          opacity: 0.6,
          dashArray: '6, 4',
          className: 'pulse-ring-marker',
        }).addTo(map);
        selectionRingRef.current = ring;
      }

      // Build full hotspot data object for click callback
      const fullHotspotData = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        uhi: uhiValue,
        temperature: estimatedTemp,
        severity,
        name,
        ndvi: hotspot.ndvi,
        ndbi: hotspot.ndbi,
        albedo: hotspot.albedo,
        population_density: hotspot.population_density,
        building_height: hotspot.building_height,
        street_width: hotspot.street_width,
        heat_capacity: hotspot.heat_capacity,
        ...hotspot,
        // Ensure these are always set correctly
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        name,
        severity,
      };

      // Add popup with info
      circle.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 220px; padding: 4px;">
          <strong style="font-size: 16px;">${name}</strong><br/>
          <div style="margin-top: 6px;">
            <span style="color: #ef4444; font-weight: bold; font-size: 22px;">
              ${uhiValue.toFixed(2)}°C
            </span>
            <span style="color: #999; font-size: 12px;"> UHI</span>
          </div>
          <div style="margin-top: 2px;">
            <span style="color: #f59e0b; font-size: 16px;">
              ~${estimatedTemp.toFixed(1)}°C
            </span>
            <span style="color: #999; font-size: 12px;"> estimated LST</span>
          </div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
            <span style="color: #666; font-size: 13px;">Severity: </span>
            <span style="font-weight: bold; color: ${color}; font-size: 13px; text-transform: capitalize;">
              ${severity || 'Unknown'}
            </span>
          </div>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee; font-size: 11px; color: #888;">
            Click to analyze heat drivers
          </div>
        </div>
      `);

      // Add hover effect
      circle.on('mouseover', function() {
        this.openPopup();
      });

      // Add click handler for marker selection
      circle.on('click', function(e) {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e);
        }
        if (onMarkerClick) {
          onMarkerClick(fullHotspotData);
        }
      });

      markersRef.current.push({ circle, lat, lng, data: fullHotspotData });
    });

    // Add custom searched/clicked location marker if present
    if (customMarker && customMarker.lat && customMarker.lng) {
      const { lat, lng, name } = customMarker;

      const customCircle = L.circleMarker([lat, lng], {
        radius: 12,
        fillColor: '#8b5cf6', // purple
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
        className: 'custom-location-marker',
      }).addTo(map);

      const customRing = L.circleMarker([lat, lng], {
        radius: 22,
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#8b5cf6',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 4',
        className: 'pulse-ring-marker',
      }).addTo(map);

      customCircle.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 180px; padding: 4px;">
          <strong style="color: #8b5cf6; font-size: 14px;">📍 Selected Location</strong><br/>
          <div style="margin-top: 4px; font-size: 12px; color: #555;">${name || 'Custom Coordinates'}</div>
          <div style="margin-top: 4px; font-size: 11px; color: #999;">
            Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}
          </div>
        </div>
      `);

      customCircle.on('mouseover', function() {
        this.openPopup();
      });

      customCircle.on('click', function(e) {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e);
        }
      });
    }

  }, [map, hotspots, onMarkerClick, selectedHotspot, customMarker]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ height: '100%' }}
    />
  );
}