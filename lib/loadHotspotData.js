// lib/loadHotspotData.js
import fs from 'fs';
import path from 'path';

export function loadHotspotData() {
  // Read the CSV file from public/data
  const csvPath = path.join(process.cwd(), 'public/data/mumbai_hotspots.csv');
  const csvData = fs.readFileSync(csvPath, 'utf8');
  
  // Parse CSV
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  
  // Find column indices
  const latIdx = headers.findIndex(h => h.includes('lat') || h.includes('latitude'));
  const lngIdx = headers.findIndex(h => h.includes('lon') || h.includes('lng') || h.includes('longitude'));
  const uhiIdx = headers.findIndex(h => h.includes('all_daytime_UHI') || h.includes('UHI') || h.includes('uhi'));
  
  // Convert to hotspots
  const hotspots = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length <= Math.max(latIdx, lngIdx, uhiIdx)) continue;
    
    const uhi = parseFloat(values[uhiIdx]);
    if (isNaN(uhi)) continue;
    
    // Determine severity based on UHI value
    let severity = 'low';
    if (uhi > 4) severity = 'extreme';
    else if (uhi > 3) severity = 'high';
    else if (uhi > 2) severity = 'moderate';
    
    // Convert UHI to approximate temperature (°C)
    const temperature = 30 + (uhi * 2);
    
    hotspots.push({
      lat: parseFloat(values[latIdx]),
      lng: parseFloat(values[lngIdx]),
      temperature: temperature,
      severity: severity,
      uhi: uhi,
      name: `Hotspot ${i}`
    });
  }
  
  return hotspots;
}