import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('./MapLeaflet'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }
);

export default function Map({ 
  hotspots = [], 
  center = [19.0760, 72.8777], 
  zoom = 12, 
  onMarkerClick, 
  selectedHotspot,
  customMarker,
  onMapClick
}) {
  return (
    <MapComponent 
      hotspots={hotspots} 
      center={center} 
      zoom={zoom} 
      onMarkerClick={onMarkerClick} 
      selectedHotspot={selectedHotspot} 
      customMarker={customMarker}
      onMapClick={onMapClick}
    />
  );
}